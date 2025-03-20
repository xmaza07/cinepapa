
import { useState, useEffect } from 'react';
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
import { ArrowLeft, ExternalLink, Film, Tv, Check, SkipBack, SkipForward, Heart, Bookmark } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useWatchHistory } from '@/hooks/use-watch-history';
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
            updateIframeUrl(mediaId);

            // Check if the movie is in favorites or watchlist
            setIsFavorite(isInFavorites(mediaId, 'movie'));
            setIsInMyWatchlist(isInWatchlist(mediaId, 'movie'));
            
            // Automatically add to watch history
            if (user) {
              const duration = movieDetails.runtime * 60; // convert minutes to seconds
              addToWatchHistory(
                {
                  id: mediaId,
                  title: movieDetails.title || 'Untitled Movie',
                  poster_path: movieDetails.poster_path,
                  backdrop_path: movieDetails.backdrop_path,
                  overview: movieDetails.overview,
                  vote_average: movieDetails.vote_average,
                  media_type: 'movie',
                  genre_ids: movieDetails.genres.map(g => g.id)
                },
                0, // Initial position
                duration, 
                undefined, 
                undefined,
                selectedSource
              );
            }
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
            
            const episodeTitle = seasonData.find(ep => ep.episode_number === currentEpisodeNumber)?.name || '';
            setTitle(`${tvDetails.name || 'Untitled Show'} - Season ${season} Episode ${episode}${episodeTitle ? ': ' + episodeTitle : ''}`);
            setMediaDetails(tvDetails);
            updateIframeUrl(mediaId, parseInt(season, 10), parseInt(episode, 10));

            // Check if the TV show is in favorites or watchlist
            setIsFavorite(isInFavorites(mediaId, 'tv'));
            setIsInMyWatchlist(isInWatchlist(mediaId, 'tv'));
            
            // Automatically add to watch history
            if (user) {
              const duration = tvDetails.episode_run_time[0] ? tvDetails.episode_run_time[0] * 60 : 1800; // Default to 30 minutes if not provided
              addToWatchHistory(
                {
                  id: mediaId,
                  name: tvDetails.name || 'Untitled Show',
                  poster_path: tvDetails.poster_path,
                  backdrop_path: tvDetails.backdrop_path,
                  overview: tvDetails.overview,
                  vote_average: tvDetails.vote_average,
                  media_type: 'tv',
                  genre_ids: tvDetails.genres.map(g => g.id)
                },
                0, // Initial position
                duration,
                parseInt(season, 10),
                parseInt(episode, 10),
                selectedSource
              );
            }
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
  }, [id, season, episode, navigate, toast, user, addToWatchHistory, isInFavorites, isInWatchlist, selectedSource]);
  
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
                <iframe
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
