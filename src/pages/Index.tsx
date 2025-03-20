
import { useState, useEffect } from 'react';
import { getTrending, getPopularMovies, getPopularTVShows } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import ContentRow from '@/components/ContentRow';
import PageTransition from '@/components/PageTransition';
import ContinueWatching from '@/components/ContinueWatching';
import { useAuth } from '@/hooks/use-auth';

const Index = () => {
  const [trendingMedia, setTrendingMedia] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all data in parallel
        const [trendingData, moviesData, tvShowsData] = await Promise.all([
          getTrending(),
          getPopularMovies(),
          getPopularTVShows()
        ]);
        
        setTrendingMedia(trendingData);
        setPopularMovies(moviesData);
        setPopularTVShows(tvShowsData);
      } catch (error) {
        console.error('Error fetching home page data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Select a random item from trending for the hero
  const heroItem = trendingMedia.length > 0 
    ? trendingMedia[Math.floor(Math.random() * trendingMedia.length)]
    : null;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* Hero Section */}
        {heroItem && <Hero media={heroItem} />}
        
        {/* Main Content */}
        <div className="relative z-10 pt-8">
          {/* Continue Watching (only for logged in users) */}
          {user && <ContinueWatching />}
          
          {/* Trending Content */}
          <ContentRow 
            title="Trending Now" 
            items={trendingMedia} 
            isLoading={isLoading}
          />
          
          {/* Popular Movies */}
          <ContentRow 
            title="Popular Movies" 
            items={popularMovies} 
            isLoading={isLoading}
            mediaType="movie"
          />
          
          {/* Popular TV Shows */}
          <ContentRow 
            title="Popular TV Shows" 
            items={popularTVShows} 
            isLoading={isLoading}
            mediaType="tv"
          />
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Index;
