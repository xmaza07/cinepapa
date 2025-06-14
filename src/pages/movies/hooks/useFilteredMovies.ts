
import { useCallback } from 'react';
import { Media } from '@/utils/types';

export const useFilteredMovies = (
  movies: Media[], 
  sortBy: 'default' | 'title' | 'release_date' | 'rating',
  genreFilter: string
) => {
  const filterMovies = useCallback(() => {
    let filteredMovies = [...movies];
    
    // Apply genre filter
    if (genreFilter !== 'all') {
      filteredMovies = filteredMovies.filter(movie => 
        movie.genre_ids?.includes(parseInt(genreFilter))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'title':
        filteredMovies.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'release_date':
        filteredMovies.sort((a, b) => 
          new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
        );
        break;
      case 'rating':
        filteredMovies.sort((a, b) => b.vote_average - a.vote_average);
        break;
      default:
        break;
    }
    
    return filteredMovies;
  }, [movies, sortBy, genreFilter]);

  return filterMovies();
};
