
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTVDetails, getSeasonDetails, backdropSizes, posterSizes } from '@/utils/api';
import { TVDetails, Episode } from '@/utils/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from '@/components/Navbar';
import ReviewSection from '@/components/ReviewSection';
import { Play, Calendar, Star, ArrowLeft, List, Shield, History } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWatchHistory } from '@/hooks/use-watch-history';
import { useAuth } from '@/hooks/use-auth';

const TVDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [tvShow, setTVShow] = useState<TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [backdropLoaded, setBackdropLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'episodes' | 'about' | 'reviews'>('episodes');
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getWatchHistoryItem } = useWatchHistory();
  const { user } = useAuth();
  const [watchHistory, setWatchHistory] = useState<Record<string, number>>({});
  
  // Fetch TV show details
  useEffect(() => {
    const fetchTVDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const tvId = parseInt(id, 10);
        console.log("Fetching TV details for ID:", tvId); // Debug log
        const data = await getTVDetails(tvId);
        console.log("TV details data:", data); // Debug log
        setTVShow(data);
        
        if (data && data.seasons && data.seasons.length > 0) {
          // Set default season to the first one
          const firstSeason = data.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
            setSelectedSeason(firstSeason.season_number);
          }
        }
      } catch (error) {
        console.error('Error fetching TV show details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTVDetails();
  }, [id]);
  
  // Fetch episodes when selected season changes
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!tvShow || !selectedSeason) return;
      
      try {
        const episodesData = await getSeasonDetails(tvShow.id, selectedSeason);
        setEpisodes(episodesData);
        
        // If user is logged in, fetch watch history for episodes
        if (user && id) {
          const tvId = parseInt(id, 10);
          const historyMap: Record<string, number> = {};
          
          for (const episode of episodesData) {
            const historyItem = await getWatchHistoryItem(
              tvId, 
              'tv', 
              selectedSeason, 
              episode.episode_number
            );
            
            if (historyItem) {
              // Store watching progress as percentage
              const progress = historyItem.duration > 0 
                ? (historyItem.watch_position / historyItem.duration) * 100 
                : 0;
              
              historyMap[`${selectedSeason}-${episode.episode_number}`] = progress;
            }
          }
          
          setWatchHistory(historyMap);
        }
      } catch (error) {
        console.error('Error fetching episodes:', error);
      }
    };
    
    fetchEpisodes();
  }, [tvShow, selectedSeason, user, id, getWatchHistoryItem]);
  
  const handlePlayEpisode = (seasonNumber: number, episodeNumber: number) => {
    if (tvShow) {
      navigate(`/player/tv/${tvShow.id}/${seasonNumber}/${episodeNumber}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse-slow text-white font-medium">Loading...</div>
      </div>
    );
  }
  
  if (!tvShow) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <h1 className="text-2xl text-white mb-4">TV Show not found</h1>
        <Button onClick={() => navigate('/')} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }
  
  const formatSeasonEpisodeCount = (count: number) => {
    return `${count} ${count === 1 ? 'Episode' : 'Episodes'}`;
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Backdrop Image */}
      <div className="relative w-full h-[70vh]">
        {/* Loading skeleton */}
        {!backdropLoaded && (
          <div className="absolute inset-0 bg-background image-skeleton" />
        )}
        
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-20 left-6 z-10 text-white p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <img
          src={`${backdropSizes.original}${tvShow.backdrop_path}`}
          alt={tvShow.name || 'TV Show backdrop'}
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            backdropLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setBackdropLoaded(true)}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 details-gradient" />
        
        {/* TV show info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
          <div className="flex flex-col md:flex-row items-start gap-6 max-w-6xl mx-auto">
            <div className="hidden md:block flex-shrink-0 w-48 xl:w-64 rounded-lg overflow-hidden shadow-lg">
              <img 
                src={`${posterSizes.medium}${tvShow.poster_path}`} 
                alt={tvShow.name || 'TV show poster'} 
                className="w-full h-auto"
              />
            </div>
            
            <div className="flex-1 animate-slide-up">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 text-balance">
                {tvShow.name}
              </h1>
              
              {tvShow.tagline && (
                <p className="text-white/70 mb-4 italic text-lg">{tvShow.tagline}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {tvShow.certification && (
                  <div className="flex items-center bg-white/20 px-2 py-1 rounded">
                    <Shield className="h-4 w-4 mr-1 text-white" />
                    <span className="text-white font-medium text-sm">{tvShow.certification}</span>
                  </div>
                )}
                
                {tvShow.first_air_date && (
                  <div className="flex items-center text-white/80">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(tvShow.first_air_date).getFullYear()}
                  </div>
                )}
                
                <div className="flex items-center text-white/80">
                  <List className="h-4 w-4 mr-2" />
                  {tvShow.number_of_seasons} {tvShow.number_of_seasons === 1 ? 'Season' : 'Seasons'}
                </div>
                
                {tvShow.vote_average > 0 && (
                  <div className="flex items-center text-amber-400">
                    <Star className="h-4 w-4 mr-2 fill-amber-400" />
                    {tvShow.vote_average.toFixed(1)}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {tvShow.genres.map((genre) => (
                    <span 
                      key={genre.id}
                      className="px-2 py-1 rounded bg-white/10 text-white/80 text-xs"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <p className="text-white/80 mb-6">{tvShow.overview}</p>
              
              {episodes.length > 0 && (
                <Button 
                  onClick={() => handlePlayEpisode(selectedSeason, 1)}
                  className="bg-accent hover:bg-accent/80 text-white flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Play Latest Episode
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex border-b border-white/10 mb-6 overflow-x-auto pb-1 hide-scrollbar">
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'episodes' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('episodes')}
          >
            Episodes
          </button>
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'about' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button
            className={`py-2 px-4 font-medium whitespace-nowrap ${
              activeTab === 'reviews' 
                ? 'text-white border-b-2 border-accent' 
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </button>
        </div>
        
        {/* Episodes Tab */}
        {activeTab === 'episodes' && (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">Seasons & Episodes</h2>
            
            {/* Season selector - wrapped in Tabs component */}
            <Tabs 
              defaultValue={selectedSeason.toString()} 
              onValueChange={(value) => setSelectedSeason(parseInt(value, 10))}
              className="mb-6"
            >
              <TabsList className="bg-white/10 p-1 overflow-x-auto flex-nowrap whitespace-nowrap max-w-full">
                {tvShow.seasons
                  .filter(season => season.season_number > 0)
                  .map(season => (
                    <TabsTrigger 
                      key={season.id}
                      value={season.season_number.toString()}
                      className={selectedSeason === season.season_number ? 'text-white' : 'text-white/70'}
                    >
                      Season {season.season_number}
                    </TabsTrigger>
                  ))}
              </TabsList>
              
              {/* We don't need separate TabsContent components since we're managing the episodes state with our own state */}
            </Tabs>
            
            {/* Episodes list */}
            <div className="space-y-4">
              {episodes.length > 0 ? (
                episodes.map(episode => {
                  const episodeKey = `${selectedSeason}-${episode.episode_number}`;
                  const hasWatched = watchHistory[episodeKey] !== undefined;
                  const watchProgress = watchHistory[episodeKey] || 0;
                  const isCompleted = watchProgress > 90; // Consider completed if watched more than 90%
                  
                  return (
                    <div key={episode.id} className="glass p-4 rounded-lg">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-shrink-0 w-full md:w-48 relative">
                          {episode.still_path && (
                            <img 
                              src={`${backdropSizes.small}${episode.still_path}`} 
                              alt={`${episode.name} still`}
                              className="w-full h-auto rounded-lg"
                            />
                          )}
                          
                          {/* Watch progress indicator */}
                          {hasWatched && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                              <div 
                                className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-accent'}`}
                                style={{ width: `${watchProgress}%` }}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-medium flex items-center">
                              {episode.episode_number}. {episode.name}
                              {hasWatched && (
                                <History className="h-4 w-4 ml-2 text-accent" />
                              )}
                            </h3>
                            {episode.vote_average > 0 && (
                              <div className="flex items-center text-amber-400 text-sm">
                                <Star className="h-3 w-3 mr-1 fill-amber-400" />
                                {episode.vote_average.toFixed(1)}
                              </div>
                            )}
                          </div>
                          
                          <p className="text-white/70 text-sm mb-3 line-clamp-2">{episode.overview}</p>
                          
                          <Button 
                            onClick={() => handlePlayEpisode(episode.season_number, episode.episode_number)}
                            size="sm"
                            className="bg-accent hover:bg-accent/80 text-white flex items-center"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            {hasWatched && !isCompleted ? 'Resume' : 'Play'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-white/70">
                  No episodes available for this season.
                </div>
              )}
            </div>
          </>
        )}
        
        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">About the Show</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">Status</h3>
                <p className="text-white/80">{tvShow.status}</p>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">Episodes</h3>
                <p className="text-white/80">{tvShow.number_of_episodes}</p>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-white mb-3">Seasons</h3>
                <p className="text-white/80">{tvShow.number_of_seasons}</p>
              </div>
            </div>
            
            {/* Production companies */}
            {tvShow.production_companies.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Production Companies</h3>
                <div className="flex flex-wrap gap-6">
                  {tvShow.production_companies.map((company) => (
                    <div key={company.id} className="text-center">
                      {company.logo_path ? (
                        <div className="bg-white/10 p-3 rounded-lg w-24 h-16 flex items-center justify-center mb-2">
                          <img 
                            src={`${posterSizes.small}${company.logo_path}`} 
                            alt={company.name} 
                            className="max-w-full max-h-full"
                          />
                        </div>
                      ) : (
                        <div className="bg-white/10 p-3 rounded-lg w-24 h-16 flex items-center justify-center mb-2">
                          <span className="text-white/70 text-xs text-center">{company.name}</span>
                        </div>
                      )}
                      <p className="text-white/70 text-sm">{company.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">User Reviews</h2>
            <ReviewSection mediaId={parseInt(id!, 10)} mediaType="tv" />
          </div>
        )}
      </div>
    </div>
  );
};

export default TVDetailsPage;
