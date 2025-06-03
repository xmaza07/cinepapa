
import React, { useRef, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { motion } from 'framer-motion';

interface ReactPlayerComponentProps {
  url: string;
  poster?: string;
  controls?: boolean;
  playing?: boolean;
  muted?: boolean;
  volume?: number;
  width?: string | number;
  height?: string | number;
  config?: any;
  onReady?: () => void;
  onStart?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onBuffer?: () => void;
  onEnded?: () => void;
  onError?: (error: any) => void;
  onProgress?: (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => void;
  onDuration?: (duration: number) => void;
  className?: string;
}

const ReactPlayerComponent: React.FC<ReactPlayerComponentProps> = ({
  url,
  poster,
  controls = true,
  playing = false,
  muted = false,
  volume = 0.8,
  width = '100%',
  height = '100%',
  config = {},
  onReady,
  onStart,
  onPlay,
  onPause,
  onBuffer,
  onEnded,
  onError,
  onProgress,
  onDuration,
  className = ''
}) => {
  const playerRef = useRef<ReactPlayer>(null);

  const handleReady = useCallback(() => {
    console.log('ReactPlayer ready');
    onReady?.();
  }, [onReady]);

  const handleError = useCallback((error: any) => {
    console.error('ReactPlayer error:', error);
    onError?.(error);
  }, [onError]);

  const handleProgress = useCallback((state: any) => {
    onProgress?.(state);
  }, [onProgress]);

  // Default HLS config for react-player
  const defaultConfig = {
    file: {
      attributes: {
        crossOrigin: 'anonymous',
      },
    },
    youtube: {
      playerVars: { showinfo: 1 }
    },
    facebook: {
      appId: '12345'
    },
    ...config
  };

  if (!url) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white">
        <p>No video source available</p>
      </div>
    );
  }

  return (
    <motion.div 
      className={`relative w-full h-full ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        controls={controls}
        muted={muted}
        volume={volume}
        width={width}
        height={height}
        config={defaultConfig}
        light={poster}
        onReady={handleReady}
        onStart={onStart}
        onPlay={onPlay}
        onPause={onPause}
        onBuffer={onBuffer}
        onEnded={onEnded}
        onError={handleError}
        onProgress={handleProgress}
        onDuration={onDuration}
        style={{
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
    </motion.div>
  );
};

export default ReactPlayerComponent;
