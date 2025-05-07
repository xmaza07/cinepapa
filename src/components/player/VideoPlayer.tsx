
import { motion } from 'framer-motion';
import PlyrPlayer from '@/components/PlyrPlayer';
import { useEffect, useRef } from 'react';
import { registerIframeOrigin } from '@/utils/iframe-proxy-sw';

interface VideoPlayerProps {
  isLoading: boolean;
  isCustomSource: boolean;
  streamUrl: string | null;
  iframeUrl: string;
  title: string;
  poster?: string;
  onLoaded: () => void;
  onError: (error: string) => void;
}

const VideoPlayer = ({
  isLoading,
  isCustomSource,
  streamUrl,
  iframeUrl,
  title,
  poster,
  onLoaded,
  onError
}: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Register iframe origin when URL changes
  useEffect(() => {
    if (!isCustomSource && iframeUrl) {
      registerIframeOrigin(iframeUrl);
    }
  }, [isCustomSource, iframeUrl]);

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 flex items-center justify-center"
        >
          <div className="w-16 h-16 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        {isCustomSource && streamUrl ? (
          <PlyrPlayer
            src={streamUrl}
            title={title}
            poster={poster}
            onLoaded={onLoaded}
            onError={onError}
          />
        ) : (
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full"
            allowFullScreen
            onLoad={onLoaded}
            // Don't use sandbox as it's not supported by the video sources
            // Instead, we're using our service worker to block pop-ups
          />
        )}
      </motion.div>
    </div>
  );
};

export default VideoPlayer;
