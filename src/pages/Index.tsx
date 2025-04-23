import { useState, useEffect } from 'react';
import {
  getTrending,
  getPopularMovies,
  getPopularTVShows,
  getTopRatedMovies,
  getTopRatedTVShows,
  getBollywoodMovies,
  getActionMovies,
  getDramaMovies,
  getNetflixContent,
  getHuluContent,
  getPrimeContent,
  getParamountContent,
  getDisneyContent,
  getHotstarContent,
  getAppleTVContent,
  getJioCinemaContent,
  getSonyLivContent
} from '@/utils/api';
import { Media } from '@/utils/types';
import { useAuth } from '@/hooks';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import ContentRow from '@/components/ContentRow';
import ContinueWatching from '@/components/ContinueWatching';
import Footer from '@/components/Footer';
import Spinner from '@/components/ui/spinner';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const Index = () => {
  const { user } = useAuth();
  const [trendingMedia, setTrendingMedia] = useState<Media[]>([]);
  const [popularMovies, setPopularMovies] = useState<Media[]>([]);
  const [popularTVShows, setPopularTVShows] = useState<Media[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Media[]>([]);
  const [topRatedTVShows, setTopRatedTVShows] = useState<Media[]>([]);
  const [bollywoodMovies, setBollywoodMovies] = useState<Media[]>([]);
  const [actionMovies, setActionMovies] = useState<Media[]>([]);
  const [dramaMovies, setDramaMovies] = useState<Media[]>([]);
  const [netflixContent, setNetflixContent] = useState<Media[]>([]);
  const [huluContent, setHuluContent] = useState<Media[]>([]);
  const [primeContent, setPrimeContent] = useState<Media[]>([]);
  const [paramountContent, setParamountContent] = useState<Media[]>([]);
  const [disneyContent, setDisneyContent] = useState<Media[]>([]);
  const [hotstarContent, setHotstarContent] = useState<Media[]>([]);
  const [appleTVContent, setAppleTVContent] = useState<Media[]>([]);
  const [jioCinemaContent, setJioCinemaContent] = useState<Media[]>([]);
  const [sonyLivContent, setSonyLivContent] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        console.log('Trending data before filter:', trendingData);
        const filteredTrendingData = trendingData.filter(item => item.backdrop_path);
        console.log('Trending data after filter:', filteredTrendingData);

        setTrendingMedia(filteredTrendingData);
        setPopularMovies(popularMoviesData);
        setPopularTVShows(popularTVData);
        setTopRatedMovies(topMoviesData);
        setTopRatedTVShows(topTVData);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setIsLoading(false);
        setTimeout(() => {
          setContentVisible(true);
        }, 300);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchExtraSections = async () => {
      setBollywoodMovies(await getBollywoodMovies());
      setActionMovies(await getActionMovies());
      setDramaMovies(await getDramaMovies());
      setNetflixContent(await getNetflixContent());
      setHuluContent(await getHuluContent());
      setPrimeContent(await getPrimeContent());
      setParamountContent(await getParamountContent());
      setDisneyContent(await getDisneyContent());
      setHotstarContent(await getHotstarContent());
      setAppleTVContent(await getAppleTVContent());
      setJioCinemaContent(await getJioCinemaContent());
      setSonyLivContent(await getSonyLivContent());
    };
    fetchExtraSections();
  }, []);

  console.log('Current trendingMedia state:', trendingMedia);

  return (
    <main className="min-h-screen bg-background pb-16">
      <Navbar />
      <PWAInstallPrompt />

      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" className="text-accent" />
        </div>
      ) : (
        <>
          <div className="pt-16"> {/* Add padding-top to account for navbar */}
            {trendingMedia.length > 0 && <Hero media={trendingMedia.slice(0, 5)} className="hero" />}
          </div>

          <div className={`mt-8 md:mt-12 transition-opacity duration-500 ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
            {user && <ContinueWatching />}
            <ContentRow title="Trending Now" media={trendingMedia} featured />
            <ContentRow title="Popular Movies" media={popularMovies} />
            <ContentRow title="Popular TV Shows" media={popularTVShows} />
            <ContentRow title="Top Rated Movies" media={topRatedMovies} />
            <ContentRow title="Top Rated TV Shows" media={topRatedTVShows} />
            {/* New Sections */}
            <ContentRow title="Bollywood" media={bollywoodMovies} />
            <ContentRow title="Action" media={actionMovies} />
            <ContentRow title="Drama" media={dramaMovies} />
            <ContentRow title="Netflix" media={netflixContent} />
            <ContentRow title="Hulu" media={huluContent} />
            <ContentRow title="Prime Video" media={primeContent} />
            <ContentRow title="Paramount+" media={paramountContent} />
            <ContentRow title="Disney+" media={disneyContent} />
            <ContentRow title="Hotstar" media={hotstarContent} />
            <ContentRow title="Apple TV+" media={appleTVContent} />
            <ContentRow title="JioCinema" media={jioCinemaContent} />
            <ContentRow title="Sony Liv" media={sonyLivContent} />
          </div>
        </>
      )}

      <Footer />
    </main>
  );
};

export default Index;
