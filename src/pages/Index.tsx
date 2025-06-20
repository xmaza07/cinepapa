
import { useState, useEffect, Suspense, lazy } from 'react';
import {
  getTrending,
  getPopularMovies,
  getPopularTVShows,
  getTopRatedMovies,
  getTopRatedTVShows,
} from '@/utils/api';
import { Media } from '@/utils/types';
import { useAuth } from '@/hooks';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ContentRow from '@/components/ContentRow';
import ContinueWatching from '@/components/ContinueWatching';
import Footer from '@/components/Footer';
import Spinner from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-loaded secondary content
const SecondaryContent = lazy(() => import('./components/SecondaryContent'));

const Index = () => {
  const { user } = useAuth();
  const [trendingMedia, setTrendingMedia] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<Media[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Media[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);
  const [secondaryLoaded, setSecondaryLoaded] = useState(false);

  // Primary data fetch - critical for initial render
  useEffect(() => {
    const fetchPrimaryData = async () => {
      try {
        // Use Promise.all for parallel requests
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

        const filteredTrendingData = trendingData.filter(item => item.backdrop_path);

        setTrendingMedia(filteredTrendingData);
        setPopularMovies(popularMoviesData);
        setPopularTVShows(popularTVData);
        setTopRatedMovies(topMoviesData);
        setTopRatedTVShows(topTVData);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setIsLoading(false);
        // Add a slight delay for content fade-in
        setTimeout(() => {
          setContentVisible(true);
        }, 100);
        
        // After primary content is visible, load secondary content
        setTimeout(() => {
          setSecondaryLoaded(true);
        }, 1000);
      }
    };

    fetchPrimaryData();
  }, []);

  // Content placeholder skeleton for glassmorphic design
  const RowSkeleton = () => (
    <div className="mb-8 px-8">
      <Skeleton className="h-8 w-48 mb-6 bg-white/10" />
      <div className="flex gap-6 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0">
            <Skeleton className="w-64 h-96 rounded-2xl bg-white/10" />
            <Skeleton className="w-48 h-4 mt-4 bg-white/5" />
            <Skeleton className="w-32 h-3 mt-2 bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen min-h-svh w-full flex flex-col overflow-x-hidden">
      {/* Glassmorphic Navigation */}
      <div className="nav-glassmorphic">
        <Navbar />
      </div>

      <div className="flex-1 flex flex-col justify-start items-stretch w-full">
        {isLoading ? (
          <div className="flex flex-col gap-8 pt-24 flex-1 w-full">
            {/* Hero skeleton with glassmorphic styling */}
            <div className="mx-8 mb-8">
              <Skeleton className="w-full h-[60vh] rounded-2xl bg-white/10" />
            </div>
            <RowSkeleton />
            <RowSkeleton />
          </div>
        ) : (
          <>
            {/* Hero Section with glassmorphic container */}
            <div className="pt-24 flex-shrink-0 w-full px-8">
              {trendingMedia.length > 0 && (
                <div className="hero-glassmorphic mb-8">
                  <Hero media={trendingMedia.slice(0, 10)} className="hero w-full" />
                </div>
              )}
            </div>

            {/* Content sections with glassmorphic styling */}
            <div className={`flex-1 flex flex-col mt-8 transition-opacity duration-300 w-full ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
              {/* Continue watching with glassmorphic card */}
              {user && (
                <div className="px-8 mb-8">
                  <div className="continue-watching">
                    <ContinueWatching />
                  </div>
                </div>
              )}

              {/* Content rows with improved spacing and glassmorphic design */}
              <div className="content-row" style={{ animationDelay: '0.1s' }}>
                <ContentRow title="Trending Now" media={trendingMedia} featured />
              </div>
              
              <div className="content-row" style={{ animationDelay: '0.2s' }}>
                <ContentRow title="Popular Movies" media={popularMovies} />
              </div>
              
              <div className="content-row" style={{ animationDelay: '0.3s' }}>
                <ContentRow title="Popular TV Shows" media={popularTVShows} />
              </div>
              
              <div className="content-row" style={{ animationDelay: '0.4s' }}>
                <ContentRow title="Top Rated Movies" media={topRatedMovies} />
              </div>
              
              <div className="content-row" style={{ animationDelay: '0.5s' }}>
                <ContentRow title="Top Rated TV Shows" media={topRatedTVShows} />
              </div>

              {/* Lazy load secondary content */}
              {secondaryLoaded && (
                <Suspense fallback={
                  <div className="py-8 flex justify-center">
                    <Spinner size="lg" className="mx-auto text-primary" />
                  </div>
                }>
                  <SecondaryContent />
                </Suspense>
              )}
            </div>
          </>
        )}
      </div>

      {/* Glassmorphic Footer */}
      <div className="footer-glassmorphic">
        <Footer />
      </div>
    </main>
  );
};

export default Index;
