// Get trailer for a movie
export const getMovieTrailer = async (id: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    const trailer = data.results.find((video: TMDBVideo) => video.type === 'Trailer' && video.site === 'YouTube');
    return trailer ? trailer.key : null;
  } catch (error) {
    console.error('Error fetching movie trailer:', error);
    return null;
  }
};

// Get trailer for a TV show
export const getTVTrailer = async (id: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${id}/videos?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    const trailer = data.results.find((video: TMDBVideo) => video.type === 'Trailer' && video.site === 'YouTube');
    return trailer ? trailer.key : null;
  } catch (error) {
    console.error('Error fetching TV trailer:', error);
    return null;
  }
};
// TMDB API: reviews, recommendations, trailers, cast, validation
import { Media, Review, CastMember } from './types';
import { formatMediaItem } from './formatters';
import { API_KEY, BASE_URL } from './tmdb-constants';
import { TMDBMovieResult, TMDBTVResult, TMDBVideo, TMDBVideoResponse } from './tmdb-types';
import axios from 'axios';

export const getMovieRecommendations = async (id: number, page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/recommendations?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching movie recommendations:', error);
    return [];
  }
};

export const getTVRecommendations = async (id: number, page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${id}/recommendations?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBTVResult) => formatMediaItem({ ...item, media_type: 'tv' }));
  } catch (error) {
    console.error('Error fetching TV recommendations:', error);
    return [];
  }
};
// Get reviews for a movie or TV show
export const getReviews = async (
  id: number,
  mediaType: 'movie' | 'tv'
): Promise<Review[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/${mediaType}/${id}/reviews?api_key=${API_KEY}&language=en-US`
    );
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    return data.results as Review[];
  } catch (error) {
    console.error(`Error fetching reviews for ${mediaType} ${id}:`, error);
    return [];
  }
};
// Search TMDB for media (movie/tv)
export const searchMedia = async (query: string, page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`
    );
    const data = await response.json();
    return data.results
      .filter((item: { media_type: string }) => item.media_type === 'movie' || item.media_type === 'tv')
      .map(formatMediaItem);
  } catch (error) {
    console.error('Error searching media:', error);
    return [];
  }
};
// Validate TMDB ID (movie or tv)
export const validateTMDBId = async (mediaType: 'movie' | 'tv', tmdbId: number): Promise<boolean> => {
  try {
    const url = `${BASE_URL}/${mediaType}/${tmdbId}?api_key=${API_KEY}`;
    const response = await axios.get(url);
    return response.data && response.data.id === tmdbId;
  } catch (error) {
    return false;
  }
};
