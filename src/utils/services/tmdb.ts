import axios from 'axios';
import { TMDB } from '../config/constants';

// Create axios instance for TMDB
export const tmdb = axios.create({
  baseURL: TMDB.BASE_URL,
  params: {
    api_key: TMDB.API_KEY,
    language: 'en-US'
  }
});

// Export the helper function for getting image URLs
export function getImageUrl(path: string | null | undefined, size: string): string | undefined {
  if (!path) {
    return undefined;
  }
  return `${TMDB.IMAGE_BASE_URL}/${size}${path}`;
}
