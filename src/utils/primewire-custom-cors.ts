
/**
 * Dedicated CORS utility for Primewire Custom video source
 * This utility handles CORS requirements specifically for Primewire streams
 * and is isolated from the general-purpose cors-proxy-api.ts
 */

export interface PrimewireStreamResult {
  url: string;
  headers?: Record<string, string>;
}

/**
 * Process Primewire stream URL for CORS compliance
 * @param streamUrl The raw stream URL from Primewire provider
 * @param headers Optional headers from Primewire provider
 * @returns Processed stream result ready for react-player
 */
export function processPrimewireStream(
  streamUrl: string, 
  headers?: Record<string, string>
): PrimewireStreamResult {
  if (!streamUrl) {
    throw new Error('Stream URL is required');
  }

  // For Primewire streams, we might need to proxy through our worker
  // This is separate from the general CORS proxy to avoid conflicts
  if (streamUrl.includes('mixdrop') || streamUrl.includes('primewire')) {
    const proxyUrl = createPrimewireProxyUrl(streamUrl, headers);
    return {
      url: proxyUrl,
      headers: headers || {}
    };
  }

  // Return original URL if no special handling needed
  return {
    url: streamUrl,
    headers: headers || {}
  };
}

/**
 * Create a proxied URL specifically for Primewire streams
 * @param url The original stream URL
 * @param headers Optional headers to include
 * @returns Proxied URL
 */
function createPrimewireProxyUrl(url: string, headers?: Record<string, string>): string {
  const params = new URLSearchParams();
  params.append('url', url);
  params.append('source', 'primewire-custom');
  
  if (headers && Object.keys(headers).length > 0) {
    params.append('headers', JSON.stringify(headers));
  }
  
  return `/worker-proxy?${params.toString()}`;
}

/**
 * Extract stream URL from Primewire stream object
 * @param streamData Raw stream data from Primewire provider
 * @returns Processed stream result
 */
export function extractPrimewireStreamUrl(streamData: any): PrimewireStreamResult {
  if (!streamData) {
    throw new Error('No stream data provided');
  }

  // Handle array of streams (take first available)
  if (Array.isArray(streamData) && streamData.length > 0) {
    const stream = streamData[0];
    return processPrimewireStream(stream.link || stream.url, stream.headers);
  }

  // Handle single stream object
  if (typeof streamData === 'object' && (streamData.link || streamData.url)) {
    return processPrimewireStream(streamData.link || streamData.url, streamData.headers);
  }

  // Handle direct string URL
  if (typeof streamData === 'string') {
    return processPrimewireStream(streamData);
  }

  throw new Error('Invalid stream data format');
}
