import type { Genre, Company } from './media';

export interface MovieDetails {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  logo_path?: string;
  overview: string;
  release_date: string;
  vote_average: number;
  tagline?: string;
  status: string;
  runtime: number;
  budget: number;
  revenue: number;
  genres: Genre[];
  production_companies: Company[];
  certification?: string;
}
