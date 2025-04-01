
import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { VidsrcSubtitle } from '@/utils/vidsrc-api';

// Define options type
interface ArtPlayerOptions {
  url: string;
  title?: string;
  poster?: string;
  subtitle?: VidsrcSubtitle[];
  autoplay?: boolean;
  muted?: boolean;
  autoSize?: boolean;
  autoMini?: boolean;
  loop?: boolean;
  flip?: boolean;
  playbackRate?: boolean;
  aspectRatio?: boolean;
  fullscreen?: boolean;
  fullscreenWeb?: boolean;
  subtitleOffset?: boolean;
  miniProgressBar?: boolean;
  lang?: string;
  whitelist?: string[];
  layers?: any[];
  controls?: any[];
  settings?: any[];
  quality?: any[];
  highlight?: any[];
}

interface ArtPlayerProps {
  option: ArtPlayerOptions;
  getInstance?: (art: any) => void;
  className?: string;
}

const ArtPlayer: React.FC<ArtPlayerProps> = ({ option, getInstance, className }) => {
  const artRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    // Return if element doesn't exist
    if (!artRef.current) return;

    // Function to handle HLS playback
    const customHls = (video: HTMLElement, url: string) => {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video as HTMLMediaElement);

        // Optional: For video events handling
        video.addEventListener('play', () => {
          if (window.parent) {
            // Post message to parent window for watch history tracking
            window.parent.postMessage({
              type: 'watchProgress', 
              position: Math.floor((video as HTMLMediaElement).currentTime)
            }, '*');
          }
        });

        // Send periodic updates of playback position
        const interval = setInterval(() => {
          if ((video as HTMLMediaElement).currentTime > 0) {
            if (window.parent) {
              window.parent.postMessage({
                type: 'watchProgress', 
                position: Math.floor((video as HTMLMediaElement).currentTime)
              }, '*');
            }
          }
        }, 30000); // Every 30 seconds

        return {
          destroy: () => {
            hls.destroy();
            clearInterval(interval);
          }
        };
      }

      return null;
    };

    // Process subtitles if available
    const subtitles = option.subtitle?.map(sub => ({
      url: sub.file,
      name: sub.lang,
      default: sub.lang.toLowerCase() === 'english' || sub.lang.toLowerCase() === 'en',
    })) || [];

    // Basic required options
    const defaultOption = {
      container: artRef.current,
      url: option.url,
      title: option.title || '',
      poster: option.poster || '',
      volume: 0.5,
      isLive: false,
      muted: false,
      autoplay: option.autoplay || false,
      pip: true,
      autoSize: true,
      autoMini: true,
      screenshot: false,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      lang: option.lang || navigator.language.toLowerCase(),
      subtitle: {
        url: '', // Default subtitle URL
        type: 'srt',
        encoding: 'utf-8',
        style: {
          color: '#FFFFFF',
          background: 'rgba(0, 0, 0, 0.5)',
          textShadow: '0.5px 0.5px 0.5px rgba(0, 0, 0, 0.5)'
        }
      },
      customType: {
        'm3u8': customHls,
      },
    };

    // Initialize Artplayer with merged options
    const art = new Artplayer({
      ...defaultOption,
      whitelist: option.whitelist || [],
      settings: option.settings || [
        {
          width: 200,
          name: 'Subtitles',
          html: 'Subtitles',
          tooltip: 'Show or hide subtitles',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-type"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>',
          selector: subtitles.map(sub => ({
            name: sub.name,
            value: sub.url,
          })),
          onSelect: function(item) {
            art.subtitle.switch(item.value);
            return item.name;
          }
        }
      ]
    });

    // Add subtitles to player
    subtitles.forEach(sub => {
      art.subtitle.add({
        url: sub.url,
        default: sub.default,
      });
    });

    // Share instance
    instanceRef.current = art;
    if (getInstance) getInstance(art);

    // Cleanup function
    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
      }
    };
  }, [option, getInstance]);

  return <div ref={artRef} className={className || 'art-player'} />;
};

export default ArtPlayer;
