
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPopularTVShows, getTopRatedTVShows } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tv } from 'lucide-react';

const TVShows = () => {
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated'>('popular');
  
  const popularTVQuery = useQuery({
    queryKey: ['popularTV'],
    queryFn: getPopularTVShows,
  });
  
  const topRatedTVQuery = useQuery({
    queryKey: ['topRatedTV'],
    queryFn: getTopRatedTVShows,
  });
  
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
                <MediaGrid media={popularTVQuery.data || []} title="Popular TV Shows" />
              )}
            </TabsContent>
            
            <TabsContent value="top_rated">
              {topRatedTVQuery.isLoading ? (
                <div className="py-12 text-center text-white">Loading top rated TV shows...</div>
              ) : topRatedTVQuery.isError ? (
                <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
              ) : (
                <MediaGrid media={topRatedTVQuery.data || []} title="Top Rated TV Shows" />
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
