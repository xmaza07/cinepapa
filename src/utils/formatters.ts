// src/utils/formatters.ts
// Extracted from api.ts for single responsibility: contains only formatting utilities for TMDB media items.
import { Media } from './types';
import { TMDBMovieResult, TMDBTVResult } from './tmdb-api';

export const formatMediaItem = (item: TMDBMovieResult | TMDBTVResult): Media => {
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  return {
    id: item.id,
    title: item.title || null,
    name: item.name || null,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview,
    vote_average: item.vote_average,
    release_date: item.release_date || null,
    first_air_date: item.first_air_date || null,
    media_type: mediaType as 'movie' | 'tv',
    genre_ids: item.genre_ids || [],
  };
};
