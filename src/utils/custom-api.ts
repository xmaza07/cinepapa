
import axios from 'axios';
import { ApiResponse } from './custom-api-types';
import { fetchMovieSources, fetchTVSources } from './custom-api-service';

// Proxy URL for m3u8 streams
const PROXY_URL = "https://m3u8proxy.chintanr21.workers.dev/";

/**
 * Validate if an HLS stream URL is accessible
 */
export const validateStreamUrl = async (url: string): Promise<boolean> => {
  try {
    // Check if URL is valid
    new URL(url);
    
    // Try to fetch the first segment of the HLS playlist
    const response = await axios.head(url, { 
      timeout: 5000,
      headers: {
        'Accept': '*/*',
        'Origin': window.location.origin,
        'Referer': window.location.origin
      }
    });
    
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.warn('Stream validation failed:', error);
    return false;
  }
};

/**
 * Apply proxy to HLS stream URL if needed
 */
export const getProxiedStreamUrl = (url: string): string => {
  try {
    // Only proxy URLs that are likely to have CORS issues
    if (url.includes('.m3u8') && !url.includes(window.location.hostname)) {
      return `${PROXY_URL}/v2?url=${encodeURIComponent(url)}`;
    }
    return url;
  } catch (error) {
    console.error('Error creating proxied URL:', error);
    return url;
  }
};

/**
 * Get movie stream URL with proxy applied if needed
 */
export const getMovieStream = async (movieId: number): Promise<string | null> => {
  try {
    const streamUrl = await fetchMovieSources(movieId);
    if (!streamUrl) return null;
    
    return getProxiedStreamUrl(streamUrl);
  } catch (error) {
    console.error('Error fetching movie stream:', error);
    return null;
  }
};

/**
 * Get TV show stream URL with proxy applied if needed
 */
export const getTVStream = async (tvId: number, season: number, episode: number): Promise<string | null> => {
  try {
    const streamUrl = await fetchTVSources(tvId, season, episode);
    if (!streamUrl) return null;
    
    return getProxiedStreamUrl(streamUrl);
  } catch (error) {
    console.error('Error fetching TV stream:', error);
    return null;
  }
};

export {
  fetchMovieSources,
  fetchTVSources
};
