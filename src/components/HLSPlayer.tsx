import React, { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';

interface Quality {
  level: number;
  label: string;
}

interface HLSPlayerProps {
  src: string;
  poster?: string;
  onLoaded?: () => void;
  onError?: (error: string) => void;
}

const SEEK_TIME = 10; // seconds to seek forward/backward

const HLSPlayer: React.FC<HLSPlayerProps> = ({ src, poster, onLoaded, onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const textTrackRef = useRef<TextTrack | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCount = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [hasSubtitles, setHasSubtitles] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [currentQuality, setCurrentQuality] = useState(0);
  const [qualities, setQualities] = useState<Quality[]>([]);
  const [isSeekingHover, setIsSeekingHover] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const calculateProgress = (current: number, total: number) => {
    return `${Math.round((current / total) * 100)}%`;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateTimeLeft = useCallback((current: number, total: number) => {
    const timeLeft = total - current;
    return formatTime(timeLeft);
  }, []);

  const initPlayerRef = useRef<(shouldRetry?: boolean) => Promise<void>>();
  const hlsInstance = useRef<Hls | null>(null);
  const maxRetries = 2;

  const initPlayer = useCallback(async (shouldRetry = true) => {
    const video = videoRef.current;
    if (!video || !src) {
      setError(!video ? 'Video element not found' : 'No video source provided');
      setIsLoading(false);
      return;
    }

    if (Hls.isSupported()) {
      try {
        if (hlsInstance.current) {
          hlsInstance.current.destroy();
        }

        const config = {
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          startLevel: -1, // Auto quality selection
          capLevelToPlayerSize: true,
          autoStartLoad: true,
          fragLoadingRetryDelay: 2000,
          manifestLoadingRetryDelay: 2000,
          levelLoadingRetryDelay: 2000,
          fragLoadingMaxRetry: 2,
          manifestLoadingMaxRetry: 2,
          levelLoadingMaxRetry: 2,
          maxFragLookUpTolerance: 0.5,
          maxLoadingDelay: 4,
          lowLatencyMode: false,
          enableWorker: true,
          testBandwidth: true,
          progressive: true,
          abrEwmaDefaultEstimate: 500000,
          abrBandWidthFactor: 0.9,
          xhrSetup: (xhr: XMLHttpRequest) => {
            xhr.withCredentials = false;
          }
        };

        hlsInstance.current = new Hls(config);
        
        hlsInstance.current.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            let errorMessage = 'Video playback error';
            let canRetry = true;
            
            if (data.type === 'networkError') {
              if (data.response?.code === 403) {
                errorMessage = 'Stream access denied';
                canRetry = false;
              } else if (data.details === 'manifestLoadError') {
                errorMessage = 'Unable to load video stream';
              } else if (data.details === 'fragLoadError') {
                errorMessage = 'Network error while loading video';
              }
            } else if (data.type === 'mediaError') {
              errorMessage = 'Video format not supported';
              canRetry = false;
            }
            
            setError(errorMessage);
            if (hlsInstance.current) {
              hlsInstance.current.destroy();
              hlsInstance.current = null;
            }

            if (shouldRetry && canRetry && retryCount.current < maxRetries) {
              retryCount.current++;
              setTimeout(() => {
                setError(null);
                setIsLoading(true);
                initPlayerRef.current?.(false);
              }, 2000);
            }
          }
        });

        hlsInstance.current.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const levels = data.levels.map((level, index) => ({
            level: index,
            height: level.height,
            width: level.width,
            bitrate: level.bitrate,
            label: level.height ? `${level.height}p` : `Quality ${index + 1}`
          }));
          setQualities(levels);
          setCurrentQuality(hlsInstance.current?.currentLevel ?? -1);
          setIsLoading(false);
          if (onLoaded) onLoaded();
          
          video.play().catch(err => {
            console.warn('Auto-play prevented:', err);
          });
        });

        hlsInstance.current.loadSource(src);
        hlsInstance.current.attachMedia(video);

      } catch (e) {
        console.error('HLS initialization error:', e);
        setError('Failed to initialize video player');
        if (onError) onError('Player initialization failed');
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (onLoaded) onLoaded();
        video.play().catch(err => {
          console.warn('Auto-play prevented:', err);
        });
      });
    } else {
      const errorMessage = 'HLS playback not supported in this browser';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      setIsLoading(false);
    }
  }, [src, onLoaded, onError]);

  const handleQualityChange = useCallback((level: number) => {
    if (hlsInstance.current) {
      hlsInstance.current.currentLevel = level;
      setCurrentQuality(level);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  useEffect(() => {
    retryCount.current = 0;
  }, [src]);

  useEffect(() => {
    initPlayerRef.current = initPlayer;
    setIsLoading(true);
    setError(null);
    initPlayer();

    return () => {
      if (hlsInstance.current) {
        hlsInstance.current.destroy();
        hlsInstance.current = null;
      }
    };
  }, [src, initPlayer]);

  const retryPlayback = useCallback(() => {
    if (retryCount.current < maxRetries && initPlayerRef.current) {
      setError(null);
      setIsLoading(true);
      initPlayerRef.current(false);
    }
  }, [maxRetries]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(console.error);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((forward: boolean) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = video.currentTime + (forward ? SEEK_TIME : -SEEK_TIME);
    video.currentTime = Math.max(0, Math.min(newTime, video.duration));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  }, []);

  // Handle subtitles
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTracksChanged = () => {
      const tracks = Array.from(video.textTracks);
      setHasSubtitles(tracks.length > 0);
      
      // Set the first subtitle track as default if available
      tracks.forEach(track => {
        if (track.kind === 'subtitles' || track.kind === 'captions') {
          textTrackRef.current = track;
          track.mode = showSubtitles ? 'showing' : 'hidden';
        }
      });
    };

    video.addEventListener('loadedmetadata', handleTracksChanged);
    return () => video.removeEventListener('loadedmetadata', handleTracksChanged);
  }, [showSubtitles]);

  // Handle controls visibility
  useEffect(() => {
    const showControlsTemporarily = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (!videoRef.current?.paused) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', showControlsTemporarily);
      container.addEventListener('touchstart', showControlsTemporarily);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', showControlsTemporarily);
        container.removeEventListener('touchstart', showControlsTemporarily);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Update playing state on video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeekForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration);
    }
  }, []);

  const handleSeekBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      // Check for subtitles
      if (video.textTracks.length > 0) {
        textTrackRef.current = video.textTracks[0];
        setHasSubtitles(true);
      }
      onLoaded?.();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [onLoaded]);

  const toggleSubtitles = useCallback(() => {
    if (textTrackRef.current) {
      const newState = !showSubtitles;
      setShowSubtitles(newState);
      textTrackRef.current.mode = newState ? 'showing' : 'hidden';
    }
  }, [showSubtitles]);

  // Update status text
  useEffect(() => {
    if (duration > 0) {
      const progress = calculateProgress(currentTime, duration);
      const timeLeft = calculateTimeLeft(currentTime, duration);
      setStatusText(`${progress} complete • ${timeLeft} remaining`);
    }
  }, [currentTime, duration, calculateTimeLeft]);

  // Add keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          handleSeekBackward();
          break;
        case 'arrowright':
          e.preventDefault();
          handleSeekForward();
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlay, toggleFullscreen, toggleMute, handleSeekBackward, handleSeekForward]);

  // Handle buffering state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, []);

  return (
    <div 
      className="relative w-full h-full bg-black" 
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !videoRef.current?.paused && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full"
        playsInline
        poster={poster}
        onClick={togglePlay}
      />
      
      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white">
          <p className="text-xl mb-4">{error}</p>
          <button
            onClick={retryPlayback}
            className="px-4 py-2 bg-primary rounded hover:bg-primary/80 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress bar with preview */}
        <div 
          className="relative w-full h-1 bg-gray-600 rounded cursor-pointer mb-4 group"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            setHoverPosition(pos);
          }}
          onMouseLeave={() => setHoverPosition(null)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            if (videoRef.current) {
              videoRef.current.currentTime = pos * duration;
            }
          }}
        >
          <div
            className="absolute h-full bg-primary rounded transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute h-full bg-primary/50 rounded transition-all"
            style={{ 
              width: `${(videoRef.current?.buffered?.length ? videoRef.current.buffered.end(videoRef.current.buffered.length - 1) / duration : 0) * 100}%` 
            }}
          />
          <div className="absolute h-full w-full opacity-0 group-hover:opacity-100 hover:h-2 transition-all duration-200" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary transition-colors"
              title={isPlaying ? 'Pause (k)' : 'Play (k)'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
              )}
            </button>

            {/* Volume control */}
            <div className="relative group">
              <button
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="text-white hover:text-primary transition-colors"
                title="Toggle mute (m)"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d={isMuted ? "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" : "M15.536 8.464a5 5 0 010 7.072M12 6v12m4.536-4.536a5 5 0 000-7.072M12 6a4 4 0 00-4 4v4m8-4a4 4 0 014 4v4"} 
                  />
                </svg>
              </button>
              
              {showVolumeSlider && (
                <div 
                  className="absolute bottom-full left-0 mb-2 p-2 bg-black/90 rounded"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setVolume(newVolume);
                      if (videoRef.current) {
                        videoRef.current.volume = newVolume;
                        videoRef.current.muted = newVolume === 0;
                        setIsMuted(newVolume === 0);
                      }
                    }}
                    className="w-24 accent-primary"
                  />
                </div>
              )}
            </div>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quality selector */}
            {qualities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="text-white hover:text-primary transition-colors"
                  title="Quality settings"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 p-2 bg-black/90 rounded">
                    {qualities.map((quality) => (
                      <button
                        key={quality.level}
                        onClick={() => {
                          handleQualityChange(quality.level);
                          setShowQualityMenu(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          currentQuality === quality.level ? 'text-primary' : 'text-white hover:text-primary'
                        }`}
                      >
                        {quality.label}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        handleQualityChange(-1);
                        setShowQualityMenu(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        currentQuality === -1 ? 'text-primary' : 'text-white hover:text-primary'
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Subtitles toggle */}
            {hasSubtitles && (
              <button
                onClick={toggleSubtitles}
                className={`text-white hover:text-primary transition-colors ${showSubtitles ? 'text-primary' : ''}`}
                title="Toggle subtitles"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </button>
            )}

            {/* Picture in Picture */}
            {'pictureInPictureEnabled' in document && (
              <button
                onClick={togglePiP}
                className={`text-white hover:text-primary transition-colors ${isPiP ? 'text-primary' : ''}`}
                title="Picture in Picture"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className={`text-white hover:text-primary transition-colors ${isFullscreen ? 'text-primary' : ''}`}
              title="Toggle fullscreen (f)"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                  isFullscreen
                    ? "M9 20H5a2 2 0 01-2-2v-4m14 6h4a2 2 0 002-2v-4M5 4h4a2 2 0 012 2v4M19 4h-4a2 2 0 00-2 2v4"
                    : "M3 7v4a1 1 0 001 1h4a1 1 0 001-1V7m0 0V3a1 1 0 00-1-1H4a1 1 0 00-1 1v4m16 0v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V7m0 0V3a1 1 0 011-1h4a1 1 0 011 1v4"
                } />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HLSPlayer;
