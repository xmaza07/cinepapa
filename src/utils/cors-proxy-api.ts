
/**
 * CORS Proxy API utilities
 * Interface with our Cloudflare worker proxy for CORS-protected resources
 */

/**
 * Fetch a resource through our CORS proxy
 * @param url The URL to fetch
 * @param headers Optional headers to include in the request
 */
export async function fetchWithProxy(url: string, headers?: Record<string, string>) {
  // Build the proxy URL
  const params = new URLSearchParams();
  params.append('url', url);
  
  if (headers) {
    params.append('headers', JSON.stringify(headers));
  }
  
  // Use the worker proxy
  const proxyUrl = `/worker-proxy?${params.toString()}`;
  
  try {
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Proxy responded with status: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching through proxy:', error);
    throw error;
  }
}

/**
 * Stream a video through our CORS proxy
 * @param url The video URL to stream
 * @param headers Optional headers for the video request
 */
export function createProxyStreamUrl(url: string, headers?: Record<string, string>): string {
  const params = new URLSearchParams();
  params.append('url', url);
  
  if (headers) {
    params.append('headers', JSON.stringify(headers));
  }
  
  return `/worker-proxy?${params.toString()}`;
}
