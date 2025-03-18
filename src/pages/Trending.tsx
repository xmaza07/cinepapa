
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTrending } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TrendingUp, ChevronDown } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const Trending = () => {
  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('week');
  const [page, setPage] = useState(1);
  
  const trendingQuery = useQuery({
    queryKey: ['trending', timeWindow],
    queryFn: () => getTrending(timeWindow),
  });
  
  const handleShowMore = () => {
    setPage(prev => prev + 1);
  };
  
  // Calculate displayed items based on current page
  const displayedTrending = trendingQuery.data 
    ? trendingQuery.data.slice(0, page * ITEMS_PER_PAGE)
    : [];
  
  // Check if there are more items to load
  const hasMore = trendingQuery.data 
    ? trendingQuery.data.length > displayedTrending.length
    : false;
  
  // Reset page when changing time window
  const handleTimeWindowChange = (value: 'day' | 'week') => {
    setTimeWindow(value);
    setPage(1);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-bold text-white">Trending</h1>
          </div>
          
          <Tabs defaultValue="week" onValueChange={(value) => handleTimeWindowChange(value as 'day' | 'week')}>
            <TabsList className="mb-8">
              <TabsTrigger value="day">Today</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
            </TabsList>
            
            <TabsContent value="day">
              {trendingQuery.isLoading ? (
                <div className="py-12 text-center text-white">Loading trending content...</div>
              ) : trendingQuery.isError ? (
                <div className="py-12 text-center text-white">Error loading trending content. Please try again.</div>
              ) : (
                <>
                  <MediaGrid media={displayedTrending} title="Trending Today" />
                  
                  {hasMore && (
                    <div className="flex justify-center my-8">
                      <Button 
                        onClick={handleShowMore}
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
            
            <TabsContent value="week">
              {trendingQuery.isLoading ? (
                <div className="py-12 text-center text-white">Loading trending content...</div>
              ) : trendingQuery.isError ? (
                <div className="py-12 text-center text-white">Error loading trending content. Please try again.</div>
              ) : (
                <>
                  <MediaGrid media={displayedTrending} title="Trending This Week" />
                  
                  {hasMore && (
                    <div className="flex justify-center my-8">
                      <Button 
                        onClick={handleShowMore}
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

export default Trending;
