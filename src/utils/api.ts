import axios from 'axios';
import { Media, MovieDetails, TVDetails, Episode, Review, Genre, Company, MovieImagesResponse, VideoSource, CastMember } from './types';

// Add interface for video response
interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  size: number;
  type: string;
  official: boolean;
  published_at: string;
}

interface TMDBVideoResponse {
  id: number;
  results: TMDBVideo[];
}

// Create axios instance for TMDB
const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: import.meta.env.VITE_TMDB_API_KEY,
    language: 'en-US'
  }
});

interface TMDBMovieResult {
  id: number;
  title: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids: number[];
}

interface TMDBTVResult {
  id: number;
  name: string;
  title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date: string;
  release_date?: string;
  media_type?: 'movie' | 'tv';
  genre_ids: number[];
}

interface TMDBMovieDetailsResult extends TMDBMovieResult {
  runtime: number;
  genres: Genre[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Company[];
  release_dates?: {
    results: Array<{
      iso_3166_1: string;
      release_dates: Array<{
        certification: string;
      }>;
    }>;
  };
}

interface TMDBTVDetailsResult extends TMDBTVResult {
  episode_run_time: number[];
  genres: Genre[];
  status: string;
  tagline: string;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Array<{
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
  }>;
  production_companies: Company[];
  content_ratings?: {
    results: Array<{
      iso_3166_1: string;
      rating: string;
    }>;
  };
}

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

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

const formatMediaItem = (item: TMDBMovieResult | TMDBTVResult): Media => {
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

// --- HOMEPAGE EXTRA SECTIONS FETCH FUNCTIONS ---

// Bollywood: Hindi language movies (India)
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

// Action movies (genre id: 28)
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

// Drama movies (genre id: 18)
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

// Netflix (provider id: 8)
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

// Hulu (provider id: 15)
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

// Prime Video (provider id: 119)
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

// Paramount+ (provider id: 531)
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

// Disney+ (provider id: 337)
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

// Hotstar (provider id: 122)
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

// Apple TV+ (provider id: 350)
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

// JioCinema (provider id: 970)
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

// Sony Liv (provider id: 237)
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

// Get trending media (movies and TV shows)
export const getTrending = async (timeWindow: 'day' | 'week' = 'week', page: number = 1): Promise<Media[]> => {
  try {
    console.log('Fetching trending media...');
    const response = await fetch(
      `${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}&language=en-US&page=${page}`
    );
    console.log('Trending API Response status:', response.status);
    const data = await response.json();
    console.log('Trending API raw data:', data);
    return data.results.map(formatMediaItem);
  } catch (error) {
    console.error('Error fetching trending media:', error);
    return [];
  }
};

// Get popular movies
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

// Get popular TV shows
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

// Get top rated movies
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

// Get trending TV shows
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

// Get top rated TV shows
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

// Get movie details
export const getMovieDetails = async (id: number): Promise<MovieDetails | null> => {
  try {
    const [detailsResponse, imagesResponse] = await Promise.all([
      fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=release_dates`),
      fetch(`${BASE_URL}/movie/${id}/images?api_key=${API_KEY}`)
    ]);
    
    if (!detailsResponse.ok || !imagesResponse.ok) {
      console.error(`API error: Details ${detailsResponse.status}, Images ${imagesResponse.status}`);
      return null;
    }

    const [detailsData, imagesData] = await Promise.all([
      detailsResponse.json(),
      imagesResponse.json() as Promise<MovieImagesResponse>
    ]);
    
    let certification = "";
    if (detailsData.release_dates && detailsData.release_dates.results) {
      const usReleases = detailsData.release_dates?.results.find((country) => country.iso_3166_1 === "US");
      if (usReleases && usReleases.release_dates && usReleases.release_dates.length > 0) {
        certification = usReleases.release_dates[0].certification || "";
      }
    }

    let bestLogo = null;
    if (imagesData.logos && imagesData.logos.length > 0) {
      const englishLogos = imagesData.logos.filter(logo => logo.iso_639_1 === "en");
      if (englishLogos.length > 0) {
        bestLogo = englishLogos.reduce((prev, current) => 
          (prev.vote_average > current.vote_average) ? prev : current
        );
      }
    }
    
    // Ensure all required properties are present, and fall back to sensible defaults when needed
    const formattedData = formatMediaItem({...detailsData, media_type: 'movie'});
    
    return {
      ...formattedData,
      title: formattedData.title || detailsData.title || 'Unknown Movie',  // Ensure title is never undefined
      release_date: formattedData.release_date || detailsData.release_date || '',  // Ensure release_date is never undefined
      runtime: detailsData.runtime || 0,
      genres: detailsData.genres || [],
      status: detailsData.status || '',
      tagline: detailsData.tagline || '',
      budget: detailsData.budget || 0,
      revenue: detailsData.revenue || 0,
      production_companies: detailsData.production_companies || [],
      certification: certification,
      logo_path: bestLogo ? bestLogo.file_path : null,
    };
  } catch (error) {
    console.error(`Error fetching movie details for id ${id}:`, error);
    return null;
  }
};

// Get TV show details
export const getTVDetails = async (id: number): Promise<TVDetails | null> => {
  try {
    const [detailsResponse, imagesResponse] = await Promise.all([
      fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}&language=en-US&append_to_response=content_ratings`),
      fetch(`${BASE_URL}/tv/${id}/images?api_key=${API_KEY}`)
    ]);
    
    if (!detailsResponse.ok || !imagesResponse.ok) {
      console.error(`API error: Details ${detailsResponse.status}, Images ${imagesResponse.status}`);
      return null;
    }
    
    const [detailsData, imagesData] = await Promise.all([
      detailsResponse.json(),
      imagesResponse.json() as Promise<MovieImagesResponse>
    ]);
    
    let certification = "";
    if (detailsData.content_ratings && detailsData.content_ratings.results) {
      const usRating = detailsData.content_ratings?.results.find((country) => country.iso_3166_1 === "US");
      if (usRating) {
        certification = usRating.rating || "";
      }
    }

    let bestLogo = null;
    if (imagesData.logos && imagesData.logos.length > 0) {
      const englishLogos = imagesData.logos.filter(logo => logo.iso_639_1 === "en");
      if (englishLogos.length > 0) {
        bestLogo = englishLogos.reduce((prev, current) => 
          (prev.vote_average > current.vote_average) ? prev : current
        );
      }
    }
    
    // Ensure all required properties are present, and fall back to sensible defaults when needed
    const formattedData = formatMediaItem({...detailsData, media_type: 'tv'});
    
    return {
      ...formattedData,
      name: formattedData.name || detailsData.name || 'Unknown TV Show',  // Ensure name is never undefined
      first_air_date: formattedData.first_air_date || detailsData.first_air_date || '',  // Ensure first_air_date is never undefined
      episode_run_time: detailsData.episode_run_time || [],
      genres: detailsData.genres || [],
      status: detailsData.status || '',
      tagline: detailsData.tagline || '',
      number_of_episodes: detailsData.number_of_episodes || 0,
      number_of_seasons: detailsData.number_of_seasons || 0,
      seasons: detailsData.seasons || [],
      production_companies: detailsData.production_companies || [],
      certification: certification,
      logo_path: bestLogo ? bestLogo.file_path : null,
    };
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

// Get movie recommendations
export const getMovieRecommendations = async (id: number): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/recommendations?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
  return data.results.map((item: TMDBMovieResult) => formatMediaItem({...item, media_type: 'movie'}));
  } catch (error) {
    console.error('Error fetching movie recommendations:', error);
    return [];
  }
};

// Get TV show recommendations
export const getTVRecommendations = async (id: number): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${id}/recommendations?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
  return data.results.map((item: TMDBTVResult) => formatMediaItem({...item, media_type: 'tv'}));
  } catch (error) {
    console.error('Error fetching TV recommendations:', error);
    return [];
  }
};

