import axios from 'axios';
import { ApiResponse, VideoSource } from './custom-api-types';
import customApiConfig from './custom-api-config';

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// Sleep helper function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with retry logic
 */
const fetchWithRetry = async <T>(
  url: string,
  retries: number = MAX_RETRIES
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries + 1; i++) {
    try {
      const response = await axios.get<T>(url, {
        timeout: 15000, // 15 second timeout
        headers: {
          'Accept': 'application/json'
          // Removed 'Origin' and 'Referer' to avoid browser CORS/unsafe header errors
        }
      });
      
      return response.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`API request attempt ${i + 1}/${retries + 1} failed:`, lastError.message);
      
      if (i < retries) {
        const delay = RETRY_DELAY * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error('All retry attempts failed');
};

/**
 * Extract video information from API response
 */
const extractVideoInfo = (data: ApiResponse[]): { 
  url: string | null;
  headers: null;
  subtitles: null;
} => {
  try {
    for (const item of data) {
      // Try to extract from source property (2embed provider)
      if (item.source?.provider?.toLowerCase().includes('2embed')) {
        if (item.source.files?.length) {
          const file = item.source.files[0];
          if (file.file && file.type === 'hls') {
            try {
              const secureUrl = file.file.replace('http://', 'https://');
              new URL(secureUrl); // Validate URL
              return {
                url: secureUrl,
                headers: null,
                subtitles: null
              };
            } catch (e) {
              console.warn('Invalid stream URL format:', e);
              continue;
            }
          }
        }
      }
      // Try to extract from sources array if available
      if (Array.isArray(item.sources)) {
        for (const source of item.sources) {
          if (source.files?.length) {
            const file = source.files[0];
            if (file.file && file.type === 'hls') {
              try {
                const secureUrl = file.file.replace('http://', 'https://');
                new URL(secureUrl); // Validate URL
                return {
                  url: secureUrl,
                  headers: null,
                  subtitles: null
                };
              } catch (e) {
                console.warn('Invalid stream URL format:', e);
                continue;
              }
            }
          }
        }
      }
    }
    console.warn('No valid video source found in API response');
    return { url: null, headers: null, subtitles: null };
  } catch (error) {
    console.error('Error extracting video URL:', error);
    return { url: null, headers: null, subtitles: null };
  }
};

/**
 * Fetch movie sources from the custom API
 */
export const fetchMovieSources = async (movieId: number): Promise<{
  url: string | null;
  headers: Record<string, string> | null;
  subtitles: Array<{lang: string; label: string; file: string}> | null;
}> => {
  try {
    const data = await fetchWithRetry<ApiResponse[]>(`${customApiConfig.apiUrl}/movie/2embed/${movieId}`);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('No sources returned for movie:', movieId);
      return { url: null, headers: null, subtitles: null };
    }
    
    return extractVideoInfo(data);
  } catch (error) {
    console.error('Error fetching movie sources:', error);
    return { url: null, headers: null, subtitles: null };
  }
};

/**
 * Fetch TV show sources from the custom API
 */
export const fetchTVSources = async (tvId: number, season: number, episode: number): Promise<{
  url: string | null;
  headers: Record<string, string> | null;
  subtitles: Array<{lang: string; label: string; file: string}> | null;
}> => {
  try {
    const data = await fetchWithRetry<ApiResponse[]>(
      `${customApiConfig.apiUrl}/tv/2embed/${tvId}?s=${season}&e=${episode}`
    );
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('No sources returned for TV show:', { tvId, season, episode });
      return { url: null, headers: null, subtitles: null };
    }
    
    return extractVideoInfo(data);
  } catch (error) {
    console.error('Error fetching TV sources:', error);
    return { url: null, headers: null, subtitles: null };
  }
};
