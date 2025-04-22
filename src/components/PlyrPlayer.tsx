
import React, { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import Hls from 'hls.js';

interface PlyrPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  onLoaded?: () => void;
  onError?: (error: string) => void;
}

const PlyrPlayer: React.FC<PlyrPlayerProps> = ({
  src,
  title,
  poster,
  onLoaded,
  onError
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    let hls: Hls | null = null;

    const initPlayer = () => {
      if (!videoRef.current) return;

      // Destroy existing player if it exists
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      // Initialize Plyr player
      const plyrOptions = {
        captions: { active: true, update: true },
        fullscreen: { enabled: true },
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'captions',
          'settings',
          'pip',
          'airplay',
          'fullscreen',
        ],
        seekTime: 5,
      };

      playerRef.current = new Plyr(videoRef.current, plyrOptions);

      // Setup event listeners
      playerRef.current.on('ready', () => {
        console.log('Plyr ready');
        if (onLoaded) onLoaded();
      });

      playerRef.current.on('error', (event) => {
        console.error('Plyr error:', event);
        const errorMessage = 'Failed to load the video. Please try another source.';
        setError(errorMessage);
        if (onError) onError(errorMessage);
      });
    };

    // Check if the source is HLS (m3u8)
    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          fragLoadingTimeOut: 60000,
          manifestLoadingTimeOut: 60000
        });
        
        hls.loadSource(src);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed');
          initPlayer();
        });
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error('HLS fatal error:', data);
            const errorMessage = `Failed to load HLS stream: ${data.type} - ${data.details}`;
            setError(errorMessage);
            if (onError) onError(errorMessage);
          }
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoRef.current.src = src;
        initPlayer();
      } else {
        console.error('HLS is not supported in this browser.');
        setError('HLS playback is not supported in this browser.');
        if (onError) onError('HLS playback is not supported in this browser.');
      }
    } else {
      // Regular video source
      videoRef.current.src = src;
      initPlayer();
    }

    return () => {
      // Cleanup
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, onLoaded, onError]);

  return (
    <div className="w-full h-full">
      {error ? (
        <div className="flex items-center justify-center w-full h-full bg-black text-white p-4 text-center">
          <p>{error}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="plyr-react"
          crossOrigin="anonymous"
          poster={poster}
          preload="metadata"
          playsInline
        >
          {title && <p>{title}</p>}
        </video>
      )}
    </div>
  );
};

export default PlyrPlayer;
