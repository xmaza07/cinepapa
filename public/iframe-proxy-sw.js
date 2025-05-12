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

// Bypass control state
let bypassActive = false;
let bypassTimeout = null;
const MAX_BYPASS_DURATION = 3600000; // Maximum 1 hour bypass

// Function to handle bypass activation
function activateBypass(duration) {
  // Cap the duration to maximum allowed
  const bypassDuration = Math.min(duration || 300000, MAX_BYPASS_DURATION);
  
  bypassActive = true;
  console.log(`[IframeProxy] Blocking bypassed for ${bypassDuration/1000} seconds`);
  
  // Clear any existing timeout
  if (bypassTimeout) {
    clearTimeout(bypassTimeout);
  }
  
  // Set timeout to disable bypass
  bypassTimeout = setTimeout(() => {
    bypassActive = false;
    bypassTimeout = null;
    console.log('[IframeProxy] Blocking re-enabled automatically');
    
    // Notify all clients that bypass has ended
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'BYPASS_STATUS',
          active: false
        });
      });
    });
  }, bypassDuration);
}

// Keep track of iframe origins
let knownIframeOrigins = new Set();
// Keep track of proxy headers for different domains
let proxyHeaders = new Map();
// Track navigation attempts to detect potential popups
let navigationAttempts = new Map();

// Track performance metrics
const performanceMetrics = {
  cacheSize: 0,
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0
};

// Network condition simulation
let networkCondition = 'online';
let debugLevel = 'info';

self.addEventListener('install', (event) => {
  console.log('[IframeProxy] Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[IframeProxy] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Helper function to update metrics
async function updateMetrics() {
  try {
    const caches = await self.caches.keys();
    let totalSize = 0;
    
    for (const cacheName of caches) {
      const cache = await self.caches.open(cacheName);
      const requests = await cache.keys();
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    performanceMetrics.cacheSize = totalSize;
    
    // Notify all clients of metric update
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'METRICS_UPDATE',
          metrics: performanceMetrics
        });
      });
    });
  } catch (error) {
    console.error('[IframeProxy] Error updating metrics:', error);
  }
}

// Update metrics periodically
setInterval(updateMetrics, 30000); // Every 30 seconds

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
      
    case 'TOGGLE_BYPASS':
      if (data.enable) {
        activateBypass(data.duration);
        // Notify the requesting client of the new status
        event.source.postMessage({
          type: 'BYPASS_STATUS',
          active: true,
          duration: data.duration
        });
      } else {
        bypassActive = false;
        if (bypassTimeout) {
          clearTimeout(bypassTimeout);
          bypassTimeout = null;
        }
        console.log('[IframeProxy] Blocking re-enabled manually');
        // Notify the requesting client of the new status
        event.source.postMessage({
          type: 'BYPASS_STATUS',
          active: false
        });
      }
      break;
      
    case 'GET_BYPASS_STATUS':
      // Respond with current bypass status
      event.source.postMessage({
        type: 'BYPASS_STATUS',
        active: bypassActive
      });
      break;
      
    case 'CLEAR_DATA':
      // Reset all stored data - useful for debugging
      knownIframeOrigins.clear();
      proxyHeaders.clear();
      navigationAttempts.clear();
      bypassActive = false;
      if (bypassTimeout) {
        clearTimeout(bypassTimeout);
        bypassTimeout = null;
      }
      console.log('[IframeProxy] Cleared all stored data');
      break;
      
    case 'GET_METRICS':
      updateMetrics().then(() => {
        event.source.postMessage({
          type: 'METRICS_UPDATE',
          metrics: performanceMetrics
        });
      });
      break;
      
    case 'SIMULATE_NETWORK':
      if (data.condition) {
        networkCondition = data.condition;
        console.log(`[IframeProxy] Network condition set to: ${networkCondition}`);
      }
      break;
      
    case 'SET_DEBUG_LEVEL':
      if (data.level) {
        debugLevel = data.level;
        console.log(`[IframeProxy] Debug level set to: ${debugLevel}`);
      }
      break;
  }
});

