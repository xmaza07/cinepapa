
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
  
  // First attempt: Try to find numbered items (1., 2., etc.)
  let items = text.split(/\d+\.\s+/).filter(item => item.trim().length > 0);
  
  // If no numbered items were found, try to look for titles in the text
  if (items.length === 0 || (items.length === 1 && !items[0].includes('(') && !items[0].includes('**'))) {
    // Try to find titles with year pattern "Title (YEAR)"
    const titleYearPattern = /(?:\*\*)?([^*\n(]+)(?:\*\*)?\s*\((\d{4}(?:-\d{4}|\s*-\s*Present)?)\)/g;
    const matches = [...text.matchAll(titleYearPattern)];
    
    if (matches.length > 0) {
      items = matches.map(match => {
        const startIdx = match.index || 0;
        let endIdx = text.indexOf('\n\n', startIdx + match[0].length);
        if (endIdx === -1) endIdx = text.length;
        return text.substring(startIdx, endIdx);
      });
    }
  }
  
  items.forEach(item => {
    // Look for title patterns: bold text or text with year in parentheses
    // Support both Markdown bold (**Title**) and plain text with year
    const titleMatch = item.match(/(?:\*\*)?([^*\n(]+)(?:\*\*)?\s*\((\d{4}(?:-\d{4}|\s*-\s*Present)?)\)/);
    
    if (titleMatch) {
      const mediaItem: ParsedMediaItem = {
        title: titleMatch[1].trim(),
        year: titleMatch[2],
      };
      
      // Extract description (text after the title until next section)
      const titleEndIndex = item.indexOf(titleMatch[0]) + titleMatch[0].length;
      let descriptionText = item.substring(titleEndIndex).trim();
      
      // Remove any prefix dash or colon
      descriptionText = descriptionText.replace(/^[-:]\s*/, '');
      
      // Extract until the first metadata label (Genre, Type, etc.)
      const metadataStart = descriptionText.search(/\b(Genre|Type|Rating|TMDB_ID)s?:/i);
      if (metadataStart > 0) {
        mediaItem.description = descriptionText.substring(0, metadataStart).trim();
      } else {
        // If no metadata found, use the first paragraph
        const firstParagraphEnd = descriptionText.indexOf('\n\n');
        mediaItem.description = firstParagraphEnd > 0 
          ? descriptionText.substring(0, firstParagraphEnd).trim() 
          : descriptionText;
      }
      
      // Extract genres
      const genreMatch = item.match(/Genre(?:s)?:\s*([^]+?)(?:\n|$)/i);
      if (genreMatch) {
        mediaItem.genres = genreMatch[1].split(/,\s*/).map(g => g.trim());
      }
      
      // Extract rating
      const ratingMatch = item.match(/(?:IMDb|Rotten Tomatoes|Rating):\s*([\d.]+)(?:\/10|\%)/i);
      if (ratingMatch) {
        mediaItem.rating = ratingMatch[0].trim();
      }
      
      // Extract TMDB ID
      const tmdbIdMatch = item.match(/TMDB_ID:\s*(\d+)/i);
      if (tmdbIdMatch) {
        mediaItem.tmdbId = parseInt(tmdbIdMatch[1]);
      }
      
      // Extract media type (movie/tv)
      const typeMatch = item.match(/Type:\s*(movie|tv|series|show)/i);
      if (typeMatch) {
        const typeText = typeMatch[1].toLowerCase();
        mediaItem.type = typeText === 'series' || typeText === 'show' ? 'tv' : typeText as 'movie' | 'tv';
      } else if (item.toLowerCase().includes('tv series') || 
                item.toLowerCase().includes('tv show') || 
                mediaItem.title.includes('Season')) {
        mediaItem.type = 'tv';
      } else {
        // Default to movie if type is not specified
        mediaItem.type = 'movie';
      }
      
      // If no TMDB ID was found, generate a temporary one based on title
      if (!mediaItem.tmdbId) {
        // Create a simple hash from the title string
        const tempId = Math.abs(mediaItem.title.split('').reduce((acc, char) => {
          return acc + char.charCodeAt(0);
        }, 0)) % 1000000;
        mediaItem.tmdbId = tempId;
      }
      
      mediaItems.push(mediaItem);
    }
  });
  
  // Log extracted items for debugging
  console.log('Extracted media items:', mediaItems);
  
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
      // Handle ranges like "2022-Present" by just using the start year
      const yearStart = item.year.split('-')[0].trim();
      if (item.type === 'tv') {
        media.first_air_date = `${yearStart}-01-01`;
      } else {
        media.release_date = `${yearStart}-01-01`;
      }
    }
    
    return media;
  });
};
