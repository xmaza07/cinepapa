
import axios from 'axios';
import { ApiResponse } from './custom-api-types';
import customApiConfig from './custom-api-config';

/**
 * Fetch movie sources from the custom API
 */
export const fetchMovieSources = async (movieId: number): Promise<string | null> => {
  try {
    const response = await axios.get<ApiResponse[]>(`${customApiConfig.apiUrl}/movie/2embed/${movieId}`);
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
    const response = await axios.get<ApiResponse[]>(`${customApiConfig.apiUrl}/tv/2embed/${tvId}?s=${season}&e=${episode}`);
    return extractVideoUrl(response.data);
  } catch (error) {
    console.error('Error fetching TV sources:', error);
    return null;
  }
};

/**
 * Extract valid video URL from API response
 */
const extractVideoUrl = (data: ApiResponse[]): string | null => {
  try {
    for (const item of data) {
      if (item.source?.provider?.toLowerCase().includes('2embed')) {
        if (item.source.files?.length) {
          const file = item.source.files[0];
          if (file.file && file.type === 'hls') {
            try {
              const secureUrl = file.file.replace('http://', 'https://');
              new URL(secureUrl); // Validate URL
              return secureUrl;
            } catch (e) {
              console.warn('Invalid stream URL format');
              continue;
            }
          }
        }
      }
    }
    console.warn('No valid 2embed source found');
    return null;
  } catch (error) {
    console.error('Error extracting video URL:', error);
    return null;
  }
};
