
import React, { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { useToast } from '@/hooks/use-toast';
import { validateStreamUrl } from '@/utils/custom-api';
import Hls from 'hls.js';

interface PlyrPlayerProps {
  src: string;
  title?: string;
  onLoaded?: () => void;
  onError?: (error: string) => void;
  poster?: string;
  headers?: Record<string, string>;
  subtitles?: Array<{
    lang: string;
    label: string;
    file: string;
  }>;
}

const PlyrPlayer: React.FC<PlyrPlayerProps> = ({ 
  src, 
  title, 
  onLoaded, 
  onError,
  poster,
  headers,
  subtitles
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Initialize Plyr with HLS support
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
        
        // Destroy existing player and HLS instance if they exist
        if (playerRef.current) {
          playerRef.current.destroy();
        }
        
        if (hlsRef.current) {
          hlsRef.current.destroy();
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
        
        // Handle HLS streams
        const videoSrc = src;
        if (Hls.isSupported() && videoSrc.includes('.m3u8')) {
          const hls = new Hls({
            xhrSetup: function(xhr) {
              // Apply custom headers if provided
              if (headers) {
                Object.entries(headers).forEach(([key, value]) => {
                  xhr.setRequestHeader(key, value);
                });
              }
            }
          });
          
          hls.loadSource(videoSrc);
          hls.attachMedia(videoRef.current);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!mounted) return;
            
            // The manifest has been parsed, now the stream is ready
            // Attempt to play the video after the player is ready
            // We can't use plyr.media directly as it doesn't exist in the type
            videoRef.current?.play().catch(() => {
              // Autoplay was prevented, we'll let the user initiate playback
              console.log('Autoplay prevented, waiting for user interaction');
            });
          });
          
          hls.on(Hls.Events.ERROR, function(event, data) {
            if (!mounted) return;
            
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  // Try to recover network error
                  console.log('Fatal network error encountered, trying to recover');
                  hls.startLoad();
                  break;
                  
                case Hls.ErrorTypes.MEDIA_ERROR:
                  // Try to recover media error
                  console.log('Fatal media error encountered, trying to recover');
                  hls.recoverMediaError();
                  break;
                  
                default:
                  // Cannot recover
                  hls.destroy();
                  const errorMsg = `HLS streaming error: ${data.details}`;
                  setError(errorMsg);
                  if (onError) onError(errorMsg);
                  toast({
                    title: 'Streaming Error',
                    description: errorMsg,
                    variant: 'destructive'
                  });
                  break;
              }
            }
          });
          
          hlsRef.current = hls;
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // For browsers that support HLS natively (Safari)
          videoRef.current.src = videoSrc;
        }
        
        // Add subtitles if provided
        if (subtitles && subtitles.length > 0 && plyr) {
          const tracks = subtitles.map((sub, index) => ({
            kind: 'subtitles',
            label: sub.label,
            srcLang: sub.lang,
            src: sub.file,
            default: index === 0 // Make first subtitle default
          }));
          
          if (videoRef.current) {
            // Remove existing tracks
            while (videoRef.current.firstChild) {
              videoRef.current.removeChild(videoRef.current.firstChild);
            }
            
            // Add new tracks
            tracks.forEach(track => {
              const trackElement = document.createElement('track');
              trackElement.kind = track.kind;
              trackElement.label = track.label;
              trackElement.srclang = track.srcLang;
              trackElement.src = track.src;
              if (track.default) trackElement.default = true;
              videoRef.current?.appendChild(trackElement);
            });
          }
        }
        
        // Set up event listeners
        plyr.on('ready', () => {
          if (!mounted) return;
          setIsLoading(false);
          if (onLoaded) onLoaded();
        });
        
        // Handle error events properly - Plyr errors can come in different formats
        plyr.on('error', (event) => {
          if (!mounted) return;
          
          let errorMessage = 'Video playback error';
          
          // Try to extract error message from various possible locations
          if (event) {
            const detail = event.detail;
            if (typeof detail === 'string') {
              errorMessage = detail;
            } else if (detail && typeof detail === 'object') {
              if ('message' in detail) {
                errorMessage = String(detail.message);
              } else if ('error' in detail) {
                errorMessage = String(detail.error);
              }
            }
          }
          
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
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [src, onLoaded, onError, toast, headers, subtitles]);
  
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
                if (hlsRef.current) {
                  hlsRef.current.destroy();
                  hlsRef.current = null;
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
