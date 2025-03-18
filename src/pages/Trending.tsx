
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTrending } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';

const Trending = () => {
  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('week');
  
  const trendingQuery = useQuery({
    queryKey: ['trending', timeWindow],
    queryFn: () => getTrending(timeWindow),
  });
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        <div className="container px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-bold text-white">Trending</h1>
          </div>
          
          <Tabs defaultValue="week" onValueChange={(value) => setTimeWindow(value as 'day' | 'week')}>
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
                <MediaGrid media={trendingQuery.data || []} title="Trending Today" />
              )}
            </TabsContent>
            
            <TabsContent value="week">
              {trendingQuery.isLoading ? (
                <div className="py-12 text-center text-white">Loading trending content...</div>
              ) : trendingQuery.isError ? (
                <div className="py-12 text-center text-white">Error loading trending content. Please try again.</div>
              ) : (
                <MediaGrid media={trendingQuery.data || []} title="Trending This Week" />
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
