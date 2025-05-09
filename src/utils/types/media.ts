// Basic media interface
export interface Media {
  id: number;
  title: string | null;
  name: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string | null;
  first_air_date: string | null;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
}

// Genre interface
export interface Genre {
  id: number;
  name: string;
}

// Company interface
export interface Company {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}
