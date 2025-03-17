import { Media, MovieDetails, TVDetails, Episode, Review } from './types';

const API_KEY = '297f1b91919bae59d50ed815f8d2e14c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Image sizes
export const posterSizes = {
  small: `${IMAGE_BASE_URL}/w185`,
  medium: `${IMAGE_BASE_URL}/w342`,
  large: `${IMAGE_BASE_URL}/w500`,
  original: `${IMAGE_BASE_URL}/original`,
};

export const backdropSizes = {
  small: `${IMAGE_BASE_URL}/w300`,
  medium: `${IMAGE_BASE_URL}/w780`,
  large: `${IMAGE_BASE_URL}/w1280`,
  original: `${IMAGE_BASE_URL}/original`,
};

// Video sources for iframe - expanded with more options
export const videoSources = [
  {
    key: 'vidlink',
    name: 'VidLink',
    getMovieUrl: (id: number) => `https://vidlink.pro/movie/${id}?autoplay=true&title=true`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidlink.pro/tv/${id}/${season}/${episode}?autoplay=true&title=true`,
  },
  {
    key: 'autoembed',
    name: 'AutoEmbed',
    getMovieUrl: (id: number) => `https://player.autoembed.cc/embed/movie/${id}?autoplay=true`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}?autoplay=true`,
  },
  {
    key: '2embed',
    name: '2Embed',
    getMovieUrl: (id: number) => `https://www.2embed.cc/embed/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://www.2embed.cc/embed/tv/${id}&s=${season}&e=${episode}`,
  },
  {
    key: 'multiembed',
    name: 'MultiEmbed',
    getMovieUrl: (id: number) => `https://multiembed.mov/video_id=${id}&tmdb=1`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://multiembed.mov/video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    key: '2embed-org',
    name: '2Embed.org',
    getMovieUrl: (id: number) => `https://2embed.org/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://2embed.org/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'vidfast',
    name: 'VidFast',
    getMovieUrl: (id: number) => `https://vidfast.pro/movie/${id}?autoPlay=true`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidfast.pro/tv/${id}/${season}/${episode}?autoPlay=true`,
  },
];

// Helper function to format API responses to Media type
const formatMediaItem = (item: any): Media => {
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

// Get trending media (movies and TV shows)
export const getTrending = async (timeWindow: 'day' | 'week' = 'week'): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.results.map(formatMediaItem);
  } catch (error) {
    console.error('Error fetching trending media:', error);
    return [];
  }
};

// Get popular movies
export const getPopularMovies = async (): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.results.map((item: any) => formatMediaItem({...item, media_type: 'movie'}));
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return [];
  }
};

// Get popular TV shows
export const getPopularTVShows = async (): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.results.map((item: any) => formatMediaItem({...item, media_type: 'tv'}));
  } catch (error) {
    console.error('Error fetching popular TV shows:', error);
    return [];
  }
};

// Get top rated movies
export const getTopRatedMovies = async (): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.results.map((item: any) => formatMediaItem({...item, media_type: 'movie'}));
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    return [];
  }
};

// Get top rated TV shows
export const getTopRatedTVShows = async (): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.results.map((item: any) => formatMediaItem({...item, media_type: 'tv'}));
  } catch (error) {
    console.error('Error fetching top rated TV shows:', error);
    return [];
  }
};

// Get movie details
export const getMovieDetails = async (id: number): Promise<MovieDetails | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=release_dates`
    );
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    // Get the US certification
    let certification = "";
    if (data.release_dates && data.release_dates.results) {
      const usReleases = data.release_dates.results.find((country: any) => country.iso_3166_1 === "US");
      if (usReleases && usReleases.release_dates && usReleases.release_dates.length > 0) {
        certification = usReleases.release_dates[0].certification || "";
      }
    }
    
    return {
      ...formatMediaItem({...data, media_type: 'movie'}),
      runtime: data.runtime,
      genres: data.genres,
      status: data.status,
      tagline: data.tagline,
      budget: data.budget,
      revenue: data.revenue,
      production_companies: data.production_companies,
      certification: certification,
    } as MovieDetails;
  } catch (error) {
    console.error(`Error fetching movie details for id ${id}:`, error);
    return null;
  }
};

// Get TV show details
export const getTVDetails = async (id: number): Promise<TVDetails | null> => {
  try {
    console.log(`Fetching TV details from: ${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=content_ratings`); // Debug log
    const response = await fetch(
      `${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=content_ratings`
    );
    
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log("Raw TV details data:", data); // Debug log
    
    // Get the US certification
    let certification = "";
    if (data.content_ratings && data.content_ratings.results) {
      const usRating = data.content_ratings.results.find((country: any) => country.iso_3166_1 === "US");
      if (usRating) {
        certification = usRating.rating || "";
      }
    }
    
    return {
      ...formatMediaItem({...data, media_type: 'tv'}),
      episode_run_time: data.episode_run_time,
      genres: data.genres,
      status: data.status,
      tagline: data.tagline,
      number_of_episodes: data.number_of_episodes,
      number_of_seasons: data.number_of_seasons,
      seasons: data.seasons,
      production_companies: data.production_companies,
      certification: certification,
    } as TVDetails;
  } catch (error) {
    console.error(`Error fetching TV details for id ${id}:`, error);
    return null;
  }
};

// Get TV show season details
export const getSeasonDetails = async (
  id: number,
  seasonNumber: number
): Promise<Episode[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${id}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return data.episodes;
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} for TV show ${id}:`, error);
    return [];
  }
};

// Get reviews for movie or TV show
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
    return data.results;
  } catch (error) {
    console.error(`Error fetching reviews for ${mediaType} ${id}:`, error);
    return [];
  }
};

// Search for movies and TV shows
export const searchMedia = async (query: string): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
        query
      )}&include_adult=false`
    );
    const data = await response.json();
    return data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map(formatMediaItem);
  } catch (error) {
    console.error('Error searching media:', error);
    return [];
  }
};
