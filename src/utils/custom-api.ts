import { ApiResponse } from './custom-api-types';
import { fetchMovieSources, fetchTVSources } from './custom-api-service';

/**
 * Validate if an HLS stream URL is accessible
 */
export const validateStreamUrl = async (url: string): Promise<boolean> => {
  try {
    // Check if URL is valid and non-empty
    if (!url || typeof url !== 'string' || url.trim() === '' || url === 'null') {
      console.warn('[validateStreamUrl] Invalid or empty URL:', url);
      return false;
    }
    console.log('[validateStreamUrl] Constructing URL:', url);
    new URL(url); // Only check if it's a valid URL format
    return true;
  } catch (error) {
    console.warn('[validateStreamUrl] Invalid URL format:', error);
    return false;
  }
};

/**
 * Get movie stream URL (log response and extraction)
 */
export const getMovieStream = async (movieId: number): Promise<{
  url: string | null;
  headers: Record<string, string> | null;
  subtitles: Array<{lang: string; label: string; file: string}> | null;
}> => {
  try {
    const response = await fetchMovieSources(movieId);
    console.log('[getMovieStream] Custom API response:', response);
    if (response && response.url) {
      console.log('[getMovieStream] Extracted video URL:', response.url);
    } else {
      console.warn('[getMovieStream] No valid video URL extracted.');
    }
    return response;
  } catch (error) {
    console.error('[getMovieStream] Error fetching movie stream:', error);
    return { url: null, headers: null, subtitles: null };
  }
};

/**
 * Get TV show stream URL (log response and extraction)
 */
export const getTVStream = async (tvId: number, season: number, episode: number): Promise<{
  url: string | null;
  headers: Record<string, string> | null;
  subtitles: Array<{lang: string; label: string; file: string}> | null;
}> => {
  try {
    const response = await fetchTVSources(tvId, season, episode);
    console.log('[getTVStream] Custom API response:', response);
    if (response && response.url) {
      console.log('[getTVStream] Extracted video URL:', response.url);
    } else {
      console.warn('[getTVStream] No valid video URL extracted.');
    }
    return response;
  } catch (error) {
    console.error('[getTVStream] Error fetching TV stream:', error);
    return { url: null, headers: null, subtitles: null };
  }
};

export {
  fetchMovieSources,
  fetchTVSources
};
