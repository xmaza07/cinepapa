
/**
 * Custom Streaming API Integration
 * Provides utilities for working with the custom streaming API
 * 
 * Base URL: https://tmdb-embed-api.vercel.app/
 */

import { fetchWithProxy, createProxyStreamUrl } from './cors-proxy-api';

// Base URL for the custom streaming API
const BASE_URL = 'https://tmdb-embed-api.vercel.app';

/**
 * Interface for stream source file
 */
interface StreamSourceFile {
  file: string;
  type: string;
  quality: string;
  lang: string;
}

/**
 * Interface for stream source
 */
interface StreamSource {
  provider: string;
  files: StreamSourceFile[];
  subtitles: any[];
  headers?: Record<string, string>;
}

/**
 * Interface for API response
 */
interface ApiResponse {
  source: StreamSource;
}

/**
 * Fetch stream information for a movie
 * @param movieId The TMDB movie ID
 * @param provider The provider to use (2embed, etc.)
 */
export async function fetchMovieStream(movieId: string, provider = '2embed'): Promise<ApiResponse[]> {
  const url = `${BASE_URL}/movie/${provider}/${movieId}`;
  
  try {
    const response = await fetchWithProxy(url);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch movie stream:', error);
    throw error;
  }
}

/**
 * Fetch stream information for a TV show episode
 * @param tvId The TMDB TV show ID
 * @param season The season number
 * @param episode The episode number
 * @param provider The provider to use (2embed, etc.)
 */
export async function fetchTVStream(
  tvId: string, 
  season: number, 
  episode: number,
  provider = '2embed'
): Promise<ApiResponse[]> {
  const url = `${BASE_URL}/tv/${provider}/${tvId}/${season}/${episode}`;
  
  try {
    const response = await fetchWithProxy(url);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch TV stream:', error);
    throw error;
  }
}

/**
 * Get the best stream URL from the API response
 * @param data The API response data
 * @returns An object containing the stream URL and headers
 */
export function getBestStreamUrl(data: ApiResponse[]): { url: string | null; headers?: Record<string, string> } {
  if (!data || !data.length || !data[0].source || !data[0].source.files || !data[0].source.files.length) {
    return { url: null };
  }
  
  // Get the first source and its files
  const source = data[0].source;
  const files = source.files;
  
  // Find the highest quality HLS stream
  const hlsStreams = files.filter(file => file.type === 'hls');
  const bestStream = hlsStreams.length > 0 ? hlsStreams[0] : files[0];
  
  return { 
    url: bestStream.file,
    headers: source.headers
  };
}

/**
 * Create a proxied stream URL for a custom stream
 * @param streamData Stream data from the API
 */
export function createCustomStreamUrl(streamData: { url: string | null; headers?: Record<string, string> }): string | null {
  if (!streamData.url) {
    return null;
  }
  
  return createProxyStreamUrl(streamData.url, streamData.headers);
}
