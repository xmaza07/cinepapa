// iframe-proxy-sw.js - Service Worker to block iframe pop-ups and handle proxying
console.log('[IframeProxy] Service Worker initialized');

// Domains we're allowing to proxy through our service worker
const ALLOWED_HOSTNAMES = [
  'tmdb-embed-api.vercel.app',
  'cdn-centaurus.com',
  'premilkyway.com',
  'j5m9wakcpz.cdn-centaurus.com',
  'm3u8.streamifycdn.xyz',
  'uqloads.xyz',
  'embedsito.com',
  'swish.today'
];

// Common ad/tracking domains to block
const BLOCKED_DOMAINS = [
  'adservice',
  'doubleclick',
  'googlesyndication',
  'googleadservices',
  'tracker',
  'popads',
  'popcash',
  'propellerads',
  'exoclick',
  'trafficjunky',
  'juicyads'
];

// Whitelist specific analytics domains that we need
const ANALYTICS_WHITELIST = [
  'www.google-analytics.com',
  'analytics.google.com',
  'www.googletagmanager.com'
];

// Common popup patterns
const POPUP_PATTERNS = [
  'click', 'banner', 'pop', 'ad.', 'ads.', 'track', 
  'promo', 'window.open', '.php?', '.html?', 'redirect'
];

// Keep track of iframe origins
let knownIframeOrigins = new Set();
// Keep track of proxy headers for different domains
let proxyHeaders = new Map();
// Track navigation attempts to detect potential popups
let navigationAttempts = new Map();

self.addEventListener('install', (event) => {
  console.log('[IframeProxy] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[IframeProxy] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Listen for messages from main page
self.addEventListener('message', (event) => {
  const data = event.data;
  
  if (!data || !data.type) return;
  
  console.log('[IframeProxy] Received message:', data.type);
  
  switch (data.type) {
    case 'REGISTER_IFRAME_ORIGIN':
      console.log('[IframeProxy] Registering iframe origin:', data.origin);
      knownIframeOrigins.add(data.origin);
      break;
      
    case 'SET_PROXY_HEADERS':
      if (data.domain && data.headers) {
        console.log('[IframeProxy] Setting proxy headers for domain:', data.domain);
        proxyHeaders.set(data.domain, data.headers);
      }
      break;
      
    case 'CLEAR_DATA':
      // Reset all stored data - useful for debugging
      knownIframeOrigins.clear();
      proxyHeaders.clear();
      navigationAttempts.clear();
      console.log('[IframeProxy] Cleared all stored data');
      break;
  }
});

// Main fetch interceptor
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Handle proxy requests
  if (request.url.includes('/worker-proxy')) {
    handleProxyRequest(event);
    return;
  }
  
  // Skip same-origin non-navigation requests
  if (request.mode !== 'navigate' && url.origin === self.location.origin) {
    return;
  }
  
  // Log important requests for debugging
  if (request.mode === 'navigate' || request.destination === 'iframe') {
    console.log('[IframeProxy] Intercepted request:', {
      url: request.url,
      mode: request.mode,
      destination: request.destination,
      referrer: request.referrer
    });
  }
  
  // Check if this is a blocked domain
  if (isBlockedDomain(url.hostname)) {
    console.warn('[IframeProxy] Blocked request to ad/tracking domain:', url.hostname);
    event.respondWith(blockResponse('Ad or tracking domain blocked'));
    return;
  }
  
  // Check if this is likely a pop-up from an iframe
  if (isProbablyPopupFromIframe(request)) {
    console.warn('[IframeProxy] Blocked potential pop-up:', request.url);
    event.respondWith(blockResponse('Pop-up blocked'));
    return;
  }
  
  // Handle rapid navigation attempts (likely pop-up chains)
  if (request.mode === 'navigate') {
    const now = Date.now();
    const clientId = event.clientId;
    
    if (clientId) {
      const lastAttempt = navigationAttempts.get(clientId);
      if (lastAttempt && (now - lastAttempt.time < 1000)) {
        // Multiple navigation attempts in short succession
        lastAttempt.count++;
        
        if (lastAttempt.count > 3) {
          console.warn('[IframeProxy] Blocked rapid navigation chain:', request.url);
          event.respondWith(blockResponse('Too many navigation attempts'));
          return;
        }
      }
      
      navigationAttempts.set(clientId, {
        time: now,
        count: lastAttempt ? lastAttempt.count + 1 : 1,
        url: request.url
      });
    }
  }
  
  // If this is a known streaming URL that needs proxy help
  if (shouldUseProxy(url.hostname)) {
    console.log('[IframeProxy] Proxying streaming content:', url.hostname);
    
    // Check if we have custom headers for this domain
    const headers = proxyHeaders.get(url.hostname) || {};
    
    event.respondWith(
      fetch(request.url, {
        headers: {
          ...Object.fromEntries(request.headers),
          ...headers
        },
        mode: 'cors',
        credentials: 'omit'
      })
      .then(response => {
        // Add CORS headers to the response
        const modifiedHeaders = new Headers(response.headers);
        modifiedHeaders.set('Access-Control-Allow-Origin', '*');
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: modifiedHeaders
        });
      })
      .catch(error => {
        console.error('[IframeProxy] Proxy error:', error);
        return fetch(request);
      })
    );
    return;
  }
});

