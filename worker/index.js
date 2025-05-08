
// Cloudflare Worker CORS Proxy

export default {
  async fetch(request, env, ctx) {
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    const url = new URL(request.url);
    
    // Handle proxy requests
    if (url.pathname === '/worker-proxy') {
      return handleProxy(request, url);
    }
    
    // Pass through all other requests
    return fetch(request);
  }
};

// Handle CORS preflight requests
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// Handle proxy requests
async function handleProxy(request, url) {
  const targetUrl = url.searchParams.get('url');
  const headersParam = url.searchParams.get('headers');
  
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }
  
  // Optional: Whitelist domains for security
  /*
  const allowed = /^https:\/\/(.*\.)?(cdn-centaurus\.com|premilkyway\.com|tmdb-embed-api\.vercel\.app)\//;
  if (!allowed.test(targetUrl)) {
    return new Response('Domain not allowed', { status: 403 });
  }
  */
  
  let customHeaders = {};
  if (headersParam) {
    try {
      customHeaders = JSON.parse(headersParam);
    } catch (e) {
      return new Response('Invalid headers param', { status: 400 });
    }
  }
  
  try {
    // Build headers for upstream request
    const upstreamHeaders = new Headers();
    
    // Copy allowed headers from original request
    const requestHeaders = request.headers;
    const forwardHeaders = ['accept', 'accept-encoding', 'accept-language', 'range'];
    
    for (const header of forwardHeaders) {
      const value = requestHeaders.get(header);
      if (value) {
        upstreamHeaders.set(header, value);
      }
    }
    
    // Add custom headers from the request
    for (const [key, value] of Object.entries(customHeaders)) {
      upstreamHeaders.set(key, value);
    }
    
    // Always set these headers for better compatibility
    upstreamHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    upstreamHeaders.set('Accept', '*/*');
    
    // Make the upstream request
    const upstreamResp = await fetch(targetUrl, {
      method: request.method,
      headers: upstreamHeaders,
      redirect: 'follow',
    });
    
    // Copy headers and set CORS
    const respHeaders = new Headers(upstreamResp.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
    respHeaders.set('Access-Control-Allow-Headers', '*');
    
    // Clean up problematic headers that might cause issues
    const removeHeaders = ['content-security-policy', 'x-frame-options', 'frame-options'];
    removeHeaders.forEach(header => respHeaders.delete(header));
    
    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { 
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    });
  }
}
