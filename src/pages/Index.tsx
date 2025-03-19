
import { useState, useEffect } from 'react';
import { 
  getTrending, 
  getPopularMovies, 
  getPopularTVShows,
  getTopRatedMovies,
  getTopRatedTVShows
} from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ContentRow from '@/components/ContentRow';
import Footer from '@/components/Footer';

const Index = () => {
  const [trendingMedia, setTrendingMedia] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<Media[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Media[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [
          trendingData,
          popularMoviesData,
          popularTVData,
          topMoviesData,
          topTVData
        ] = await Promise.all([
          getTrending(),
          getPopularMovies(),
          getPopularTVShows(),
          getTopRatedMovies(),
          getTopRatedTVShows()
        ]);
        
        // Update state with fetched data
        setTrendingMedia(trendingData.filter(item => item.backdrop_path));
        setPopularMovies(popularMoviesData);
        setPopularTVShows(popularTVData);
        setTopRatedMovies(topMoviesData);
        setTopRatedTVShows(topTVData);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setIsLoading(false);
        
        // Delay showing content for a smoother animation
        setTimeout(() => {
          setContentVisible(true);
        }, 300);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <main className="min-h-screen bg-background pb-16">
      <Navbar />
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse-slow text-white font-medium">Loading...</div>
        </div>
      ) : (
        <>
          {/* Hero section with featured content */}
          {trendingMedia.length > 0 && <Hero media={trendingMedia.slice(0, 5)} />}
          
          {/* Content rows with staggered animations */}
          <div className={`mt-8 md:mt-12 transition-opacity duration-500 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
            <ContentRow title="Trending Now" media={trendingMedia} featured />
            <ContentRow title="Popular Movies" media={popularMovies} />
            <ContentRow title="Popular TV Shows" media={popularTVShows} />
            <ContentRow title="Top Rated Movies" media={topRatedMovies} />
            <ContentRow title="Top Rated TV Shows" media={topRatedTVShows} />
          </div>
        </>
      )}
      
      <Footer />
    </main>
  );
};

export default Index;
