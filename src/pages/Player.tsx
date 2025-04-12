
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMovieDetails, getTVDetails, videoSources, getSeasonDetails } from '@/utils/api';
import { fetchMovieSources, fetchTVSources } from '@/utils/custom-api';
import { MovieDetails, TVDetails, VideoSource, Episode } from '@/utils/types';
import Navbar from '@/components/Navbar';
import HLSPlayer from '@/components/HLSPlayer';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Film, Tv, Check, SkipBack, SkipForward, Heart, Bookmark } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWatchHistory } from '@/hooks/watch-history';
import { useAuth } from '@/hooks';
import { useUserPreferences } from '@/hooks/user-preferences';

const MIN_WATCH_TIME = 30; // 30 seconds minimum before recording

const Player = () => {
  const { id, season, episode, type } = useParams<{
    id: string;
    season?: string;
    episode?: string;
    type: string;
  }>();
  const { userPreferences, updatePreferences } = useUserPreferences();
  const [title, setTitle] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>(
    userPreferences?.preferred_source || videoSources[0].key
  );
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [mediaDetails, setMediaDetails] = useState<MovieDetails | TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const watchHistoryRecorded = useRef(false);
  const [hlsSource, setHlsSource] = useState<string | null>(null);
  const [isCustomSource, setIsCustomSource] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { 
    addToWatchHistory, 
    addToFavorites, 
    addToWatchlist, 
    removeFromFavorites,
    removeFromWatchlist,
    isInFavorites,
    isInWatchlist
  } = useWatchHistory();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);

  // Effect to check favorites and watchlist status
  useEffect(() => {
    if (user && id && mediaType) {
      const mediaId = parseInt(id, 10);
      setIsFavorite(isInFavorites(mediaId, mediaType));
      setIsInMyWatchlist(isInWatchlist(mediaId, mediaType));
    }
  }, [user, id, mediaType, isInFavorites, isInWatchlist]);

  // Effect to initialize selected source from preferences
  useEffect(() => {
    if (userPreferences?.preferred_source) {
      setSelectedSource(userPreferences.preferred_source);
    }
  }, [userPreferences?.preferred_source]);

  // Update media type based on URL parameter
  useEffect(() => {
    if (type === 'movie' || type === 'tv') {
      setMediaType(type);
    }
  }, [type]);

  // Check if selected source is our custom API source
  useEffect(() => {
    setIsCustomSource(selectedSource === 'custom-api');
    // Reset HLS source when changing sources
    if (selectedSource !== 'custom-api') {
      setHlsSource(null);
    }
  }, [selectedSource]);

  // Fetch HLS stream URL when using custom API
  useEffect(() => {
    const fetchHlsStream = async () => {
      if (!isCustomSource || !id) return;
      
      try {
        setIsLoading(true);
        const mediaId = parseInt(id, 10);
        let streamUrl: string | null = null;
        
        if (mediaType === 'movie') {
          streamUrl = await fetchMovieSources(mediaId);
        } else if (mediaType === 'tv' && season && episode) {
          streamUrl = await fetchTVSources(mediaId, parseInt(season, 10), parseInt(episode, 10));
        }
        
        if (streamUrl) {
          setHlsSource(streamUrl);
        } else {
          toast({
            title: "Stream Not Available",
            description: "Could not find a valid stream. Please try another source.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching HLS stream:', error);
        toast({
          title: "Error",
          description: "Failed to load video stream. Please try another source.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHlsStream();
  }, [isCustomSource, id, mediaType, season, episode, toast]);

  // Memoized function to update the iframe URL
  const updateIframeUrl = useCallback((mediaId: number, seasonNum?: number, episodeNum?: number) => {
    // Skip iframe URL update for custom source
    if (isCustomSource) return;
    
    const source = videoSources.find(src => src.key === selectedSource);
    if (!source) return;
    
    let url;
    if (mediaType === 'movie') {
      url = source.getMovieUrl(mediaId);
    } else if (mediaType === 'tv' && seasonNum && episodeNum) {
      url = source.getTVUrl(mediaId, seasonNum, episodeNum);
    }
    
    if (url) {
      setIframeUrl(url);
      setIsPlayerLoaded(true);
    }
  }, [selectedSource, mediaType, isCustomSource]);

  // Handle player load and record watch history
  useEffect(() => {
    if (!isPlayerLoaded || !user || !mediaDetails || !id || watchHistoryRecorded.current) return;

    // Only record once per player load session
    if (!watchHistoryRecorded.current) {
      const mediaId = parseInt(id, 10);
      const duration = mediaType === 'movie' 
        ? (mediaDetails as MovieDetails).runtime * 60
        : ((mediaDetails as TVDetails).episode_run_time?.[0] || 30) * 60;
      
      watchHistoryRecorded.current = true;
      
      // Add to watch history with initial position of 0
      console.log('Recording initial watch history on player load');
      addToWatchHistory(
        {
          id: mediaId,
          title: (mediaDetails as MovieDetails).title || (mediaDetails as TVDetails).name || '',
          poster_path: mediaDetails.poster_path,
          backdrop_path: mediaDetails.backdrop_path,
          overview: mediaDetails.overview,
          vote_average: mediaDetails.vote_average,
          media_type: mediaType,
          genre_ids: mediaDetails.genres.map(g => g.id)
        },
        0, // Initial position
        duration,
        season ? parseInt(season, 10) : undefined,
        episode ? parseInt(episode, 10) : undefined,
        selectedSource
      );
    }
  }, [isPlayerLoaded, user, mediaDetails, id, mediaType, season, episode, selectedSource, addToWatchHistory]);

  // Primary effect: Fetch media details when route params change
  useEffect(() => {
    let isMounted = true;
    
    // Reset player load state and watch history recorded flag
    setIsPlayerLoaded(false);
    watchHistoryRecorded.current = false;
    
    const fetchMediaDetails = async () => {
      if (!id || !type) return;
      
      setIsLoading(true);
      setMediaDetails(null);
      setEpisodes([]);
      setIframeUrl('');
      setHlsSource(null);
      
      try {
        const mediaId = parseInt(id, 10);
        const isTV = type === 'tv';
        
        if (!isTV) {
          // Movie handling
          const movieDetails = await getMovieDetails(mediaId);
          if (movieDetails && isMounted) {
            setTitle(movieDetails.title || 'Untitled Movie');
            setMediaDetails(movieDetails);
          }
        } else if (isTV && season && episode) {
          // TV show handling
          const tvDetails = await getTVDetails(mediaId);
          if (tvDetails && isMounted) {
            const seasonData = await getSeasonDetails(mediaId, parseInt(season, 10));
            if (isMounted) {
              setEpisodes(seasonData);
              const currentEpisodeNumber = parseInt(episode, 10);
              const episodeIndex = seasonData.findIndex(ep => ep.episode_number === currentEpisodeNumber);
              setCurrentEpisodeIndex(episodeIndex !== -1 ? episodeIndex : 0);
              
              const episodeTitle = seasonData.find(ep => ep.episode_number === currentEpisodeNumber)?.name || '';
              setTitle(`${tvDetails.name || 'Untitled Show'} - Season ${season} Episode ${episode}${episodeTitle ? ': ' + episodeTitle : ''}`);
              setMediaDetails(tvDetails);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching media details:', error);
        if (isMounted) {
          toast({
            title: "Error loading content",
            description: "There was a problem loading the media. Please try again.",
            variant: "destructive"
          });
          navigate('/');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasInitialized(true);
        }
      }
    };
    
    fetchMediaDetails();
    
    return () => {
      isMounted = false;
    };
  }, [id, type, season, episode, navigate, toast]);

  // Secondary effect: Update iframe URL after data is fetched
  useEffect(() => {
    if (!id || !hasInitialized || !mediaDetails) return;
    
    // Skip if we're using the custom source (HLS)
    if (isCustomSource) return;
    
    const mediaId = parseInt(id, 10);
    if (mediaType === 'movie') {
      updateIframeUrl(mediaId);
    } else if (mediaType === 'tv' && season && episode) {
      updateIframeUrl(mediaId, parseInt(season, 10), parseInt(episode, 10));
    }
  }, [id, mediaType, season, episode, hasInitialized, mediaDetails, updateIframeUrl, isCustomSource]);
  
  const handleSourceChange = async (sourceKey: string) => {
    setSelectedSource(sourceKey);
    
    // Reset player load state and watch history recorded flag when source changes
    setIsPlayerLoaded(false);
    watchHistoryRecorded.current = false;
    
    // Save the preference if user is logged in
    if (user) {
      await updatePreferences({
        preferred_source: sourceKey
      });
    }
    
    toast({
      title: "Source Changed",
      description: `Switched to ${videoSources.find(s => s.key === sourceKey)?.name || 'new source'}`,
    });
  };
  
  const goToDetails = () => {
    if (id) {
      navigate(`/${mediaType}/${id}`);
    }
  };
  
  const goToNextEpisode = () => {
    if (mediaType !== 'tv' || !id || !season || episodes.length === 0 || currentEpisodeIndex >= episodes.length - 1) {
      return;
    }
    
    const nextEpisode = episodes[currentEpisodeIndex + 1];
    navigate(`/watch/tv/${id}/${season}/${nextEpisode.episode_number}`);
    
    toast({
      title: "Navigation",
      description: `Playing next episode: ${nextEpisode.name}`
    });
  };
  
  const goToPreviousEpisode = () => {
    if (mediaType !== 'tv' || !id || !season || episodes.length === 0 || currentEpisodeIndex <= 0) {
      return;
    }
    
    const prevEpisode = episodes[currentEpisodeIndex - 1];
    navigate(`/watch/tv/${id}/${season}/${prevEpisode.episode_number}`);
    
    toast({
      title: "Navigation",
      description: `Playing previous episode: ${prevEpisode.name}`
    });
  };

  const toggleFavorite = () => {
    if (!mediaDetails || !id) return;
    
    const mediaId = parseInt(id, 10);
    
    if (isFavorite) {
      removeFromFavorites(mediaId, mediaType);
      setIsFavorite(false);
      toast({
        title: "Removed from favorites",
        description: `${title} has been removed from your favorites.`
      });
    } else {
      addToFavorites({
        media_id: mediaId,
        media_type: mediaType,
        title: (mediaDetails as MovieDetails).title || (mediaDetails as TVDetails).name || '',
        poster_path: mediaDetails.poster_path,
        backdrop_path: mediaDetails.backdrop_path,
        overview: mediaDetails.overview,
        rating: mediaDetails.vote_average
      });
      setIsFavorite(true);
      toast({
        title: "Added to favorites",
        description: `${title} has been added to your favorites.`
      });
    }
  };

  const toggleWatchlist = () => {
    if (!mediaDetails || !id) return;
    
    const mediaId = parseInt(id, 10);
    
    if (isInMyWatchlist) {
      removeFromWatchlist(mediaId, mediaType);
      setIsInMyWatchlist(false);
      toast({
        title: "Removed from watchlist",
        description: `${title} has been removed from your watchlist.`
      });
    } else {
      addToWatchlist({
        media_id: mediaId,
        media_type: mediaType,
        title: (mediaDetails as MovieDetails).title || (mediaDetails as TVDetails).name || '',
        poster_path: mediaDetails.poster_path,
        backdrop_path: mediaDetails.backdrop_path,
        overview: mediaDetails.overview,
        rating: mediaDetails.vote_average
      });
      setIsInMyWatchlist(true);
      toast({
        title: "Added to watchlist",
        description: `${title} has been added to your watchlist.`
      });
    }
  };
  
  // Handle player load event
  const handlePlayerLoaded = () => {
    setIsPlayerLoaded(true);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-16 px-4 md:px-6">
        {/* Back button and title */}
        <div className="max-w-6xl mx-auto mb-4 flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <h1 className="text-xl font-medium text-white truncate flex-1">{title}</h1>
          
          <div className="flex gap-2">
            {user && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleFavorite}
                  className={`border-white/20 ${isFavorite ? 'bg-accent text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-white' : ''}`} />
                  {!isMobile && <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleWatchlist}
                  className={`border-white/20 ${isInMyWatchlist ? 'bg-accent text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}
                >
                  <Bookmark className={`h-4 w-4 ${isInMyWatchlist ? 'fill-white' : ''}`} />
                  {!isMobile && <span>{isInMyWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>}
                </Button>
              </>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={goToDetails} 
              className="border-white/20 bg-black/50 text-white hover:bg-black/70"
            >
              {mediaType === 'movie' ? (
                <Film className="h-4 w-4 mr-2" />
              ) : (
                <Tv className="h-4 w-4 mr-2" />
              )}
              {!isMobile && 'View Details'}
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="w-full aspect-video flex items-center justify-center bg-black/50 rounded-lg">
            <div className="animate-pulse-slow text-white">Loading player...</div>
          </div>
        ) : (
          <>
            {/* Player */}
            <div className="max-w-6xl mx-auto rounded-lg overflow-hidden shadow-xl bg-black">
              <div className="relative w-full aspect-video">
                {isCustomSource ? (
                  // HLS Player for custom source
                  hlsSource ? (
                    <HLSPlayer 
                      src={hlsSource} 
                      title={title}
                      onLoaded={handlePlayerLoaded}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                      <p>Unable to load video stream. Please try another source.</p>
                    </div>
                  )
                ) : (
                  // Iframe player for other sources
                  <iframe
                    src={iframeUrl}
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    title={title}
                    loading="lazy"
                    onLoad={() => setIsPlayerLoaded(true)}
                  ></iframe>
                )}
              </div>
            </div>
            
            {/* Episode navigation - Show only for TV */}
            {mediaType === 'tv' && episodes.length > 1 && (
              <div className="max-w-6xl mx-auto mt-4 flex justify-center gap-4">
                <Button
                  variant="outline"
                  size={isMobile ? "icon" : "default"}
                  onClick={goToPreviousEpisode}
                  disabled={currentEpisodeIndex <= 0}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  <SkipBack className="h-4 w-4" />
                  {!isMobile && <span>Previous Episode</span>}
                </Button>
                
                <Button
                  variant="outline"
                  size={isMobile ? "icon" : "default"}
                  onClick={goToNextEpisode}
                  disabled={currentEpisodeIndex >= episodes.length - 1}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  {!isMobile && <span>Next Episode</span>}
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Video source selector */}
            <div className="max-w-6xl mx-auto mt-6 mb-8">
              <div className="glass p-4 rounded-lg">
                <h3 className="text-white font-medium mb-3">Video Sources</h3>
                <p className="text-white/70 text-sm mb-4">
                  If the current source isn't working, try another one below.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-64">
                    <Select value={selectedSource} onValueChange={handleSourceChange}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select a video source" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-white/10">
                        {videoSources.map(source => (
                          <SelectItem key={source.key} value={source.key} className="text-white focus:text-white focus:bg-white/10">
                            <div className="flex items-center gap-2">
                              {selectedSource === source.key && <Check className="h-4 w-4" />}
                              {source.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {videoSources.map(source => (
                      <Button
                        key={source.key}
                        variant={selectedSource === source.key ? 'default' : 'outline'}
                        size="sm"
                        className={selectedSource === source.key 
                          ? 'bg-accent hover:bg-accent/80' 
                          : 'border-white/20 bg-black/50 text-white hover:bg-black/70'
                        }
                        onClick={() => handleSourceChange(source.key)}
                      >
                        {source.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Player;
