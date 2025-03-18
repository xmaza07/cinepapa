
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPopularMovies, getTopRatedMovies } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Film } from 'lucide-react';

const Movies = () => {
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated'>('popular');
  
  const popularMoviesQuery = useQuery({
    queryKey: ['popularMovies'],
    queryFn: getPopularMovies,
  });
  
  const topRatedMoviesQuery = useQuery({
    queryKey: ['topRatedMovies'],
    queryFn: getTopRatedMovies,
  });
  
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
                <MediaGrid media={popularMoviesQuery.data || []} title="Popular Movies" />
              )}
            </TabsContent>
            
            <TabsContent value="top_rated">
              {topRatedMoviesQuery.isLoading ? (
                <div className="py-12 text-center text-white">Loading top rated movies...</div>
              ) : topRatedMoviesQuery.isError ? (
                <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
              ) : (
                <MediaGrid media={topRatedMoviesQuery.data || []} title="Top Rated Movies" />
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
