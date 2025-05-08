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

// Keep track of iframe origins
let knownIframeOrigins = new Set();
// Keep track of proxy headers for different domains
let proxyHeaders = new Map();

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
  }
});

// Main fetch interceptor
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip intercepting same-origin requests that aren't navigation
  if (request.mode !== 'navigate' && url.origin === self.location.origin) {
    return;
  }
  
  // Handle different types of requests
  if (request.url.includes('/worker-proxy')) {
    // Handle proxy requests
    handleProxyRequest(event);
    return;
  }
  
  // Debug logging for intercepted requests
  console.log('[IframeProxy] Intercepted request:', {
    url: request.url,
    mode: request.mode,
    destination: request.destination
  });
  
  // Check if this is likely a pop-up from an iframe
  const isLikelyPopup = isProbablyPopupFromIframe(request);
  
  if (isLikelyPopup) {
    console.warn('[IframeProxy] Blocked potential pop-up:', request.url);
    
    // Return an empty page response instead of the requested resource
    event.respondWith(
      new Response('Pop-up blocked by service worker', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    );
    return;
  }
  
  // If this is a known streaming URL, proxy it through our CORS proxy
  if (shouldUseProxy(url.hostname)) {
    const proxyUrl = createProxyUrl(request.url);
    console.log('[IframeProxy] Proxying through CORS proxy:', proxyUrl);
    
    event.respondWith(
      fetch(proxyUrl)
        .then(response => {
          console.log('[IframeProxy] Proxy response status:', response.status);
          return response;
        })
        .catch(error => {
          console.error('[IframeProxy] Proxy error:', error);
          return fetch(request);
        })
    );
    return;
  }
});

// Handle proxy requests specifically
function handleProxyRequest(event) {
  const url = new URL(event.request.url);
  const targetUrl = url.searchParams.get('url');
  
  if (!targetUrl) {
    event.respondWith(new Response('Missing URL parameter', { status: 400 }));
    return;
  }
  
  console.log('[IframeProxy] Proxying request to:', targetUrl);
  
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
        console.log('[IframeProxy] Proxy successful:', response.status);
        
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
  // If we detect it's a navigation request and has a referer from a known iframe origin
  if (request.mode === 'navigate' && request.referrer) {
    const referrerUrl = new URL(request.referrer);
    
    // Check known iframe origins
    if (knownIframeOrigins.has(referrerUrl.origin)) {
      return true;
    }
    
    // Check for common popup patterns from streaming sites
    if (request.url.includes('ad') || 
        request.url.includes('popup') || 
        request.url.includes('banner') ||
        request.url.includes('track') ||
        request.url.includes('analytics') ||
        request.url.includes('trafficjunky') ||
        request.url.includes('popcash') ||
        request.url.includes('exoclick')) {
      return true;
    }
    
    // Check for window open attempts
    if (request.url.includes('window.open') || 
        request.url.includes('window_open')) {
      return true;
    }
  }
  
  return false;
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
