import axios from 'axios';
import { ApiResponse } from './custom-api-types';
import customApiConfig from './custom-api-config';

/**
 * Extract valid video URL from API response
 */
const extractVideoUrl = (data: ApiResponse[]): string | null => {
  try {
    // Process all responses to find a valid video file
    for (const item of data) {
      // Check for 2embed provider specifically
      if (item.source?.provider?.toLowerCase().includes('2embed')) {
        if (item.source.files?.length) {
          const file = item.source.files[0];
          if (file.file && file.type === 'hls') {
            try {
              const secureUrl = file.file.replace('http://', 'https://');
              new URL(secureUrl); // Validate URL
              console.warn('Using direct HLS stream URL:', secureUrl);
              return secureUrl;
            } catch (e) {
              console.warn('Invalid stream URL format');
              return null;
            }
          }
        }
      }
    }
    
    console.warn('No 2embed source found in response');
    return null;
  } catch (error) {
    console.error('Error extracting video URL:', error);
    return null;
  }
};

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async <T>(
  url: string,
  retries: number = MAX_RETRIES
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {      const response = await axios.get<T>(url, {
        timeout: 15000, // 15 second timeout
        headers: {
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Attempt ${i + 1} failed:`, errorMessage);
      if (i === retries - 1) throw error;
      const delay = RETRY_DELAY * Math.pow(2, i);
      await sleep(delay);
    }
  }
  throw new Error('All retry attempts failed');
};

export const fetchMovieSources = async (movieId: number): Promise<string | null> => {
  try {
    const data = await fetchWithRetry<ApiResponse[]>(`${customApiConfig.apiUrl}/movie/2embed/${movieId}`);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('No sources returned for movie:', movieId);
      return null;
    }
    
    return extractVideoUrl(data);
  } catch (error) {
    console.error('Error fetching movie sources:', error);
    return null;
  }
};

export const fetchTVSources = async (tvId: number, season: number, episode: number): Promise<string | null> => {
  try {
    const data = await fetchWithRetry<ApiResponse[]>(`${customApiConfig.apiUrl}/tv/2embed/${tvId}?s=${season}&e=${episode}`);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('No sources returned for TV show:', { tvId, season, episode });
      return null;
    }
    
    return extractVideoUrl(data);
  } catch (error) {
    console.error('Error fetching TV sources:', error);
    return null;
  }
};
