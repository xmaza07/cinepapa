
import { motion } from 'framer-motion';
import PlyrPlayer from '@/components/PlyrPlayer';
import { useEffect, useRef, useState } from 'react';
import { registerIframeOrigin, setProxyHeaders } from '@/utils/iframe-proxy-sw';
import { createProxyStreamUrl, proxyAndRewriteM3u8 } from '@/utils/cors-proxy-api';

interface VideoPlayerProps {
  isLoading: boolean;
  isCustomSource: boolean;
  streamUrl: string | null;
  iframeUrl: string;
  title: string;
  poster?: string;
  headers?: Record<string, string>;
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
  headers,
  onLoaded,
  onError
}: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [processedStreamUrl, setProcessedStreamUrl] = useState<string | null>(null);
  
  // Register iframe origin when URL changes
  useEffect(() => {
    if (!isCustomSource && iframeUrl) {
      registerIframeOrigin(iframeUrl);
    }
  }, [isCustomSource, iframeUrl]);

  // Process M3U8 stream URLs to handle CORS issues
  useEffect(() => {
    if (isCustomSource && streamUrl) {
      // If we have custom headers, register them with the service worker
      if (headers && Object.keys(headers).length > 0) {
        try {
          const domain = new URL(streamUrl).hostname;
          setProxyHeaders(domain, headers);
        } catch (e) {
          console.error('Failed to set proxy headers:', e);
        }
      }

      // Process based on URL type
      if (streamUrl.endsWith('.m3u8')) {
        // For M3U8 streams, we might need to rewrite URLs inside the playlist
        if (headers && Object.keys(headers).length > 0) {
          // If we have headers and it's an m3u8, we may need to rewrite the file
          proxyAndRewriteM3u8(streamUrl, headers)
            .then(processedM3u8 => {
              // Create a blob URL for the processed M3U8
              const blob = new Blob([processedM3u8], { type: 'application/vnd.apple.mpegurl' });
              const blobUrl = URL.createObjectURL(blob);
              setProcessedStreamUrl(blobUrl);
            })
            .catch(err => {
              console.error('Failed to process M3U8:', err);
              // Fallback to simple proxy
              setProcessedStreamUrl(createProxyStreamUrl(streamUrl, headers));
            });
        } else {
          // No headers, just proxy the stream
          setProcessedStreamUrl(createProxyStreamUrl(streamUrl));
        }
      } else {
        // For other types of streams, just proxy them
        setProcessedStreamUrl(createProxyStreamUrl(streamUrl, headers));
      }
    } else {
      setProcessedStreamUrl(null);
    }
  }, [isCustomSource, streamUrl, headers]);

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
        {isCustomSource && (processedStreamUrl || streamUrl) ? (
          <PlyrPlayer
            src={processedStreamUrl || streamUrl}
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
