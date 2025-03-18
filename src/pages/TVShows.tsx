
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPopularTVShows, getTopRatedTVShows } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tv, ChevronDown } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const TVShows = () => {
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated'>('popular');
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  
  const popularTVQuery = useQuery({
    queryKey: ['popularTV'],
    queryFn: getPopularTVShows,
  });
  
  const topRatedTVQuery = useQuery({
    queryKey: ['topRatedTV'],
    queryFn: getTopRatedTVShows,
  });
  
  const handleShowMorePopular = () => {
    setPopularPage(prev => prev + 1);
  };
  
  const handleShowMoreTopRated = () => {
    setTopRatedPage(prev => prev + 1);
  };
  
  // Calculate displayed items based on current page
  const displayedPopularTV = popularTVQuery.data 
    ? popularTVQuery.data.slice(0, popularPage * ITEMS_PER_PAGE)
    : [];
  
  const displayedTopRatedTV = topRatedTVQuery.data 
    ? topRatedTVQuery.data.slice(0, topRatedPage * ITEMS_PER_PAGE)
    : [];
  
  // Check if there are more items to load
  const hasMorePopular = popularTVQuery.data 
    ? popularTVQuery.data.length > displayedPopularTV.length
    : false;
    
  const hasMoreTopRated = topRatedTVQuery.data
    ? topRatedTVQuery.data.length > displayedTopRatedTV.length
    : false;
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Tv className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-bold text-white">TV Shows</h1>
          </div>
          
          <Tabs defaultValue="popular" onValueChange={(value) => setActiveTab(value as 'popular' | 'top_rated')}>
            <TabsList className="mb-8">
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="top_rated">Top Rated</TabsTrigger>
            </TabsList>
            
            <TabsContent value="popular">
              {popularTVQuery.isLoading ? (
                <div className="py-12 text-center text-white">Loading popular TV shows...</div>
              ) : popularTVQuery.isError ? (
                <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
              ) : (
                <>
                  <MediaGrid media={displayedPopularTV} title="Popular TV Shows" />
                  
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
              {topRatedTVQuery.isLoading ? (
                <div className="py-12 text-center text-white">Loading top rated TV shows...</div>
              ) : topRatedTVQuery.isError ? (
                <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
              ) : (
                <>
                  <MediaGrid media={displayedTopRatedTV} title="Top Rated TV Shows" />
                  
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

export default TVShows;
