// Cloudflare Worker CORS Proxy
// Save this as worker/index.js

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    // Accept optional headers param as JSON string
    const headersParam = url.searchParams.get('headers');
    if (!target) {
      return new Response('Missing url parameter', { status: 400 });
    }
    // Optional: Whitelist domains for security
    // const allowed = /^https:\/\/(.*\.)?(cdn-centaurus\.com|premilkyway\.com|tmdb-embed-api\.vercel\.app)\//;
    // if (!allowed.test(target)) {
    //   return new Response('Domain not allowed', { status: 403 });
    // }
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
      // Forward only allowed headers
      for (const [key, value] of Object.entries(customHeaders)) {
        // Only allow certain headers for security
        if (["referer", "origin", "user-agent"].includes(key.toLowerCase())) {
          upstreamHeaders.set(key, value);
        }
      }
      // Always set Accept header for HLS
      upstreamHeaders.set('Accept', '*/*');
      const upstreamResp = await fetch(target, {
        method: request.method,
        headers: upstreamHeaders,
        redirect: 'follow',
      });
      // Copy headers and set CORS
      const respHeaders = new Headers(upstreamResp.headers);
      respHeaders.set('Access-Control-Allow-Origin', '*');
      respHeaders.set('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
      respHeaders.set('Access-Control-Allow-Headers', '*');
      // For preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: respHeaders });
      }
      return new Response(upstreamResp.body, {
        status: upstreamResp.status,
        headers: respHeaders,
      });
    } catch (err) {
      return new Response('Proxy error: ' + err, { status: 502 });
    }
  }
};
