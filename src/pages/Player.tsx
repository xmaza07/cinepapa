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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-16 px-4 md:px-6">
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
            <div className="max-w-6xl mx-auto rounded-lg overflow-hidden shadow-xl bg-black">
              <div className="relative w-full aspect-video">
                {isCustomSource ? (
                  streamUrl ? (
                    <PlyrPlayer 
                      src={streamUrl} 
                      title={title}
                      poster={mediaDetails?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${mediaDetails.backdrop_path}` : undefined}
                      onLoaded={handlePlayerLoaded}
                      onError={handlePlayerError}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
                      <p>Unable to load video stream. Please try another source.</p>
                    </div>
                  )
                ) : (
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
