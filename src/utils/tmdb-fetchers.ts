export const getHuluContent = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_watch_providers=15&watch_region=US&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Hulu content:', error);
    return [];
  }
};

export const getPrimeContent = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_watch_providers=119&watch_region=US&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Prime Video content:', error);
    return [];
  }
};

export const getParamountContent = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_watch_providers=531&watch_region=US&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Paramount+ content:', error);
    return [];
  }
};

export const getDisneyContent = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_watch_providers=337&watch_region=US&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Disney+ content:', error);
    return [];
  }
};

export const getHotstarContent = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_watch_providers=122&watch_region=IN&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Hotstar content:', error);
    return [];
  }
};

export const getAppleTVContent = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_watch_providers=350&watch_region=US&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Apple TV+ content:', error);
    return [];
  }
};

export const getJioCinemaContent = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_watch_providers=970&watch_region=IN&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching JioCinema content:', error);
    return [];
  }
};

export const getSonyLivContent = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_watch_providers=237&watch_region=IN&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Sony Liv content:', error);
    return [];
  }
};
// src/utils/tmdb-fetchers.ts
// TMDB API: functions that fetch lists of media (movies, TV, trending, etc.)

import { Media } from './types';
import { formatMediaItem } from './formatters';
import { API_KEY, BASE_URL } from './tmdb-constants';
import { TMDBMovieResult, TMDBTVResult } from './tmdb-types';

export const getBollywoodMovies = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_original_language=hi&region=IN&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Bollywood movies:', error);
    return [];
  }
};

export const getActionMovies = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_genres=28&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Action movies:', error);
    return [];
  }
};

export const getDramaMovies = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_genres=18&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Drama movies:', error);
    return [];
  }
};

export const getNetflixContent = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&with_watch_providers=8&watch_region=US&sort_by=popularity.desc&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({ ...item, media_type: 'movie' }));
  } catch (error) {
    console.error('Error fetching Netflix content:', error);
    return [];
  }
};


export const getTrending = async (timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await response.json();
    return data.results.map(formatMediaItem);
  } catch (error) {
    console.error('Error fetching trending media:', error);
    return [];
  }
};

export const getPopularMovies = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({...item, media_type: 'movie'}));
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return [];
  }
};

export const getPopularTVShows = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBTVResult) => formatMediaItem({...item, media_type: 'tv'}));
  } catch (error) {
    console.error('Error fetching popular TV shows:', error);
    return [];
  }
};

export const getTopRatedMovies = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBMovieResult) => formatMediaItem({...item, media_type: 'movie'}));
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    return [];
  }
};

export const getTrendingTVShows = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/tv/week?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBTVResult) => formatMediaItem({...item, media_type: 'tv'}));
  } catch (error) {
    console.error('Error fetching trending TV shows:', error);
    return [];
  }
};

export const getTopRatedTVShows = async (page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    const data = await response.json();
    return data.results.map((item: TMDBTVResult) => formatMediaItem({...item, media_type: 'tv'}));
  } catch (error) {
    console.error('Error fetching top rated TV shows:', error);
    return [];
  }
};