// Search for movies and TV shows
export const searchMedia = async (query: string, page: number = 1): Promise<Media[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(
        query
      )}&page=${page}&include_adult=false`
    );
    const data = await response.json();
    return data.results
    .filter((item: TMDBMovieResult | TMDBTVResult) => item.media_type === 'movie' || item.media_type === 'tv')
      .map(formatMediaItem);
  } catch (error) {
    console.error('Error searching media:', error);
    return [];
  }
};

export const getMovieTrailer = async (movieId: number): Promise<string | null> => {
  try {
    const response = await tmdb.get<TMDBVideoResponse>(`/movie/${movieId}/videos`);
    const videos = response.data.results;
    
    // Try to find official trailer first
    const trailer = videos.find(
      (video) => 
        video.type === "Trailer" && 
        video.site === "YouTube" &&
        video.official === true
    ) || 
    // Fallback to any trailer
    videos.find(
      (video) => 
        video.type === "Trailer" && 
        video.site === "YouTube"
    ) ||
    // Last resort: any video
    videos.find((video) => video.site === "YouTube");

    return trailer ? trailer.key : null;
  } catch (error) {
    console.error('Error fetching movie trailer:', error);
    return null;
  }
};

export const getTVTrailer = async (tvId: number): Promise<string | null> => {
  try {
    const response = await tmdb.get<TMDBVideoResponse>(`/tv/${tvId}/videos`);
    const videos = response.data.results;
    
    // Try to find official trailer first
    const trailer = videos.find(
      (video) => 
        video.type === "Trailer" && 
        video.site === "YouTube" &&
        video.official === true
    ) || 
    // Fallback to any trailer
    videos.find(
      (video) => 
        video.type === "Trailer" && 
        video.site === "YouTube"
    ) ||
    // Last resort: any video
    videos.find((video) => video.site === "YouTube");

    return trailer ? trailer.key : null;
  } catch (error) {
    console.error('Error fetching TV trailer:', error);
    return null;
  }
};

// Validate TMDB ID against TMDB API for movies or TV
export const validateTMDBId = async (mediaType: 'movie' | 'tv', tmdbId: number): Promise<boolean> => {
  try {
    const url = `${BASE_URL}/${mediaType}/${tmdbId}?api_key=${API_KEY}`;
    const response = await axios.get(url);
    return response.data && response.data.id === tmdbId;
  } catch (error) {
    return false;
  }
};

// Get movie cast
export const getMovieCast = async (id: number): Promise<CastMember[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return (data.cast || []).map((member: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }) => ({
      id: member.id,
      name: member.name,
      character: member.character,
      profile_path: member.profile_path,
      order: member.order,
    }));
  } catch (error) {
    console.error(`Error fetching movie cast for id ${id}:`, error);
    return [];
  }
};

// Get TV show cast
export const getTVCast = async (id: number): Promise<CastMember[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${id}/credits?api_key=${API_KEY}&language=en-US`
    );
    const data = await response.json();
    return (data.cast || []).map((member: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
      order: number;
    }) => ({
      id: member.id,
      name: member.name,
      character: member.character,
      profile_path: member.profile_path,
      order: member.order,
    }));
  } catch (error) {
    console.error(`Error fetching TV cast for id ${id}:`, error);
    return [];
  }
};
