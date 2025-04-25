import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMovieDetails, getTVDetails, videoSources, getSeasonDetails } from '@/utils/api';
import { getMovieStream, getTVStream } from '@/utils/custom-api';
import { MovieDetails, TVDetails, VideoSource, Episode } from '@/utils/types';
import Navbar from '@/components/Navbar';
import PlyrPlayer from '@/components/PlyrPlayer';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Film, Tv, Check, SkipBack, SkipForward, Heart, Bookmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWatchHistory } from '@/hooks/watch-history';
import { useAuth } from '@/hooks';
import { useUserPreferences } from '@/hooks/user-preferences';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
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

  useEffect(() => {
    if (user && id && mediaType) {
      const mediaId = parseInt(id, 10);
      setIsFavorite(isInFavorites(mediaId, mediaType));
      setIsInMyWatchlist(isInWatchlist(mediaId, mediaType));
    }
  }, [user, id, mediaType, isInFavorites, isInWatchlist]);

  useEffect(() => {
    if (userPreferences?.preferred_source) {
      setSelectedSource(userPreferences.preferred_source);
    }
  }, [userPreferences?.preferred_source]);

  useEffect(() => {
    if (type === 'movie' || type === 'tv') {
      setMediaType(type);
    }
  }, [type]);

  useEffect(() => {
    setIsCustomSource(selectedSource === 'custom-api');
    if (selectedSource !== 'custom-api') {
      setStreamUrl(null);
    }
  }, [selectedSource]);

  useEffect(() => {
    const fetchStream = async () => {
      if (!isCustomSource || !id) return;
      try {
        setIsLoading(true);
        const mediaId = parseInt(id, 10);
        let streamObj = null;
        if (mediaType === 'movie') {
          streamObj = await getMovieStream(mediaId);
        } else if (mediaType === 'tv' && season && episode) {
          streamObj = await getTVStream(mediaId, parseInt(season, 10), parseInt(episode, 10));
        }
        const getProxiedUrl = (url: string, headers?: Record<string, string> | null) => {
          let proxyUrl = `https://plain-sound-6910.chintanr21.workers.dev/?url=${encodeURIComponent(url)}`;
          if (headers && Object.keys(headers).length > 0) {
            proxyUrl += `&headers=${encodeURIComponent(JSON.stringify(headers))}`;
          }
          return proxyUrl;
        };
        const url = streamObj?.url ? getProxiedUrl(streamObj.url, streamObj.headers) : null;
        if (url) {
          setStreamUrl(url);
          setIsPlayerLoaded(true);
        } else {
          setIsPlayerLoaded(false);
          toast({
            title: "Stream Not Available",
            description: "Could not find a valid stream. Please try another source.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching stream:', error);
        setIsPlayerLoaded(false);
        toast({
          title: "Error",
          description: "Failed to load video stream. Please try another source.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStream();
  }, [isCustomSource, id, mediaType, season, episode, toast]);

  const updateIframeUrl = useCallback((mediaId: number, seasonNum?: number, episodeNum?: number) => {
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

  useEffect(() => {
    if (!isPlayerLoaded || !user || !mediaDetails || !id || watchHistoryRecorded.current) return;

    if (!watchHistoryRecorded.current) {
      const mediaId = parseInt(id, 10);
      const duration = mediaType === 'movie' 
        ? (mediaDetails as MovieDetails).runtime * 60
        : ((mediaDetails as TVDetails).episode_run_time?.[0] || 30) * 60;
      
      watchHistoryRecorded.current = true;
      
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

  useEffect(() => {
    let isMounted = true;
    
    setIsPlayerLoaded(false);
    watchHistoryRecorded.current = false;
    
    const fetchMediaDetails = async () => {
      if (!id || !type) return;
      
      setIsLoading(true);
      setMediaDetails(null);
      setEpisodes([]);
      setIframeUrl('');
      setStreamUrl(null);
      
      try {
        const mediaId = parseInt(id, 10);
        const isTV = type === 'tv';
        
        if (!isTV) {
          const movieDetails = await getMovieDetails(mediaId);
          if (movieDetails && isMounted) {
            setTitle(movieDetails.title || 'Untitled Movie');
            setMediaDetails(movieDetails);
          }
        } else if (isTV && season && episode) {
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

  useEffect(() => {
    if (!id || !hasInitialized || !mediaDetails) return;
    
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
    setIsPlayerLoaded(false);
    setStreamUrl(null);
    watchHistoryRecorded.current = false;
    
    if (iframeUrl) {
      setIframeUrl('');
    }
    
    if (user) {
      await updatePreferences({
        preferred_source: sourceKey
      });
    }
    
    const sourceName = videoSources.find(s => s.key === sourceKey)?.name || 'new source';
    toast({
      title: "Source Changed",
      description: `Switched to ${sourceName}`,
      duration: 3000,
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

  const handlePlayerLoaded = () => {
    setIsPlayerLoaded(true);
  };

  const handlePlayerError = (error: string) => {
    setIsPlayerLoaded(false);
    toast({
      title: "Playback Error",
      description: error,
      variant: "destructive"
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background relative"
    >
      <div className="fixed inset-0 bg-gradient-to-b from-background/95 to-background pointer-events-none" />
      
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        exit={{ y: -100 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent"
      >
        <Navbar />
      </motion.nav>

      <div className="relative z-10 container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 py-4 mt-16"
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex-1" />

          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full transition-all duration-300",
                isFavorite ? "text-red-500 hover:text-red-600" : "text-white/80 hover:text-white"
              )}
              onClick={toggleFavorite}
            >
              <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "rounded-full transition-all duration-300",
                isInMyWatchlist ? "text-accent hover:text-accent/90" : "text-white/80 hover:text-white"
              )}
              onClick={toggleWatchlist}
            >
              <Bookmark className={cn("h-5 w-5", isInMyWatchlist && "fill-current")} />
            </Button>
          </motion.div>
        </motion.div>

        <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
          {isLoading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            {isCustomSource && streamUrl ? (
              <PlyrPlayer
                src={streamUrl}
                title={title}
                poster={mediaDetails?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${mediaDetails.backdrop_path}` : undefined}
                onLoaded={handlePlayerLoaded}
                onError={handlePlayerError}
              />
            ) : (
              <iframe
                src={iframeUrl}
                className="w-full h-full"
                allowFullScreen
                onLoad={handlePlayerLoaded}
              />
            )}
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-6"
        >
          {mediaType === 'tv' && episodes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">Episode Navigation</h3>
                  <p className="text-sm text-white/60">
                    Season {season} • Episode {episode} of {episodes.length}
                  </p>
                </div>
              </div>

              <div className="glass p-4 rounded-lg border border-white/10 backdrop-blur-sm">
                <div className="flex flex-col space-y-3">
                  {/* Current Episode Info */}
                  <div className="space-y-1">
                    <h4 className="text-white font-medium">
                      {episodes[currentEpisodeIndex]?.name || 'Episode ' + episode}
                    </h4>
                    {episodes[currentEpisodeIndex]?.overview && (
                      <p className="text-sm text-white/70 line-clamp-2">
                        {episodes[currentEpisodeIndex]?.overview}
                      </p>
                    )}
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                        onClick={goToPreviousEpisode}
                        disabled={currentEpisodeIndex === 0}
                      >
                        <SkipBack className="h-4 w-4 mr-2" />
                        Previous
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                        onClick={goToNextEpisode}
                        disabled={currentEpisodeIndex === episodes.length - 1}
                      >
                        Next
                        <SkipForward className="h-4 w-4 ml-2" />
                      </Button>
                    </div>

                    {episodes[currentEpisodeIndex]?.air_date && (
                      <span className="text-sm text-white/40">
                        Aired: {new Date(episodes[currentEpisodeIndex].air_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">Video Sources</h3>
                <p className="text-sm text-white/60">Select your preferred streaming source</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300"
                onClick={goToDetails}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>

            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {videoSources.map((source, index) => (
                <motion.button
                  key={source.key}
                  onClick={() => handleSourceChange(source.key)}
                  className={cn(
                    "relative group p-4 rounded-lg border transition-all duration-300",
                    "bg-gradient-to-br backdrop-blur-sm",
                    selectedSource === source.key
                      ? "from-accent/20 to-accent/10 border-accent"
                      : "from-white/5 to-transparent border-white/10 hover:border-white/20"
                  )}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="space-y-2 text-left">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        selectedSource === source.key ? "text-accent" : "text-white group-hover:text-white/90"
                      )}>
                        {source.name}
                      </span>
                      {selectedSource === source.key && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="h-2 w-2 rounded-full bg-accent"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {selectedSource === source.key ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-accent flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Active
                        </motion.div>
                      ) : (
                        <span className="text-xs text-white/40">Click to switch</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Highlight effect */}
                  <div className={cn(
                    "absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300",
                    "bg-gradient-to-br from-white/5 to-transparent",
                    "group-hover:opacity-100"
                  )} />
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Player;
