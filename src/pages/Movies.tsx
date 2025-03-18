
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPopularMovies, getTopRatedMovies } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Film, ChevronDown } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const Movies = () => {
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated'>('popular');
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  
  const popularMoviesQuery = useQuery({
    queryKey: ['popularMovies'],
    queryFn: getPopularMovies,
  });
  
  const topRatedMoviesQuery = useQuery({
    queryKey: ['topRatedMovies'],
    queryFn: getTopRatedMovies,
  });
  
  const handleShowMorePopular = () => {
    setPopularPage(prev => prev + 1);
  };
  
  const handleShowMoreTopRated = () => {
    setTopRatedPage(prev => prev + 1);
  };
  
  // Calculate displayed items based on current page
  const displayedPopularMovies = popularMoviesQuery.data 
    ? popularMoviesQuery.data.slice(0, popularPage * ITEMS_PER_PAGE)
    : [];
  
  const displayedTopRatedMovies = topRatedMoviesQuery.data 
    ? topRatedMoviesQuery.data.slice(0, topRatedPage * ITEMS_PER_PAGE)
    : [];
  
  // Check if there are more items to load
  const hasMorePopular = popularMoviesQuery.data 
    ? popularMoviesQuery.data.length > displayedPopularMovies.length
    : false;
    
  const hasMoreTopRated = topRatedMoviesQuery.data
    ? topRatedMoviesQuery.data.length > displayedTopRatedMovies.length
    : false;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Film className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-bold text-white">Movies</h1>
          </div>
          
          <Tabs defaultValue="popular" onValueChange={(value) => setActiveTab(value as 'popular' | 'top_rated')}>
            <TabsList className="mb-8">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="top_rated">Top Rated</TabsTrigger>
            </TabsList>
            
            <TabsContent value="popular">
              {popularMoviesQuery.isLoading ? (
                <div className="py-12 text-center text-white">Loading popular movies...</div>
              ) : popularMoviesQuery.isError ? (
                <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
              ) : (
                <>
                  <MediaGrid media={displayedPopularMovies} title="Popular Movies" />
                  
                  {hasMorePopular && (
                    <div className="flex justify-center my-8">
                      <Button 
                        onClick={handleShowMorePopular}
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10"
                      >
                        Show More <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="top_rated">
              {topRatedMoviesQuery.isLoading ? (
                <div className="py-12 text-center text-white">Loading top rated movies...</div>
              ) : topRatedMoviesQuery.isError ? (
                <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
              ) : (
                <>
                  <MediaGrid media={displayedTopRatedMovies} title="Top Rated Movies" />
                  
                  {hasMoreTopRated && (
                    <div className="flex justify-center my-8">
                      <Button 
                        onClick={handleShowMoreTopRated}
                        variant="outline"
                        className="border-white/10 text-white hover:bg-white/10"
                      >
                        Show More <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Movies;
