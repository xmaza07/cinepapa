import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Media } from '@/utils/types';
import { backdropSizes } from '@/utils/api';
import { getImageUrl } from '@/utils/services/tmdb';
import { Button } from '@/components/ui/button';
import { Play, Info, Star, Calendar, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaPreferences } from '@/hooks/use-media-preferences';
import { trackMediaPreference } from '@/lib/analytics';
import useKeyPress from '@/hooks/use-key-press';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExtendedMedia extends Media {
  logo_path?: string;
  tagline?: string;
}

interface HeroProps {
  media: Media[];
  className?: string;
}

const Hero = ({ media, className = '' }: HeroProps) => {
  // Filter and prioritize media based on user preferences
  const { preference } = useMediaPreferences();
  const filteredMedia = useMemo(() => {
    // First filter out items without backdrop
    const withBackdrop = media.filter(item => item.backdrop_path);

    // If user has a preference, prioritize that content type
    if (preference && preference !== 'balanced') {
      const preferred = withBackdrop.filter(item => item.media_type === preference);
      const others = withBackdrop.filter(item => item.media_type !== preference);
      return [...preferred, ...others];
    }

    return withBackdrop;
  }, [media, preference]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeTimeout = useRef<NodeJS.Timeout | null>(null);


  // Helper to build srcSet for a given backdrop_path
  const buildSrcSet = (backdrop_path: string) => [
    `${getImageUrl(backdrop_path, backdropSizes.small)} 300w`,
    `${getImageUrl(backdrop_path, backdropSizes.medium)} 780w`,
    `${getImageUrl(backdrop_path, backdropSizes.large)} 1280w`,
    `${getImageUrl(backdrop_path, backdropSizes.original)} 1920w`,
  ].join(', ');

  // Helper to preload an image (optionally with srcSet)
  const preloadImage = (backdrop_path: string) => {
    if (!backdrop_path) return;
    const img = new window.Image();
    img.src = getImageUrl(backdrop_path, backdropSizes.medium);
    img.srcset = buildSrcSet(backdrop_path);
  };

  // Preload next and previous images
  const preloadNextImage = useCallback(() => {
    if (filteredMedia.length > 1) {
      const nextIndex = (currentIndex + 1) % filteredMedia.length;
      const nextMedia = filteredMedia[nextIndex];
      if (nextMedia && nextMedia.backdrop_path) {
        preloadImage(nextMedia.backdrop_path);
      }
    }
  }, [filteredMedia, currentIndex, preloadImage]);

  const preloadPrevImage = useCallback(() => {
    if (filteredMedia.length > 1) {
      const prevIndex = (currentIndex - 1 + filteredMedia.length) % filteredMedia.length;
      const prevMedia = filteredMedia[prevIndex];
      if (prevMedia && prevMedia.backdrop_path) {
        preloadImage(prevMedia.backdrop_path);
      }
    }
  }, [filteredMedia, currentIndex, preloadImage]);

  // Auto-rotation control
  const toggleAutoRotation = () => {
    if (isAutoRotating) {
      pauseAutoRotation();
    } else {
      restartAutoRotation();
    }
    setIsAutoRotating(!isAutoRotating);
  };

  const featuredMedia = filteredMedia[currentIndex] as ExtendedMedia;

  // Handle mouse interactions
  const handleMouseEnter = () => {
    pauseAutoRotation();
  };

  const handleMouseLeave = () => {
    if (isAutoRotating) {
      restartAutoRotation();
    }
  };

  // Navigation functions
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % filteredMedia.length);
  }, [filteredMedia.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length);
  }, [filteredMedia.length]);

  // Keyboard navigation
  useKeyPress("ArrowRight", goToNext);
  useKeyPress("ArrowLeft", goToPrev);
  useKeyPress("Space", toggleAutoRotation);

  // Touch handling for swipes with improved sensitivity
  const minSwipeDistance = isMobile ? 20 : 50;
  const touchSensitivity = isMobile ? 1.2 : 1;

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart(e.touches[0].clientX);
      setIsSwiping(false);
      pauseAutoRotation();
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(e.touches[0].clientX);
      if (touchStart && Math.abs(e.touches[0].clientX - touchStart) > 10) {
        setIsSwiping(true);
        e.preventDefault();
      }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance * touchSensitivity;
    const isRightSwipe = distance < -minSwipeDistance * touchSensitivity;
    if (isLeftSwipe || isRightSwipe) {
      // Debounce swipe
      if (swipeTimeout.current) clearTimeout(swipeTimeout.current);
      swipeTimeout.current = setTimeout(() => setIsSwiping(false), 200);
    }
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrev();
    }
    if (isAutoRotating) {
      restartAutoRotation();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleMediaClick = useCallback((media: Media) => {
    trackMediaPreference(media.media_type as 'movie' | 'tv', 'select');
    navigate(media.media_type === 'movie' ? `/movie/${media.id}` : `/tv/${media.id}`);
  }, [navigate]);

  // Auto rotation management with improved timing
  const startAutoRotation = useCallback(() => {
    if (filteredMedia.length <= 1) return;

    intervalRef.current = setInterval(() => {
      goToNext();
      // Preload the next image during rotation
      preloadNextImage();
    }, 8000); // Reduced to 8 seconds for better engagement
  }, [filteredMedia.length, goToNext, preloadNextImage]);

  const pauseAutoRotation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const restartAutoRotation = () => {
    pauseAutoRotation();
    startAutoRotation();
  };

  // Initialize and clean up auto rotation
  useEffect(() => {
    if (isAutoRotating) {
      startAutoRotation();
    }
    return pauseAutoRotation;
  }, [startAutoRotation, isAutoRotating]);

  // Preload next and previous images when current is loaded
  useEffect(() => {
    if (isLoaded) {
      preloadNextImage();
      preloadPrevImage();
    }
  }, [isLoaded, preloadNextImage, preloadPrevImage]);

  // Preload the first image using <link rel="preload"> for best LCP
  useEffect(() => {
    if (currentIndex === 0 && featuredMedia?.backdrop_path) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = getImageUrl(featuredMedia.backdrop_path, backdropSizes.large);
      link.setAttribute('imagesrcset', buildSrcSet(featuredMedia.backdrop_path));
      link.setAttribute('media', '(min-width: 0px)');
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [currentIndex, featuredMedia]);

  // Always call hooks at the top level
  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;

    const handleTouchMove = (e: TouchEvent) => {
      // Only handle single touch events
      if (e.touches.length === 1) {
        setTouchEnd(e.touches[0].clientX);
        if (touchStart && Math.abs(e.touches[0].clientX - touchStart) > 10) {
          e.preventDefault();
        }
      }
    };
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      node.removeEventListener('touchmove', handleTouchMove);
    };
  }, [touchStart]);

  const title = featuredMedia.title || featuredMedia.name || 'Untitled';
  const releaseDate = featuredMedia.release_date || featuredMedia.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';

  const handlePlay = () => {
    const mediaType = featuredMedia.media_type;
    const id = featuredMedia.id;

    if (mediaType === 'tv') {
      navigate(`/watch/tv/${id}/1/1`);
    } else {
      navigate(`/watch/${mediaType}/${id}`);
    }
  };

  const handleMoreInfo = () => {
    navigate(`/${featuredMedia.media_type}/${featuredMedia.id}`);
  };

  // --- Fix for passive event listener issue ---
  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;

    const handleTouchMove = (e: TouchEvent) => {
      // Only handle single touch events
      if (e.touches.length === 1) {
        setTouchEnd(e.touches[0].clientX);
        if (touchStart && Math.abs(e.touches[0].clientX - touchStart) > 10) {
          e.preventDefault();
        }
      }
    };
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      node.removeEventListener('touchmove', handleTouchMove);
    };
  }, [touchStart]);

  if (!filteredMedia.length) return null;
  return (
    <section
      ref={carouselRef}
      className={`relative w-full h-[60vh] sm:h-[65vh] md:h-[75vh] lg:h-[80vh] overflow-hidden group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label="Featured media carousel"
      aria-roledescription="carousel"
    >
      {/* Loading Skeleton */}
      {firstLoad && !isLoaded && (
        <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
          <div className="w-full h-full">
            <Skeleton className="w-full h-full animate-pulse bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
          </div>
        </div>
      )}

      {/* Background Image with Enhanced Gradient Overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentIndex}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{
            opacity: isLoaded ? 1 : 0,
            scale: isLoaded ? 1 : 1.05
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Hero Image with priority loading for first image */}
          <img
            src={getImageUrl(featuredMedia.backdrop_path, backdropSizes.medium)}
            srcSet={buildSrcSet(featuredMedia.backdrop_path)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 80vw"
            alt={title}
            className="w-full h-full object-cover"
            onLoad={() => {
              setIsLoaded(true);
              setFirstLoad(false);
            }}
            loading={currentIndex === 0 ? "eager" : "lazy"}
            fetchPriority={currentIndex === 0 ? "high" : "auto"}
          />

          {/* Enhanced gradient overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-background from-10% via-background/70 via-40% to-transparent" />

          {/* Enhanced side gradient for better text contrast on mobile */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent lg:from-background/90 lg:via-background/50 lg:to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Modern glassmorphic content block, mobile-first */}
      <div className={
        `absolute inset-0 flex flex-col items-start justify-end sm:justify-center px-2 sm:px-8 md:px-16 z-10 pointer-events-none`
      }>
        <div
          className={
            `w-full max-w-3xl rounded-3xl backdrop-blur-2xl p-4 sm:p-8 md:p-12 lg:p-16 lg:pb-20 flex flex-col items-start pointer-events-auto transition-all duration-300 relative overflow-hidden ${isMobile ? 'mb-4' : 'mb-12'}`
          }
          style={{
            background: 'rgba(20,20,30,0.10)',
            boxShadow: 'none',
            border: 'none'
          }}
        >
          {/* Radial mask to fade the edges for blending */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.01) 90%, rgba(0,0,0,0) 100%)',
              maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.01) 90%, rgba(0,0,0,0) 100%)',
              zIndex: 2,
            }}
          />

          {/* Metadata badges - More compact on mobile */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-4">
            <span className="px-2 py-1 md:px-3 md:py-1 rounded-full bg-accent/90 backdrop-blur-sm text-xs font-medium text-white uppercase tracking-wider">
              {featuredMedia.media_type === 'movie' ? 'Movie' : 'TV Series'}
            </span>

            {releaseYear && (
              <span className="flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white">
                <Calendar className="w-3 h-3 mr-1" />
                {releaseYear}
              </span>
            )}

            {featuredMedia.vote_average > 0 && (
              <span className="flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white">
                <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                {featuredMedia.vote_average.toFixed(1)}
              </span>
            )}
          </div>

          {/* Redesigned Title Section */}
          <div className="mb-2 md:mb-3 w-full flex flex-col items-start">
            {/* Logo if available */}
            {featuredMedia.logo_path ? (
              <img
                src={getImageUrl(featuredMedia.logo_path, backdropSizes.medium)}
                alt={title}
                className="max-h-16 md:max-h-24 mb-2 drop-shadow-lg"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold italic tracking-wide text-accent drop-shadow-md text-balance" style={{letterSpacing: '0.03em'}}>
                {title}
              </h1>
            )}

            {/* Tagline if available */}
            {featuredMedia.tagline && (
              <p className="text-lg md:text-xl text-white/80 italic mt-1 mb-2 drop-shadow" style={{textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>
                {featuredMedia.tagline}
              </p>
            )}
          </div>

          {/* Overview - Fewer lines on mobile */}
          <p className="text-white/90 mb-4 md:mb-8 line-clamp-2 sm:line-clamp-3 text-base md:text-lg max-w-2xl text-shadow-lg" style={{textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>
            {featuredMedia.overview}
          </p>

          {/* Action buttons - Smaller on mobile */}
          <div className="flex flex-wrap gap-3 md:gap-4 mt-2">
            <Button
              onClick={handlePlay}
              className={`hero-button bg-accent hover:bg-accent/90 text-white flex items-center transition-all active:scale-95 hover:scale-105 shadow-lg shadow-accent/20 rounded-full px-6 py-3 ${isMobile ? 'text-base' : 'text-lg'}`}
              size={isMobile ? "default" : "lg"}
              style={{ minWidth: isMobile ? 120 : 160, minHeight: isMobile ? 44 : 56 }}
              aria-label="Play Now"
            >
              <Play className="h-5 w-5 mr-2" />
              Play Now
            </Button>

            <Button
              onClick={handleMoreInfo}
              variant="outline"
              size={isMobile ? "default" : "lg"}
              className={`hero-button border-white/30 bg-black/40 text-white hover:bg-black/60 hover:border-white/50 flex items-center transition-all active:scale-95 hover:scale-105 rounded-full px-6 py-3 ${isMobile ? 'text-base' : 'text-lg'}`}
              style={{ minWidth: isMobile ? 120 : 160, minHeight: isMobile ? 44 : 56 }}
              aria-label="More Info"
            >
              <Info className="h-5 w-5 mr-2" />
              More Info
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced pagination indicators with progress animation */}
      {filteredMedia.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 md:bottom-6 flex space-x-2 z-10">
          {filteredMedia.map((_, index) => (
            <button
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-accent w-8 pagination-indicator-active'
                  : 'bg-white/30 w-2 hover:bg-white/50'
              }`}
              onClick={() => {
                setIsLoaded(false);
                setCurrentIndex(index);
              }}
              aria-label={`View featured item ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}

      {/* Previous/Next buttons - More visible on mobile */}
      {filteredMedia.length > 1 && (
        <>
          <button
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm text-white p-1.5 sm:p-2 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
            onClick={goToPrev}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-sm text-white p-1.5 sm:p-2 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Auto-rotation control */}
      <button
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm text-white p-1.5 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        onClick={toggleAutoRotation}
        aria-label={isAutoRotating ? "Pause auto-rotation" : "Resume auto-rotation"}
      >
        {isAutoRotating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
    </section>
  );
};

export default Hero;
