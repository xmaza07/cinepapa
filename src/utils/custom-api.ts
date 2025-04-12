
import axios from 'axios';

// Constants
const CUSTOM_API_URL = import.meta.env.VITE_CUSTOM_API_URL || 'https://tmdb-embed-api.vercel.app';
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'https://m3u8proxy.chintanr21.workers.dev';

// Types
interface VideoFile {
  file: string;
  type: string;
  quality: string;
  lang: string;
}

interface VideoSource {
  provider: string;
  files?: VideoFile[];
  ERROR?: any[];
  headers?: Record<string, string>;
  subtitles?: any[];
}

interface ApiResponse {
  source?: VideoSource;
  sources?: VideoSource[] | VideoSource;
  provider?: string;
  ERROR?: any[];
}

/**
 * Fetch movie sources from the custom API
 */
export const fetchMovieSources = async (movieId: number): Promise<string | null> => {
  try {
    const response = await axios.get<ApiResponse[]>(`${CUSTOM_API_URL}/movie/${movieId}`);
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
    const response = await axios.get<ApiResponse[]>(`${CUSTOM_API_URL}/tv/${tvId}?s=${season}&e=${episode}`);
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
    // Process all responses to find a valid video file
    for (const item of data) {
      // Check for source with files
      if (item.source?.files?.length) {
        const file = item.source.files[0];
        const headers = item.source.headers || {};
        
        if (file.file && file.type === 'hls') {
          // Create proxied URL for HLS files
          const searchParams = new URLSearchParams();
          searchParams.set('url', file.file);
          
          if (Object.keys(headers).length) {
            searchParams.set('headers', JSON.stringify(headers));
          }
          
          return `${PROXY_URL}/v2?${searchParams.toString()}`;
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
