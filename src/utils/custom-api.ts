
import axios from 'axios';
import { ApiResponse } from './custom-api-types';
import { fetchMovieSources, fetchTVSources } from './custom-api-service';

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
 * Get movie stream URL with headers and subtitles
 */
export const getMovieStream = async (movieId: number): Promise<{
  url: string | null;
  headers: Record<string, string> | null;
  subtitles: Array<{lang: string; label: string; file: string}> | null;
}> => {
  try {
    return await fetchMovieSources(movieId);
  } catch (error) {
    console.error('Error fetching movie stream:', error);
    return { url: null, headers: null, subtitles: null };
  }
};

/**
 * Get TV show stream URL with headers and subtitles
 */
export const getTVStream = async (tvId: number, season: number, episode: number): Promise<{
  url: string | null;
  headers: Record<string, string> | null;
  subtitles: Array<{lang: string; label: string; file: string}> | null;
}> => {
  try {
    return await fetchTVSources(tvId, season, episode);
  } catch (error) {
    console.error('Error fetching TV stream:', error);
    return { url: null, headers: null, subtitles: null };
  }
};

export {
  fetchMovieSources,
  fetchTVSources
};
