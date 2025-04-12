import React, { useRef, useState, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Subtitles, 
  Maximize, 
  Minimize,
  MonitorSmartphone,
  SkipBack,
  SkipForward,
  Volume1,
  Volume
} from 'lucide-react';

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

      {/* Center play/pause button */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-12">
            <button
              onClick={handleSeekBackward}
              className="p-4 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <SkipBack size={24} />
            </button>
            <button
              onClick={togglePlay}
              className="p-6 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              {isPlaying ? <Pause size={32} /> : <Play size={32} />}
            </button>
            <button
              onClick={handleSeekForward}
              className="p-4 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <SkipForward size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress bar */}
        <div className="relative w-full h-1 bg-white/30 rounded-full cursor-pointer mb-4 group">
          <div
            className="absolute h-full bg-primary rounded-full transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute h-full bg-white/50 rounded-full transition-all"
            style={{ 
              width: `${(videoRef.current?.buffered?.length ? videoRef.current.buffered.end(videoRef.current.buffered.length - 1) / duration : 0) * 100}%` 
            }}
          />
          <div 
            className="absolute w-3 h-3 bg-primary rounded-full -translate-y-1/2 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="text-white hover:text-primary transition-colors"
              title={isPlaying ? 'Pause (k)' : 'Play (k)'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            {/* Volume control */}
            <div className="relative group">
              <button
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="text-white hover:text-primary transition-colors"
                title="Toggle mute (m)"
              >
                {isMuted ? (
                  <VolumeX size={24} />
                ) : volume > 0.5 ? (
                  <Volume2 size={24} />
                ) : volume > 0 ? (
                  <Volume1 size={24} />
                ) : (
                  <Volume size={24} />
                )}
              </button>

              {/* Volume slider */}
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

            {/* Time display */}
            <div className="text-white text-sm font-medium space-x-2">
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
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
                  <Settings size={24} />
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
                <Subtitles size={24} />
              </button>
            )}

            {/* Picture in Picture */}
            {'pictureInPictureEnabled' in document && (
              <button
                onClick={togglePiP}
                className={`text-white hover:text-primary transition-colors ${isPiP ? 'text-primary' : ''}`}
                title="Picture in Picture"
              >
                <MonitorSmartphone size={24} />
              </button>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className={`text-white hover:text-primary transition-colors ${isFullscreen ? 'text-primary' : ''}`}
              title="Toggle fullscreen (f)"
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HLSPlayer;
