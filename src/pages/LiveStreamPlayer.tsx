
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

import PageTransition from '@/components/PageTransition';
import { useLiveStreams } from '@/hooks/use-live-streams';
import { LiveStream } from '@/pages/LiveStreams';
// Removed custom API proxy imports


const LiveStreamPlayer = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Try to get stream from location state first (for better UX)
  const [stream, setStream] = useState<LiveStream | null>(
    location.state?.stream || null
  );
  
  const { data, isLoading, isError } = useLiveStreams();
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  
  // Initialize proxy system when component mounts
  useEffect(() => {
    const init = async () => {

    };
    
    init();
  }, []);
  
  // If stream wasn't passed through navigation state, find it in the fetched data
  useEffect(() => {
    if (!stream && data?.matches && id) {
      const matchId = parseInt(id, 10);
      const foundStream = data.matches.find(match => match.match_id === matchId);
      
      if (foundStream) {
        setStream(foundStream);
      }
    }
  }, [data, id, stream]);

  // Handle sharing the stream
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: stream?.match_name || 'Live Stream',
          text: `Watch ${stream?.match_name} live!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied to clipboard',
        description: 'You can now share it with anyone!'
      });
    }
  };

  // Player event handlers
  const handlePlayerLoad = () => {
    setIsPlayerLoaded(true);
    setPlayerError(null);
  };

  const handlePlayerError = (error: string) => {
    setPlayerError(error);
    setIsPlayerLoaded(false);
    
    toast({
      variant: "destructive",
      title: "Playback error",
      description: "Failed to load the live stream. Please try again later."
    });
  };

  return (
    <PageTransition>
      <div className="container mx-auto py-6 px-4">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate('/live')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Live Streams
        </Button>
        
        {isLoading && !stream ? (
          <div className="w-full aspect-video bg-card/30 rounded-lg animate-pulse" />
        ) : isError || !stream ? (
          <div className="w-full aspect-video bg-card/30 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white">Stream not found</h2>
              <p className="text-gray-400 mt-2">The requested live stream could not be found</p>
              <Button 
                className="mt-4"
                onClick={() => navigate('/live')}
              >
                Browse available streams
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="w-full aspect-video mb-6 overflow-hidden rounded-lg shadow-xl">
              {stream && (
                <video
                  src={stream.stream_link}
                  poster={stream.banner}
                  title={stream.match_name}
                  controls
                  className="w-full h-full"
                  onLoadedData={handlePlayerLoad}
                  onError={() => handlePlayerError('Failed to load video')}
                />
              )}
            </div>
            
            <div className="bg-card/30 rounded-lg backdrop-blur-sm p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white">{stream.match_name}</h1>
                  <p className="text-gray-400">{stream.event_name}</p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={stream.stream_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open direct URL
                    </a>
                  </Button>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <img 
                      src={stream.team_1_flag} 
                      alt={stream.team_1} 
                      className="w-12 h-12 object-cover rounded-full border-2 border-white/20" 
                    />
                    <span className="text-sm text-white mt-2 text-center">{stream.team_1}</span>
                  </div>
                  
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-card/50">
                    <span className="font-semibold text-white">VS</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <img 
                      src={stream.team_2_flag} 
                      alt={stream.team_2} 
                      className="w-12 h-12 object-cover rounded-full border-2 border-white/20" 
                    />
                    <span className="text-sm text-white mt-2 text-center">{stream.team_2}</span>
                  </div>
                </div>
                
                <div>
                  <span className="px-3 py-1 text-xs rounded-full bg-accent/20 text-white border border-accent/30 uppercase">
                    {stream.event_catagory}
                  </span>
                </div>
              </div>
              
              {playerError && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-900/30 rounded-md">
                  <p className="text-red-200 text-sm">
                    There was an issue loading this stream. The source may be temporarily unavailable.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default LiveStreamPlayer;