// Create a blocked response
function blockResponse(message) {
  return new Response(
    `<html><body style="background:#111;color:#fff;font-family:sans-serif;padding:20px;">
     <h2>Request Blocked</h2>
     <p>${message} by Service Worker</p>
     </body></html>`, 
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Handle proxy requests specifically
function handleProxyRequest(event) {
  const url = new URL(event.request.url);
  const targetUrl = url.searchParams.get('url');
  
  if (!targetUrl) {
    event.respondWith(new Response('Missing URL parameter', { status: 400 }));
    return;
  }
  
  // console.log('[IframeProxy] Proxying request to:', targetUrl);
  
  // Get any custom headers from URL or from our header store
  let customHeaders = {};
  const headersParam = url.searchParams.get('headers');
  
  if (headersParam) {
    try {
      customHeaders = JSON.parse(headersParam);
    } catch (e) {
      console.error('[IframeProxy] Failed to parse headers:', e);
    }
  } else {
    // Try to find headers for this domain
    const targetDomain = new URL(targetUrl).hostname;
    const storedHeaders = proxyHeaders.get(targetDomain);
    if (storedHeaders) {
      customHeaders = storedHeaders;
    }
  }
  
  // Create a new request with appropriate headers
  const proxyRequest = new Request(targetUrl, {
    method: event.request.method,
    headers: {
      ...Object.fromEntries(event.request.headers),
      ...customHeaders,
      'Origin': new URL(targetUrl).origin,
      'Referer': new URL(targetUrl).origin
    },
    body: event.request.body,
    mode: 'cors',
    credentials: 'omit'
  });
  
  event.respondWith(
    fetch(proxyRequest)
      .then(response => {
        // Log successful response
        // console.log('[IframeProxy] Proxy successful:', response.status);
        
        // Create a new response with CORS headers
        const modifiedHeaders = new Headers(response.headers);
        modifiedHeaders.set('Access-Control-Allow-Origin', '*');
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: modifiedHeaders
        });
      })
      .catch(error => {
        console.error('[IframeProxy] Proxy fetch error:', error);
        return new Response(`Proxy error: ${error.message}`, { status: 500 });
      })
  );
}

// Helper function to determine if a request is likely a pop-up from an iframe
function isProbablyPopupFromIframe(request) {
  // Only check navigation requests
  if (request.mode !== 'navigate') {
    return false;
  }
  
  // If we have a referrer
  if (request.referrer) {
    const referrerUrl = new URL(request.referrer);
    
    // Check known iframe origins
    if (knownIframeOrigins.has(referrerUrl.origin)) {
      // Navigation from a known iframe origin is suspicious
      return true;
    }
  }
  
  // Check the URL for common popup patterns
  const url = request.url.toLowerCase();
  
  // Check for common popup patterns
  if (POPUP_PATTERNS.some(pattern => url.includes(pattern))) {
    return true;
  }
  
  // Check for target=_blank or window.open
  if (url.includes('target=_blank') || url.includes('window.open')) {
    return true;
  }
  
  return false;
}

// Helper to check if hostname is a blocked ad/tracking domain
function isBlockedDomain(hostname) {
  hostname = hostname.toLowerCase();
  
  // Check whitelist first
  if (ANALYTICS_WHITELIST.some(domain => hostname === domain)) {
    return false;
  }
  
  // Then check blocked domains
  return BLOCKED_DOMAINS.some(domain => hostname.includes(domain));
}

// Helper to check if URL should use our CORS proxy
function shouldUseProxy(hostname) {
  return ALLOWED_HOSTNAMES.some(allowed => hostname.includes(allowed));
}

// Helper to create a proxy URL
function createProxyUrl(originalUrl) {
  // Use our existing Cloudflare worker proxy
  const proxyBase = '/worker-proxy';
  const encodedUrl = encodeURIComponent(originalUrl);
  return `${proxyBase}?url=${encodedUrl}`;
}
