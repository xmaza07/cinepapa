
import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, Volume2, VolumeX } from 'lucide-react';

interface HLSPlayerProps {
  src: string;
  title: string;
  onLoaded?: () => void;
  className?: string;
}

const HLSPlayer = ({ src, title, onLoaded, className = '' }: HLSPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    let hls: Hls | null = null;
    
    // Reset states when src changes
    setIsLoading(true);
    setError(null);

    const initPlayer = async () => {
      if (!src) {
        setError('No video source provided');
        setIsLoading(false);
        return;
      }
      
      if (Hls.isSupported()) {
        try {
          hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60
          });
          
          hls.loadSource(src);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(err => {
              console.warn('Auto-play was prevented:', err);
            });
          });
          
          hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) {
              console.error('HLS error:', data);
              setError(`Video playback error: ${data.type}`);
              hls?.destroy();
            }
          });
          
        } catch (e) {
          console.error('Error initializing HLS:', e);
          setError('Failed to initialize video player');
        }
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(err => {
            console.warn('Auto-play was prevented:', err);
          });
        });
      } else {
        setError('HLS playback is not supported in this browser');
      }
    };

    initPlayer();
    
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleCanPlay = () => {
      setIsLoading(false);
      if (onLoaded) onLoaded();
    };
    
    const handleError = () => {
      setError('Error loading video');
      setIsLoading(false);
    };
    
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [onLoaded]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={`w-full h-full ${className}`}
        controls
        playsInline
        crossOrigin="anonymous"
        title={title}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-white text-center p-4">
            <p className="mb-2 text-red-400">Error: {error}</p>
            <p className="text-sm">Please try another video source</p>
          </div>
        </div>
      )}
      
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/70 transition-colors"
        style={{ zIndex: 10 }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
};

export default HLSPlayer;
