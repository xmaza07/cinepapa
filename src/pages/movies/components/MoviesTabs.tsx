
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getPopularMovies, getTopRatedMovies, getTrendingMovies } from '@/utils/api';
import { Media, ensureExtendedMediaArray } from '@/utils/types';
import MediaGrid from '@/components/MediaGrid';
import { MediaGridSkeleton } from '@/components/MediaSkeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useFilteredMovies } from '../hooks/useFilteredMovies';

const ITEMS_PER_PAGE = 20;

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
  const queryClient = useQueryClient();
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [trendingPage, setTrendingPage] = useState(1);
  const [allPopularMovies, setAllPopularMovies] = useState<Media[]>([]);
  const [allTopRatedMovies, setAllTopRatedMovies] = useState<Media[]>([]);
  const [allTrendingMovies, setAllTrendingMovies] = useState<Media[]>([]);

  const popularMoviesQuery = useQuery({
    queryKey: ['popularMovies', popularPage],
    queryFn: () => getPopularMovies(popularPage),
    placeholderData: keepPreviousData,
  });
  
  const topRatedMoviesQuery = useQuery({
    queryKey: ['topRatedMovies', topRatedPage],
    queryFn: () => getTopRatedMovies(topRatedPage),
    placeholderData: keepPreviousData,
  });

  const trendingMoviesQuery = useQuery({
    queryKey: ['trendingMovies', trendingPage],
    queryFn: () => getTrendingMovies('week', trendingPage),
    placeholderData: keepPreviousData,
  });

  // Update movie collections when queries return
  useEffect(() => {
    if (popularMoviesQuery.data) {
      setAllPopularMovies(prev => {
        const newMovies = popularMoviesQuery.data
          .filter(movie => !prev.some(p => p.id === (movie.id || movie.media_id)))
          .map(movie => ({
            ...movie,
            id: movie.id || movie.media_id || 0,
            media_id: movie.id || movie.media_id || 0,
            media_type: 'movie' as const,
          }));
        return [...prev, ...newMovies];
      });
    }
  }, [popularMoviesQuery.data]);

  useEffect(() => {
    if (topRatedMoviesQuery.data) {
      setAllTopRatedMovies(prev => {
        const newMovies = topRatedMoviesQuery.data
          .filter(movie => !prev.some(p => p.id === (movie.id || movie.media_id)))
          .map(movie => ({
            ...movie,
            id: movie.id || movie.media_id || 0,
            media_id: movie.id || movie.media_id || 0,
            media_type: 'movie' as const,
          }));
        return [...prev, ...newMovies];
      });
    }
  }, [topRatedMoviesQuery.data]);

  useEffect(() => {
    if (trendingMoviesQuery.data) {
      setAllTrendingMovies(prev => {
        const newMovies = trendingMoviesQuery.data
          .filter(movie => !prev.some(p => p.id === (movie.id || movie.media_id)))
          .map(movie => ({
            ...movie,
            id: movie.id || movie.media_id || 0,
            media_id: movie.id || movie.media_id || 0,
            media_type: 'movie' as const,
          }));
        return [...prev, ...newMovies];
      });
    }
  }, [trendingMoviesQuery.data]);

  // Prefetch next pages
  useEffect(() => {
    if (popularMoviesQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['popularMovies', popularPage + 1],
        queryFn: () => getPopularMovies(popularPage + 1),
      });
    }
  }, [popularPage, queryClient, popularMoviesQuery.data]);

  useEffect(() => {
    if (topRatedMoviesQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['topRatedMovies', topRatedPage + 1],
        queryFn: () => getTopRatedMovies(topRatedPage + 1),
      });
    }
  }, [topRatedPage, queryClient, topRatedMoviesQuery.data]);

  useEffect(() => {
    if (trendingMoviesQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['trendingMovies', trendingPage + 1],
        queryFn: () => getTrendingMovies('week', trendingPage + 1),
      });
    }
  }, [trendingPage, queryClient, trendingMoviesQuery.data]);

  const filteredPopularMovies = useFilteredMovies(allPopularMovies, sortBy, genreFilter);
  const filteredTopRatedMovies = useFilteredMovies(allTopRatedMovies, sortBy, genreFilter);
  const filteredTrendingMovies = useFilteredMovies(allTrendingMovies, sortBy, genreFilter);

  const hasMorePopular = popularMoviesQuery.data?.length === ITEMS_PER_PAGE;
  const hasMoreTopRated = topRatedMoviesQuery.data?.length === ITEMS_PER_PAGE;
  const hasMoreTrending = trendingMoviesQuery.data?.length === ITEMS_PER_PAGE;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList className="mb-6">
        <TabsTrigger value="popular" className="data-[state=active]:bg-accent/20">Popular</TabsTrigger>
        <TabsTrigger value="top_rated" className="data-[state=active]:bg-accent/20">Top Rated</TabsTrigger>
        <TabsTrigger value="trending" className="data-[state=active]:bg-accent/20">Trending</TabsTrigger>
      </TabsList>
      
      <TabsContent value="popular" className="focus-visible:outline-none animate-fade-in">
        {popularMoviesQuery.isLoading ? (
          <MediaGridSkeleton listView={viewMode === 'list'} />
        ) : popularMoviesQuery.isError ? (
          <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
        ) : (
          <>
            <MediaGrid media={ensureExtendedMediaArray(filteredPopularMovies)} title="Popular Movies" listView={viewMode === 'list'} />
            
            {hasMorePopular && (
              <div className="flex justify-center my-8">
                <Button 
                  onClick={() => setPopularPage(prev => prev + 1)}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                >
                  {popularMoviesQuery.isFetching ? (
                    <>Loading...</>
                  ) : (
                    <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </TabsContent>
      
      <TabsContent value="top_rated" className="focus-visible:outline-none animate-fade-in">
        {topRatedMoviesQuery.isLoading ? (
          <MediaGridSkeleton listView={viewMode === 'list'} />
        ) : topRatedMoviesQuery.isError ? (
          <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
        ) : (
          <>
            <MediaGrid media={ensureExtendedMediaArray(filteredTopRatedMovies)} title="Top Rated Movies" listView={viewMode === 'list'} />
            
            {hasMoreTopRated && (
              <div className="flex justify-center my-8">
                <Button 
                  onClick={() => setTopRatedPage(prev => prev + 1)}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                >
                  {topRatedMoviesQuery.isFetching ? (
                    <>Loading...</>
                  ) : (
                    <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="trending" className="focus-visible:outline-none animate-fade-in">
        {trendingMoviesQuery.isLoading ? (
          <MediaGridSkeleton listView={viewMode === 'list'} />
        ) : trendingMoviesQuery.isError ? (
          <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
        ) : (
          <>
            <MediaGrid media={ensureExtendedMediaArray(filteredTrendingMovies)} title="Trending Movies" listView={viewMode === 'list'} />
            
            {hasMoreTrending && (
              <div className="flex justify-center my-8">
                <Button 
                  onClick={() => setTrendingPage(prev => prev + 1)}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                >
                  {trendingMoviesQuery.isFetching ? (
                    <>Loading...</>
                  ) : (
                    <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default MoviesTabs;
