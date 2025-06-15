
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MediaGrid from '@/components/MediaGrid';
import { MediaSkeleton } from '@/components/MediaSkeleton';
import { getPopularMovies, getTopRatedMovies, getTrendingMovies } from '@/utils/services/movies';
import { useFilteredMovies } from '../hooks/useFilteredMovies';
import { ensureExtendedMediaArray } from '@/utils/types';

interface MoviesTabsProps {
  activeTab: 'popular' | 'top_rated' | 'trending';
  onTabChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  sortBy: 'default' | 'title' | 'release_date' | 'rating';
  genreFilter: string;
}

const MoviesTabs = ({
  activeTab,
  onTabChange,
  viewMode,
  sortBy,
  genreFilter
}: MoviesTabsProps) => {
  const [page] = useState(1);

  // Fetch data for each tab
  const { data: popularMovies, isLoading: isLoadingPopular } = useQuery({
    queryKey: ['movies', 'popular', page],
    queryFn: () => getPopularMovies(page),
  });

  const { data: topRatedMovies, isLoading: isLoadingTopRated } = useQuery({
    queryKey: ['movies', 'top_rated', page],
    queryFn: () => getTopRatedMovies(page),
  });

  const { data: trendingMovies, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['movies', 'trending', page],
    queryFn: () => getTrendingMovies('week', page),
  });

  // Filter movies based on current tab
  const currentMovies = activeTab === 'popular' ? popularMovies || [] :
                       activeTab === 'top_rated' ? topRatedMovies || [] :
                       trendingMovies || [];

  const filteredMovies = useFilteredMovies(currentMovies, sortBy, genreFilter);
  const extendedFilteredMovies = ensureExtendedMediaArray(filteredMovies);

  const isLoading = activeTab === 'popular' ? isLoadingPopular :
                   activeTab === 'top_rated' ? isLoadingTopRated :
                   isLoadingTrending;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }, (_, index) => (
          <MediaSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="popular">Popular</TabsTrigger>
        <TabsTrigger value="top_rated">Top Rated</TabsTrigger>
        <TabsTrigger value="trending">Trending</TabsTrigger>
      </TabsList>
      
      <TabsContent value="popular" className="mt-0">
        <MediaGrid 
          media={extendedFilteredMovies} 
          listView={viewMode === 'list'}
        />
      </TabsContent>
      
      <TabsContent value="top_rated" className="mt-0">
        <MediaGrid 
          media={extendedFilteredMovies} 
          listView={viewMode === 'list'}
        />
      </TabsContent>
      
      <TabsContent value="trending" className="mt-0">
        <MediaGrid 
          media={extendedFilteredMovies} 
          listView={viewMode === 'list'}
        />
      </TabsContent>
    </Tabs>
  );
};

export default MoviesTabs;
