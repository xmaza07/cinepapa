
import { motion } from 'framer-motion';
import ReactPlayerComponent from './ReactPlayerComponent';
import { useEffect, useRef, useState } from 'react';
import { registerIframeOrigin, setProxyHeaders, resetServiceWorkerData } from '@/utils/iframe-proxy-sw';
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
  const [iframeAttempts, setIframeAttempts] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Reset service worker data when component unmounts
  useEffect(() => {
    return () => {
      resetServiceWorkerData();
    };
  }, []);
  
  // Register iframe origin when URL changes
  useEffect(() => {
    if (!isCustomSource && iframeUrl) {
      registerIframeOrigin(iframeUrl);
      setIframeAttempts(0);
    }
  }, [isCustomSource, iframeUrl]);

  // Process stream URLs for custom sources
  useEffect(() => {
    if (isCustomSource && streamUrl) {
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
        if (headers && Object.keys(headers).length > 0) {
          proxyAndRewriteM3u8(streamUrl, headers)
            .then(processedM3u8 => {
              const blob = new Blob([processedM3u8], { type: 'application/vnd.apple.mpegurl' });
              const blobUrl = URL.createObjectURL(blob);
              setProcessedStreamUrl(blobUrl);
            })
            .catch(err => {
              console.error('Failed to process M3U8:', err);
              setProcessedStreamUrl(createProxyStreamUrl(streamUrl, headers));
            });
        } else {
          setProcessedStreamUrl(createProxyStreamUrl(streamUrl));
        }
      } else {
        setProcessedStreamUrl(createProxyStreamUrl(streamUrl, headers));
      }
    } else {
      setProcessedStreamUrl(null);
    }
  }, [isCustomSource, streamUrl, headers]);

  const handlePlayerReady = () => {
    console.log('Player ready');
    onLoaded();
  };

  const handlePlayerError = (error: any) => {
    console.error('Player error:', error);
    onError(`Failed to load video: ${error.message || 'Unknown error'}`);
  };

  const handleIframeError = () => {
    console.error('Iframe failed to load:', iframeUrl);
    setIframeAttempts(prev => prev + 1);
    
    if (iframeAttempts >= 2) {
      onError('Failed to load iframe content after multiple attempts');
    }
  };
  
  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
    onLoaded();
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        const style = document.createElement('style');
        style.textContent = `
          div[class*="popup"], div[class*="ad"], div[id*="popup"], div[id*="ad"],
          iframe:not([src*="${new URL(iframeUrl).host}"]) {
            display: none !important;
            pointer-events: none !important;
          }
        `;
        iframeRef.current.contentDocument?.head.appendChild(style);
      } catch (e) {
        console.log('Could not inject CSS into iframe (expected due to CORS)');
      }
    }
  };

  // Determine the video URL to use
  const getVideoUrl = () => {
    if (isCustomSource && (processedStreamUrl || streamUrl)) {
      return processedStreamUrl || streamUrl;
    }
    return iframeUrl;
  };

  const videoUrl = getVideoUrl();

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
      {isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 flex items-center justify-center"
        >
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        {isCustomSource ? (
          <ReactPlayerComponent
            url={videoUrl || ''}
            poster={poster}
            controls={true}
            playing={isPlaying}
            width="100%"
            height="100%"
            config={{
              file: {
                attributes: {
                  crossOrigin: 'anonymous',
                },
                hlsOptions: {
                  maxBufferLength: 30,
                  maxMaxBufferLength: 60,
                  fragLoadingTimeOut: 60000,
                  manifestLoadingTimeOut: 60000,
                }
              }
            }}
            onReady={handlePlayerReady}
            onError={handlePlayerError}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="rounded-lg overflow-hidden"
          />
        ) : (
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full"            
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="no-referrer"
            loading="lazy"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            key={`iframe-${iframeUrl}-${iframeAttempts}`}
          />
        )}
      </motion.div>
    </div>
  );
};

export default VideoPlayer;
