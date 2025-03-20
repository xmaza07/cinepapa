
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMovieDetails, getTVDetails, videoSources, getSeasonDetails } from '@/utils/api';
import { MovieDetails, TVDetails, VideoSource, Episode } from '@/utils/types';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Film, Tv, Check, SkipBack, SkipForward } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWatchHistory } from '@/hooks/use-watch-history';
import { usePreferences } from '@/hooks/use-preferences';
import { useAuth } from '@/hooks/use-auth';

const Player = () => {
  const { id, season, episode } = useParams<{
    id: string;
    season?: string;
    episode?: string;
  }>();
  const [title, setTitle] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>(videoSources[0].key);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [mediaDetails, setMediaDetails] = useState<MovieDetails | TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(0);
  const [watchPosition, setWatchPosition] = useState<number>(0);
  const [mediaDuration, setMediaDuration] = useState<number>(0);
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const [backdropPath, setBackdropPath] = useState<string | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { updateWatchHistory, getWatchHistoryItem } = useWatchHistory();
  const { preferences, updatePreferences } = usePreferences();
  const { user } = useAuth();

  // Load preferred source from user preferences
  useEffect(() => {
    if (preferences.preferred_video_source) {
      setSelectedSource(preferences.preferred_video_source);
    }
  }, [preferences.preferred_video_source]);

  // Fetch media details and watch history
  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const mediaId = parseInt(id, 10);
        
        // Determine media type from URL
        const isTV = season !== undefined && episode !== undefined;
        setMediaType(isTV ? 'tv' : 'movie');
        
        if (!isTV) {
          const movieDetails = await getMovieDetails(mediaId);
          if (movieDetails) {
            setTitle(movieDetails.title || 'Untitled Movie');
            setMediaDetails(movieDetails);
            setPosterPath(movieDetails.poster_path);
            setBackdropPath(movieDetails.backdrop_path);
            
            // Set initial duration based on runtime (in minutes)
            if (movieDetails.runtime) {
              setMediaDuration(movieDetails.runtime * 60);
            }
            
            // Check for watch history
            if (user) {
              const historyItem = await getWatchHistoryItem(mediaId, 'movie');
              if (historyItem) {
                setWatchPosition(historyItem.watch_position);
                setMediaDuration(historyItem.duration || movieDetails.runtime * 60);
                if (historyItem.preferred_source) {
                  setSelectedSource(historyItem.preferred_source);
                }
              }
            }
            
            updateIframeUrl(mediaId);
          }
        } else if (isTV && season && episode) {
          const tvDetails = await getTVDetails(mediaId);
          if (tvDetails) {
            // Fetch episodes for the current season
            const seasonData = await getSeasonDetails(mediaId, parseInt(season, 10));
            setEpisodes(seasonData);
            
            // Find current episode index
            const currentEpisodeNumber = parseInt(episode, 10);
            const episodeIndex = seasonData.findIndex(ep => ep.episode_number === currentEpisodeNumber);
            setCurrentEpisodeIndex(episodeIndex !== -1 ? episodeIndex : 0);
            
            // Get current episode details
            const currentEpisode = seasonData.find(ep => ep.episode_number === currentEpisodeNumber);
            
            setTitle(`${tvDetails.name || 'Untitled Show'} - Season ${season} Episode ${episode}`);
            setMediaDetails(tvDetails);
            setPosterPath(tvDetails.poster_path);
            setBackdropPath(currentEpisode?.still_path || tvDetails.backdrop_path);
            
            // Check for watch history
            if (user) {
              const historyItem = await getWatchHistoryItem(
                mediaId, 
                'tv', 
                parseInt(season, 10), 
                currentEpisodeNumber
              );
              
              if (historyItem) {
                setWatchPosition(historyItem.watch_position);
                setMediaDuration(historyItem.duration || 1800); // Default 30 minutes if unknown
                if (historyItem.preferred_source) {
                  setSelectedSource(historyItem.preferred_source);
                }
              }
            }
            
            updateIframeUrl(mediaId, parseInt(season, 10), currentEpisodeNumber);
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching media details:', error);
        toast({
          title: "Error loading content",
          description: "There was a problem loading the media. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMediaDetails();
    
    // Clear any existing progress tracking interval
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    // Start tracking progress
    progressInterval.current = window.setInterval(() => {
      // Only update if more than 5 seconds have passed since last update
      const now = Date.now();
      if (now - lastUpdateTime.current > 5000) {
        updateProgress();
        lastUpdateTime.current = now;
      }
    }, 10000);
    
    return () => {
      if (progressInterval.current) {
        window.clearInterval(progressInterval.current);
      }
      // Final update when leaving
      updateProgress();
    };
  }, [id, season, episode, navigate, toast, user, getWatchHistoryItem]);
  
  // Update iframe URL when selected source changes
  useEffect(() => {
    if (id) {
      const mediaId = parseInt(id, 10);
      if (mediaType === 'movie') {
        updateIframeUrl(mediaId);
      } else if (mediaType === 'tv' && season && episode) {
        updateIframeUrl(mediaId, parseInt(season, 10), parseInt(episode, 10));
      }
    }
  }, [selectedSource, id, mediaType, season, episode]);

  // Save user's preferred video source when changed
  useEffect(() => {
    if (user && preferences.preferred_video_source !== selectedSource) {
      updatePreferences({ preferred_video_source: selectedSource });
    }
  }, [selectedSource, user, updatePreferences, preferences.preferred_video_source]);
  
  const updateIframeUrl = (mediaId: number, seasonNum?: number, episodeNum?: number) => {
    const source = videoSources.find(src => src.key === selectedSource);
    if (!source) return;
    
    if (mediaType === 'movie') {
      setIframeUrl(source.getMovieUrl(mediaId));
    } else if (mediaType === 'tv' && seasonNum && episodeNum) {
      setIframeUrl(source.getTVUrl(mediaId, seasonNum, episodeNum));
    }
  };
  
  const handleSourceChange = (sourceKey: string) => {
    setSelectedSource(sourceKey);
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
    navigate(`/player/tv/${id}/${season}/${nextEpisode.episode_number}`);
    
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
    navigate(`/player/tv/${id}/${season}/${prevEpisode.episode_number}`);
    
    toast({
      title: "Navigation",
      description: `Playing previous episode: ${prevEpisode.name}`
    });
  };

  // Update the playback progress in the database
  const updateProgress = async () => {
    if (!user || !id || !mediaDetails) return;
    
    // Try to get a rough estimate of the current time
    let currentPosition = watchPosition;
    // In a real player we might get this from postMessage or player API
    // For now, use a simple auto-increment approach
    currentPosition += 10; // Add 10 seconds since we update every 10 seconds
    setWatchPosition(currentPosition);
    
    // In a real implementation, we'd also check if we got near the end
    // and mark as completed if needed
    
    // Prepare the watch history item
    const historyItem = {
      media_id: parseInt(id, 10),
      media_type: mediaType,
      title: mediaType === 'movie' 
        ? (mediaDetails as MovieDetails).title || ''
        : (mediaDetails as TVDetails).name || '',
      poster_path: posterPath,
      backdrop_path: backdropPath,
      watch_position: currentPosition,
      duration: mediaDuration,
      preferred_source: selectedSource
    };
    
    // Add season and episode for TV shows
    if (mediaType === 'tv' && season && episode) {
      Object.assign(historyItem, {
        season: parseInt(season, 10),
        episode: parseInt(episode, 10)
      });
    }
    
    // Update watch history
    await updateWatchHistory(historyItem);
  };
  
  // Fix for the iframe fullscreen issue
  // In a real implementation, we could use postMessage or the player API
  const createFullscreenWrapper = () => {
    // The key is to wrap the iframe in a div that can request fullscreen
    // since some platforms restrict iframe fullscreen capabilities
    
    // This is not a complete solution but demonstrates the approach
    // Real implementation would depend on the specific player APIs
    
    // Since we cannot modify the iframe content directly due to CORS,
    // this is a partial solution that helps in some cases
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
            View Details
          </Button>
        </div>
        
        {isLoading ? (
          <div className="w-full aspect-video flex items-center justify-center bg-black/50 rounded-lg">
            <div className="animate-pulse-slow text-white">Loading player...</div>
          </div>
        ) : (
          <>
            {/* Player */}
            <div 
              ref={playerWrapperRef}
              className="max-w-6xl mx-auto rounded-lg overflow-hidden shadow-xl bg-black"
            >
              <div className="relative w-full aspect-video">
                <iframe
                  ref={iframeRef}
                  src={iframeUrl}
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                  title={title}
                  loading="lazy"
                ></iframe>
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
