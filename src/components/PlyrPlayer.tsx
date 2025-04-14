
import React, { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { useToast } from '@/hooks/use-toast';
import { validateStreamUrl } from '@/utils/custom-api';

interface PlyrPlayerProps {
  src: string;
  title?: string;
  onLoaded?: () => void;
  onError?: (error: string) => void;
  poster?: string;
}

const PlyrPlayer: React.FC<PlyrPlayerProps> = ({ 
  src, 
  title, 
  onLoaded, 
  onError,
  poster
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Initialize Plyr
  useEffect(() => {
    let mounted = true;
    
    const initPlayer = async () => {
      if (!videoRef.current) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Validate stream URL before initializing player
        const isValid = await validateStreamUrl(src);
        if (!isValid) {
          throw new Error('Invalid or inaccessible video stream');
        }
        
        // Destroy existing player if it exists
        if (playerRef.current) {
          playerRef.current.destroy();
        }
        
        // Initialize Plyr with options
        const plyr = new Plyr(videoRef.current, {
          controls: [
            'play-large', 'play', 'progress', 'current-time', 'mute', 
            'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
          ],
          seekTime: 10,
          keyboard: { focused: true, global: true },
          tooltips: { controls: true, seek: true },
          captions: { active: true, language: 'auto', update: true },
          quality: { default: 720, options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240] }
        });
        
        playerRef.current = plyr;
        
        // Set up event listeners
        plyr.on('ready', () => {
          if (!mounted) return;
          setIsLoading(false);
          if (onLoaded) onLoaded();
        });
        
        // Fix: Access error event data correctly
        plyr.on('error', (event) => {
          if (!mounted) return;
          
          // Get error message from event details or use a default message
          // The Plyr type doesn't directly expose the error property, but it may exist in the detail object
          const errorDetail = event.detail;
          const errorMessage = typeof errorDetail === 'string' 
            ? errorDetail 
            : (errorDetail && typeof errorDetail === 'object' && 'message' in errorDetail)
              ? String(errorDetail.message)
              : 'Video playback error';
          
          setError(errorMessage);
          if (onError) onError(errorMessage);
          toast({
            title: 'Playback Error',
            description: errorMessage,
            variant: 'destructive'
          });
        });
        
        plyr.on('playing', () => {
          if (!mounted) return;
          setError(null);
        });
        
      } catch (err) {
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize video player';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        toast({
          title: 'Player Error',
          description: errorMessage,
          variant: 'destructive'
        });
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    initPlayer();
    
    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [src, onLoaded, onError, toast]);
  
  return (
    <div className="plyr-container relative w-full h-full bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-white">Loading video player...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center p-4 max-w-md">
            <p className="text-white text-lg font-medium mb-2">Failed to load video</p>
            <p className="text-white/70 text-sm mb-4">{error}</p>
            <button 
              className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-md transition-colors"
              onClick={() => {
                setError(null);
                setIsLoading(true);
                // Reinitialize player (this will trigger the useEffect again)
                if (playerRef.current) {
                  playerRef.current.destroy();
                  playerRef.current = null;
                }
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="plyr-video w-full h-full"
        playsInline
        crossOrigin="anonymous"
        poster={poster}
      >
        <source src={src} type="application/x-mpegURL" />
        <p className="text-white">
          Your browser doesn't support HTML5 video. Please download
          <a href={src}>the video</a> instead.
        </p>
      </video>
    </div>
  );
};

export default PlyrPlayer;