// Main fetch interceptor
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Increment network requests counter
  performanceMetrics.networkRequests++;

  // Apply network condition simulation
  if (networkCondition !== 'online' && request.mode !== 'navigate') {
    switch (networkCondition) {
      case 'offline':
        event.respondWith(new Response('Simulated offline mode', { status: 503 }));
        return;
      case 'slow-3g':
        // Simulate slow 3G with delay
        event.respondWith(
          new Promise(resolve => {
            setTimeout(() => {
              resolve(fetch(request));
            }, 2000);
          })
        );
        return;
      case 'fast-3g':
        // Simulate fast 3G with shorter delay
        event.respondWith(
          new Promise(resolve => {
            setTimeout(() => {
              resolve(fetch(request));
            }, 500);
          })
        );
        return;
    }
  }
  
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
  
  // Only apply blocking if bypass is not active
  if (!bypassActive) {
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
  } else {
    // Log bypassed requests for security auditing
    if (isBlockedDomain(url.hostname) || isProbablyPopupFromIframe(request)) {
      console.log('[IframeProxy] Bypass active - allowing normally blocked request:', request.url);
    }
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
  
  // Set up storage access
  const storageAccessPromise = 'hasStorageAccess' in document ?
    document.hasStorageAccess().then(hasAccess => {
      if (!hasAccess) return document.requestStorageAccess();
    }).catch(() => {}) : Promise.resolve();
  
  // Get any custom headers from URL or from our header store
  let customHeaders = {
    'Sec-Fetch-Dest': 'iframe',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'Upgrade-Insecure-Requests': '1'
  };
  
  const headersParam = url.searchParams.get('headers');
  
  if (headersParam) {
    try {
      customHeaders = { ...customHeaders, ...JSON.parse(headersParam) };
    } catch (e) {
      console.error('[IframeProxy] Failed to parse headers:', e);
    }
  } else {
    // Try to find headers for this domain
    const targetDomain = new URL(targetUrl).hostname;
    const storedHeaders = proxyHeaders.get(targetDomain);
    if (storedHeaders) {
      customHeaders = { ...customHeaders, ...storedHeaders };
    }
  }
    // Create a new request with appropriate headers
  const proxyRequest = new Request(targetUrl, {
    method: event.request.method,
    headers: {
      ...Object.fromEntries(event.request.headers),
      ...customHeaders,
      'Origin': new URL(targetUrl).origin,
      'Referer': new URL(targetUrl).origin,
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    body: event.request.body,
    mode: 'cors',
    credentials: 'include'
  });
  
  event.respondWith(
    fetch(proxyRequest)      .then(response => {
        // Create a new response with enhanced CORS headers
        const modifiedHeaders = new Headers(response.headers);
        modifiedHeaders.set('Access-Control-Allow-Origin', '*');
        modifiedHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS, PUT');
        modifiedHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Range, Origin, Referer');
        modifiedHeaders.set('Access-Control-Allow-Private-Network', 'true');
        modifiedHeaders.set('Access-Control-Allow-Credentials', 'true');
        modifiedHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
        modifiedHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
        modifiedHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
        
        // Remove problematic headers
        ['X-Frame-Options', 'Content-Security-Policy', 'Frame-Options'].forEach(
          header => modifiedHeaders.delete(header)
        );
        
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

// Enhanced logging function
function log(level, ...args) {
  const levels = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(debugLevel);
  const msgLevelIndex = levels.indexOf(level);
  
  if (msgLevelIndex >= currentLevelIndex) {
    console[level]('[IframeProxy]', ...args);
  }
}

// Replace console.log calls with the new logging system
function logDebug(...args) { log('debug', ...args); }
function logInfo(...args) { log('info', ...args); }
function logWarn(...args) { log('warn', ...args); }
function logError(...args) { log('error', ...args); }
