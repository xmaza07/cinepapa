
import { Media } from '@/utils/types';

interface ParsedMediaItem {
  title: string;
  year?: string;
  description?: string;
  genres?: string[];
  rating?: string;
  tmdbId?: number;
  type?: 'movie' | 'tv';
}

/**
 * Extracts potential movie/TV show recommendations from AI response text
 * @param text The AI response text
 * @returns Array of extracted media items
 */
export const extractMediaItems = (text: string): ParsedMediaItem[] => {
  const mediaItems: ParsedMediaItem[] = [];
  
  // Split text by numbered items (1., 2., etc.)
  const items = text.split(/\d+\.\s+/).filter(item => item.trim().length > 0);
  
  items.forEach(item => {
    // Basic title and year extraction (Title (Year) pattern)
    const titleYearMatch = item.match(/^([^(]+)\s*\((\d{4})\)/);
    
    if (titleYearMatch) {
      const mediaItem: ParsedMediaItem = {
        title: titleYearMatch[1].trim(),
        year: titleYearMatch[2],
      };
      
      // Extract description (usually the first paragraph after title)
      const lines = item.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length > 1) {
        mediaItem.description = lines[1];
      }
      
      // Extract genres
      const genreMatch = item.match(/Genre(?:s)?:\s*([^]+?)(?:\n|$)/i);
      if (genreMatch) {
        mediaItem.genres = genreMatch[1].split(/,\s*/).map(g => g.trim());
      }
      
      // Extract rating
      const ratingMatch = item.match(/(?:IMDb|Rotten Tomatoes):\s*([\d.]+)(?:\/10|\%)/i);
      if (ratingMatch) {
        mediaItem.rating = ratingMatch[0].trim();
      }
      
      // Extract TMDB ID
      const tmdbIdMatch = item.match(/TMDB_ID:\s*(\d+)/i);
      if (tmdbIdMatch) {
        mediaItem.tmdbId = parseInt(tmdbIdMatch[1]);
      }
      
      // Extract media type (movie/tv)
      const typeMatch = item.match(/Type:\s*(movie|tv)/i);
      if (typeMatch) {
        mediaItem.type = typeMatch[1].toLowerCase() as 'movie' | 'tv';
      }
      
      mediaItems.push(mediaItem);
    }
  });
  
  return mediaItems;
};

/**
 * Create temporary Media objects from parsed items
 * Used for displaying in the chatbot UI
 */
export const createMediaObjects = (parsedItems: ParsedMediaItem[]): Media[] => {
  return parsedItems.map(item => {
    const media: Media = {
      id: item.tmdbId || 0,
      media_id: item.tmdbId || 0,
      title: item.title,
      name: item.title,
      overview: item.description || '',
      poster_path: '', // We don't have this from the AI response
      backdrop_path: '', // Adding the missing property with an empty string default
      vote_average: 0, // We don't have a numerical rating from the AI
      media_type: item.type || 'movie',
      genre_ids: [], // Adding the missing property with an empty array default
    };
    
    // Add year as release_date or first_air_date depending on type
    if (item.year) {
      if (item.type === 'tv') {
        media.first_air_date = `${item.year}-01-01`;
      } else {
        media.release_date = `${item.year}-01-01`;
      }
    }
    
    return media;
  });
};

