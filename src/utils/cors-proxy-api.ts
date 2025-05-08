
/**
 * CORS Proxy API utilities
 * Interface with our Cloudflare worker proxy for CORS-protected resources
 */

import { setProxyHeaders } from './iframe-proxy-sw';

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
    
    // Also register these headers with the service worker for future requests
    try {
      const domain = new URL(url).hostname;
      setProxyHeaders(domain, headers);
    } catch (e) {
      console.error('Failed to register proxy headers with service worker:', e);
    }
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
  // Register headers with service worker if provided
  if (headers) {
    try {
      const domain = new URL(url).hostname;
      setProxyHeaders(domain, headers);
    } catch (e) {
      console.error('Failed to register stream headers with service worker:', e);
    }
  }
  
  const params = new URLSearchParams();
  params.append('url', url);
  
  if (headers) {
    params.append('headers', JSON.stringify(headers));
  }
  
  return `/worker-proxy?${params.toString()}`;
}

/**
 * Parse an m3u8 file through our proxy to handle nested URLs
 */
export async function proxyAndRewriteM3u8(m3u8Url: string, headers?: Record<string, string>): Promise<string> {
  try {
    // Fetch the m3u8 file through our proxy
    const response = await fetchWithProxy(m3u8Url, headers);
    const content = await response.text();
    
    // Get base URL for relative paths
    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
    
    // Replace all relative URLs with absolute proxied URLs
    return content
      .split('\n')
      .map(line => {
        // Skip comments and empty lines
        if (line.startsWith('#') || line.trim() === '') {
          return line;
        }
        
        // Handle relative URLs for segments
        if (!line.startsWith('http')) {
          const absoluteUrl = baseUrl + line;
          return createProxyStreamUrl(absoluteUrl, headers);
        }
        
        // Already absolute URL
        return createProxyStreamUrl(line, headers);
      })
      .join('\n');
  } catch (error) {
    console.error('Failed to proxy and rewrite m3u8:', error);
    throw error;
  }
}
