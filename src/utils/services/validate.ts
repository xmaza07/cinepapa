import { tmdb } from './tmdb';

// Generic validator for TMDB IDs
export async function validateTMDBId(id: number, mediaType: 'movie' | 'tv'): Promise<boolean> {
  try {
    const response = await tmdb.get(`/${mediaType}/${id}`);
    return response.data && response.data.id === id;
  } catch (error) {
    return false;
  }
}
