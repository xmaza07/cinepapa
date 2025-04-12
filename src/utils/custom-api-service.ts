
import axios from 'axios';
import { ApiResponse, VideoFile, VideoSource } from './custom-api-types';
import { customApiConfig } from './custom-api-config';

/**
 * Fetch movie sources from the custom API
 */
export const fetchMovieSources = async (movieId: number): Promise<string | null> => {
  try {
    const response = await axios.get<ApiResponse[]>(`${customApiConfig.apiUrl}/movie/${movieId}`);
    return extractVideoUrl(response.data);
  } catch (error) {
    console.error('Error fetching movie sources:', error);
    return null;
  }
};

/**
 * Fetch TV show sources from the custom API
 */
export const fetchTVSources = async (tvId: number, season: number, episode: number): Promise<string | null> => {
  try {
    const response = await axios.get<ApiResponse[]>(`${customApiConfig.apiUrl}/tv/${tvId}?s=${season}&e=${episode}`);
    return extractVideoUrl(response.data);
  } catch (error) {
    console.error('Error fetching TV sources:', error);
    return null;
  }
};

/**
 * Create a proxied URL for HLS streams
 */
export const createProxiedUrl = (url: string, headers?: Record<string, string>): string => {
  const searchParams = new URLSearchParams();
  searchParams.set('url', url);
  
  if (headers && Object.keys(headers).length) {
    searchParams.set('headers', JSON.stringify(headers));
  }
  
  return `${customApiConfig.proxyUrl}/v2?${searchParams.toString()}`;
};

/**
 * Extract valid video URL from API response
 */
const extractVideoUrl = (data: ApiResponse[]): string | null => {
  try {
    // Process all responses to find a valid video file
    for (const item of data) {
      // Check for source with files
      if (item.source?.files?.length) {
        const file = item.source.files[0];
        const headers = item.source.headers || {};
        
        if (file.file && file.type === 'hls') {
          return createProxiedUrl(file.file, headers);
        }
      }
      
      // Check for sources array
      if (Array.isArray(item.sources)) {
        for (const source of item.sources) {
          if (source.files?.length) {
            const file = source.files[0];
            if (file.file && file.type === 'hls') {
              // Return the file URL for HLS content
              return file.file;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting video URL:', error);
  }
  
  return null;
};
