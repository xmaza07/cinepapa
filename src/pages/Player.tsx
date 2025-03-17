
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, getTVDetails, videoSources } from '@/utils/api';
import { MovieDetails, TVDetails, VideoSource } from '@/utils/types';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const Player = () => {
  const { mediaType, id, season, episode } = useParams<{
    mediaType: string;
    id: string;
    season?: string;
    episode?: string;
  }>();
  const [title, setTitle] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>(videoSources[0].key);
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const mediaId = parseInt(id, 10);
        
        if (mediaType === 'movie') {
          const movieDetails = await getMovieDetails(mediaId);
          if (movieDetails) {
            setTitle(movieDetails.title || 'Untitled Movie');
            updateIframeUrl(mediaId);
          }
        } else if (mediaType === 'tv' && season && episode) {
          const tvDetails = await getTVDetails(mediaId);
          if (tvDetails) {
            setTitle(`${tvDetails.name || 'Untitled Show'} - Season ${season} Episode ${episode}`);
            updateIframeUrl(mediaId, parseInt(season, 10), parseInt(episode, 10));
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching media details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMediaDetails();
  }, [mediaType, id, season, episode, navigate]);
  
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
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-16 px-4 md:px-6">
        {/* Back button and title */}
        <div className="max-w-6xl mx-auto mb-4 flex items-center">
          <button 
            onClick={() => navigate(-1)}
            className="mr-3 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-medium text-white truncate">{title}</h1>
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
            
            {/* Video source selector */}
            <div className="max-w-6xl mx-auto mt-6 mb-8">
              <div className="glass p-4 rounded-lg">
                <h3 className="text-white font-medium mb-3">Video Sources</h3>
                <p className="text-white/70 text-sm mb-4">
                  If the current source isn't working, try another one below.
                </p>
                <div className="flex flex-wrap gap-2">
                  {videoSources.map(source => (
                    <Button
                      key={source.key}
                      variant={selectedSource === source.key ? 'default' : 'outline'}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Player;
