// iframe-proxy-sw.js - Service Worker to block iframe pop-ups
console.log('[IframeProxy] Service Worker initialized');

const ALLOWED_HOSTNAMES = [
  'tmdb-embed-api.vercel.app',
  'cdn-centaurus.com',
  'premilkyway.com',
  'j5m9wakcpz.cdn-centaurus.com',
  'self'
];

// Keep track of iframe origins
let knownIframeOrigins = new Set();

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
  if (event.data && event.data.type === 'REGISTER_IFRAME_ORIGIN') {
    console.log('[IframeProxy] Registering iframe origin:', event.data.origin);
    knownIframeOrigins.add(event.data.origin);
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
  
  // Debug logging for all intercepted requests
  console.log('[IframeProxy] Intercepted request:', {
    url: request.url,
    mode: request.mode,
    destination: request.destination,
    referrer: request.referrer,
    headers: {
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin')
    }
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
  
  // If this is a known streaming URL, proxy it through the CORS proxy
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
        request.url.includes('analytics')) {
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
