import { tmdb } from './tmdb';
import type { TMDBTVResult, TMDBTVDetailsResult, MovieImagesResponse, Image } from '../types/tmdb';
import type { TVDetails, Media, Episode } from '../types';
import { formatMediaResult } from './media';

export async function getTVShow(id: number): Promise<TVDetails> {
  const response = await tmdb.get<TMDBTVDetailsResult>(`/tv/${id}`);
  return formatTVDetails(response.data);
}

export async function getPopularTVShows(page = 1): Promise<Media[]> {
  const response = await tmdb.get<{ results: TMDBTVResult[] }>('/tv/popular', {
    params: { page }
  });
  return response.data.results.map(item => formatMediaResult({...item, media_type: 'tv'}));
}

export async function getTopRatedTVShows(page = 1): Promise<Media[]> {
  const response = await tmdb.get<{ results: TMDBTVResult[] }>('/tv/top_rated', {
    params: { page }
  });
  return response.data.results.map(formatMediaResult);
}

export async function getTrendingTVShows(timeWindow: 'day' | 'week' = 'week', page = 1): Promise<Media[]> {
  const response = await tmdb.get<{ results: TMDBTVResult[] }>(`/trending/tv/${timeWindow}`, {
    params: { page }
  });
  return response.data.results.map(formatMediaResult);
}

export async function getTVEpisode(id: number, season: number, episode: number): Promise<Episode> {
  const response = await tmdb.get<TVEpisodeResult>(`/tv/${id}/season/${season}/episode/${episode}`);
  return {
    id: response.data.id,
    name: response.data.name,
    overview: response.data.overview,
    episode_number: response.data.episode_number,
    season_number: response.data.season_number,
    still_path: response.data.still_path,
    air_date: response.data.air_date,
    vote_average: response.data.vote_average
  };
}

// Get TV show details
export async function getTVDetails(id: number): Promise<TVDetails | null> {
  try {
    const [detailsResponse, imagesResponse] = await Promise.all([
      tmdb.get<TMDBTVDetailsResult>(`/tv/${id}?append_to_response=content_ratings`),
      tmdb.get<MovieImagesResponse>(`/tv/${id}/images`)
    ]);
    
    const detailsData = detailsResponse.data;
    const imagesData = imagesResponse.data;
    
    let certification = "";
    if (detailsData.content_ratings && detailsData.content_ratings.results) {
      const usRating = detailsData.content_ratings?.results.find((country) => country.iso_3166_1 === "US");
      if (usRating) {
        certification = usRating.rating || "";
      }
    }

    let logoPath: string | undefined = undefined;
    if (imagesData.logos && imagesData.logos.length > 0) {
      const englishLogos = imagesData.logos.filter(logo => logo.iso_639_1 === "en") as Image[];
      if (englishLogos.length > 0) {
        const bestLogo = englishLogos.reduce((prev, current) => 
          (prev.vote_average > current.vote_average) ? prev : current
        );
        logoPath = bestLogo.file_path;
      }
    }
    
    const formattedData = formatMediaResult({...detailsData, media_type: 'tv'});
    
    return {
      ...formattedData,
      name: formattedData.name || detailsData.name || 'Unknown TV Show',
      first_air_date: formattedData.first_air_date || detailsData.first_air_date || '',
      episode_run_time: detailsData.episode_run_time || [],
      genres: detailsData.genres || [],
      status: detailsData.status || '',
      tagline: detailsData.tagline || '',
      number_of_episodes: detailsData.number_of_episodes || 0,
      number_of_seasons: detailsData.number_of_seasons || 0,
      seasons: detailsData.seasons || [],
      production_companies: detailsData.production_companies || [],
      certification: certification,
      logo_path: logoPath,
    };
  } catch (error) {
    console.error(`Error fetching TV details for id ${id}:`, error);
    return null;
  }
}

// Validate TMDB TV ID
export async function validateTVId(tmdbId: number): Promise<boolean> {
  try {
    const response = await tmdb.get(`/tv/${tmdbId}`);
    return response.data && response.data.id === tmdbId;
  } catch (error) {
    return false;
  }
}

function formatTVDetails(show: TMDBTVDetailsResult): TVDetails {
  const formattedData = formatMediaResult({...show, media_type: 'tv'});
  
  return {
    ...formattedData,
    name: show.name || 'Unknown TV Show',
    first_air_date: show.first_air_date || '',
    episode_run_time: show.episode_run_time || [],
    genres: show.genres || [],
    status: show.status || '',
    tagline: show.tagline || '',
    number_of_episodes: show.number_of_episodes || 0,
    number_of_seasons: show.number_of_seasons || 0,
    seasons: show.seasons.map(season => ({
      ...season,
      poster_path: season.poster_path || null // Ensure poster_path is string | null
    })) || [],
    production_companies: show.production_companies || [],
    certification: '',  // Set by parent function after content ratings lookup
    logo_path: undefined,  // Set by parent function after image lookup
  };
}

// Get TV show season details
export async function getSeasonDetails(
  id: number,
  seasonNumber: number
): Promise<Episode[]> {
  try {
    const response = await tmdb.get<{ episodes: TVEpisodeResult[] }>(`/tv/${id}/season/${seasonNumber}`);
    return response.data.episodes.map(episode => ({
      id: episode.id,
      name: episode.name,
      overview: episode.overview,
      episode_number: episode.episode_number,
      season_number: episode.season_number,
      still_path: episode.still_path,
      air_date: episode.air_date,
      vote_average: episode.vote_average
    }));
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} for TV show ${id}:`, error);
    return [];
  }
}

interface TVEpisodeResult {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}
