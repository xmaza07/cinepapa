// Get cast for a movie
import { CastMember } from './types';

export const getMovieCast = async (id: number): Promise<CastMember[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.cast as CastMember[];
  } catch (error) {
    console.error('Error fetching movie cast:', error);
    return [];
  }
};

// Get cast for a TV show
export const getTVCast = async (id: number): Promise<CastMember[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${id}/credits?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.cast as CastMember[];
  } catch (error) {
    console.error('Error fetching TV cast:', error);
    return [];
  }
};
// src/utils/tmdb-details.ts
// TMDB API: functions that fetch details for a single movie/TV show/season

import { MovieDetails, TVDetails, Episode, MovieImagesResponse } from './types';
import { formatMediaItem } from './formatters';
import { API_KEY, BASE_URL } from './tmdb-constants';

export const getMovieDetails = async (id: number): Promise<MovieDetails | null> => {
  // ... (implementation moved from tmdb-api.ts)
  return null;
};

export const getTVDetails = async (id: number): Promise<TVDetails | null> => {
  // ... (implementation moved from tmdb-api.ts)
  return null;
};

export const getSeasonDetails = async (
  id: number,
  seasonNumber: number
): Promise<Episode[]> => {
  // ... (implementation moved from tmdb-api.ts)
  return [];
};
