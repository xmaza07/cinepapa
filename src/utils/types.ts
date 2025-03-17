
export interface Media {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
}

export interface MovieDetails extends Media {
  runtime: number;
  genres: Genre[];
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_companies: Company[];
}

export interface TVDetails extends Media {
  episode_run_time: number[];
  genres: Genre[];
  status: string;
  tagline: string;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Season[];
  production_companies: Company[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  logo_path: string;
  name: string;
  origin_country: string;
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  season_number: number;
  episode_count: number;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string;
  episode_number: number;
  season_number: number;
  vote_average: number;
  air_date: string;
}

export interface VideoSource {
  key: string;
  name: string;
  url: string;
}
