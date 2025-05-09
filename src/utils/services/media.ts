import type { Media } from '../types';

export function formatMediaResult(item: { 
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids?: number[];
}): Media {
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv') as 'movie' | 'tv';
  
  return {
    id: item.id,
    title: item.title || null,
    name: item.name || null,
    poster_path: item.poster_path || '',
    backdrop_path: item.backdrop_path || '',
    overview: item.overview || '',
    vote_average: item.vote_average || 0,
    release_date: item.release_date || null,
    first_air_date: item.first_air_date || null,
    media_type: mediaType,
    genre_ids: item.genre_ids || [],
  };
}
