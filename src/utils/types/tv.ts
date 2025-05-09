import type { Genre, Company } from './media';

// TV Show details type
export interface TVDetails {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  logo_path?: string;
  overview: string;
  first_air_date: string;
  vote_average: number;
  tagline?: string;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time?: number[];
  genres: Genre[];
  production_companies: Company[];
  seasons: Season[];
  certification?: string;
}

// Season type
export interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  overview?: string;
  air_date?: string;
}

// Episode type
export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  episode_number: number;
  season_number: number;
  vote_average: number;
}
