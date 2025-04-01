
import { z } from "zod";

// Define the schema for the API response
const subtitleSchema = z.object({
  lang: z.string(),
  file: z.string(),
});

const sourceDataSchema = z.object({
  stream: z.string(),
  subtitle: z.array(subtitleSchema).optional(),
});

const sourceSchema = z.object({
  name: z.string(),
  data: sourceDataSchema,
});

const vidsrcResponseSchema = z.object({
  status: z.number(),
  info: z.string(),
  sources: z.array(sourceSchema),
});

export type VidsrcSubtitle = z.infer<typeof subtitleSchema>;
export type VidsrcSource = z.infer<typeof sourceSchema>;

// Base URL for the API
const API_BASE_URL = 'https://vidsrc-gules.vercel.app';

/**
 * Fetches movie streams from the vidsrc API
 * @param imdbId The IMDB ID of the movie
 * @returns An array of sources with streams and subtitles
 */
export const fetchMovieStreams = async (movieId: number): Promise<VidsrcSource[]> => {
  try {
    // We need to convert TMDB ID to IMDB ID here
    // For demo purposes, we'll use the /streams endpoint which works with TMDB IDs
    const response = await fetch(`${API_BASE_URL}/streams/${movieId}`);
    
    if (!response.ok) {
      console.error('Failed to fetch movie streams:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    const parsedData = vidsrcResponseSchema.safeParse(data);
    
    if (!parsedData.success) {
      console.error('Invalid API response format:', parsedData.error);
      return [];
    }
    
    return parsedData.data.sources;
  } catch (error) {
    console.error('Error fetching movie streams:', error);
    return [];
  }
};

/**
 * Fetches TV show streams from the vidsrc API
 * @param imdbId The IMDB ID of the TV show
 * @param season The season number
 * @param episode The episode number
 * @returns An array of sources with streams and subtitles
 */
export const fetchTVStreams = async (
  tvId: number, 
  season: number, 
  episode: number
): Promise<VidsrcSource[]> => {
  try {
    // We need to convert TMDB ID to IMDB ID here
    // For demo purposes, we'll use the /streams endpoint which works with TMDB IDs
    const response = await fetch(
      `${API_BASE_URL}/streams/${tvId}?s=${season}&e=${episode}`
    );
    
    if (!response.ok) {
      console.error('Failed to fetch TV streams:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    const parsedData = vidsrcResponseSchema.safeParse(data);
    
    if (!parsedData.success) {
      console.error('Invalid API response format:', parsedData.error);
      return [];
    }
    
    return parsedData.data.sources;
  } catch (error) {
    console.error('Error fetching TV streams:', error);
    return [];
  }
};
