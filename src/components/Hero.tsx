
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
  const swipeProgress = useRef<number>(0);
  const [visualSwipeFeedback, setVisualSwipeFeedback] = useState(0);

  // Helper to build srcSet for a given backdrop_path
  const buildSrcSet = useCallback((backdrop_path: string) => [
    `${getImageUrl(backdrop_path, backdropSizes.small)} 300w`,
    `${getImageUrl(backdrop_path, backdropSizes.medium)} 780w`,
    `${getImageUrl(backdrop_path, backdropSizes.large)} 1280w`,
    `${getImageUrl(backdrop_path, backdropSizes.original)} 1920w`,
  ].join(', '), []);

  // Helper to preload an image (optionally with srcSet)
  const preloadImage = useCallback((backdrop_path: string) => {
    if (!backdrop_path) return;
    const img = new window.Image();
    img.src = getImageUrl(backdrop_path, backdropSizes.medium);
    img.srcset = buildSrcSet(backdrop_path);
  }, [buildSrcSet]);

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
    setIsLoaded(false);
    setCurrentIndex((prev) => (prev + 1) % filteredMedia.length);
  }, [filteredMedia.length]);

  const goToPrev = useCallback(() => {
    setIsLoaded(false);
    setCurrentIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length);
  }, [filteredMedia.length]);

  // Keyboard navigation
  useKeyPress("ArrowRight", goToNext);
  useKeyPress("ArrowLeft", goToPrev);
  useKeyPress("Space", toggleAutoRotation);

  // Enhanced touch handling for swipes with improved sensitivity and visual feedback
  const minSwipeDistance = isMobile ? 15 : 40; // Reduced from 20/50
  const touchSensitivity = isMobile ? 1.5 : 1.2; // Increased from 1.2/1

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart(e.touches[0].clientX);
      setIsSwiping(false);
      setVisualSwipeFeedback(0);
      swipeProgress.current = 0;
      pauseAutoRotation();
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || e.touches.length !== 1) return;
    
    const currentX = e.touches[0].clientX;
    setTouchEnd(currentX);
    
    if (Math.abs(currentX - touchStart) > 10) {
      setIsSwiping(true);
      
      // Calculate visual feedback (limited to range -100 to 100)
      const maxVisualOffset = carouselRef.current?.clientWidth ? carouselRef.current.clientWidth / 3 : 100;
      const rawOffset = currentX - touchStart;
      const normalizedOffset = Math.max(Math.min(rawOffset, maxVisualOffset), -maxVisualOffset);
      const percentage = (normalizedOffset / maxVisualOffset) * 100;
      
      setVisualSwipeFeedback(percentage);
      swipeProgress.current = percentage;
      
      e.preventDefault();
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance * touchSensitivity;
    const isRightSwipe = distance < -minSwipeDistance * touchSensitivity;
    
    // Reset visual feedback
    setVisualSwipeFeedback(0);
    
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

  // Auto rotation management with enhanced timing
  const startAutoRotation = useCallback(() => {
    if (filteredMedia.length <= 1) return;

    intervalRef.current = setInterval(() => {
      goToNext();
      // Preload the next image during rotation
      preloadNextImage();
    }, 10000); // Increased from 8 seconds for more time to appreciate each media
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
  }, [currentIndex, featuredMedia, buildSrcSet]);

  // Always call hooks at the top level
  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return;

    const handleTouchMove = (e: TouchEvent) => {
      // Only handle single touch events
      if (e.touches.length === 1 && touchStart) {
        const currentX = e.touches[0].clientX;
        if (Math.abs(currentX - touchStart) > 10) {
          e.preventDefault();
        }
      }
    };
    
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      node.removeEventListener('touchmove', handleTouchMove);
    };
  }, [touchStart]);

  const title = featuredMedia?.title || featuredMedia?.name || 'Untitled';
  const releaseDate = featuredMedia?.release_date || featuredMedia?.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';

  const handlePlay = () => {
    const mediaType = featuredMedia?.media_type;
    const id = featuredMedia?.id;

    if (mediaType === 'tv') {
      navigate(`/watch/tv/${id}/1/1`);
    } else {
      navigate(`/watch/${mediaType}/${id}`);
    }
  };

  const handleMoreInfo = () => {
    navigate(`/${featuredMedia?.media_type}/${featuredMedia?.id}`);
  };

  // Define animation variants for framer-motion
  const backdropVariants = {
    initial: { 
      opacity: 0,
      scale: 1.05,
      filter: "brightness(0.8) saturate(0.8)"
    },
    animate: { 
      opacity: isLoaded ? 1 : 0,
      scale: isLoaded ? 1 : 1.05,
      filter: "brightness(1) saturate(0.9)",
      transition: { 
        opacity: { duration: 0.8, ease: "easeOut" },
        scale: { duration: 1.2, ease: "easeOut" },
        filter: { duration: 1, ease: "easeOut" }
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.4, ease: "easeIn" } 
    }
  };

  const contentBlockVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    }
  };

  const contentItemVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  if (!filteredMedia.length) return null;
  
  return (
    <section
      ref={carouselRef}
      className="relative w-full h-[60vh] sm:h-[65vh] md:h-[75vh] lg:h-[80vh] overflow-hidden group"
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

      {/* Split Hero Layout with Background Image and Vertical Content Area */}
      <div className="absolute inset-0 flex flex-col lg:flex-row">
        {/* Background Image with Enhanced Monochromatic Overlay */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${currentIndex}`}
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 lg:w-2/3 lg:relative"
            style={{
              transform: `translateX(${visualSwipeFeedback * 0.05}px)` // Visual feedback during swipe
            }}
          >
            {/* Hero Image with priority loading for first image */}
            <img
              src={getImageUrl(featuredMedia?.backdrop_path, backdropSizes.medium)}
              srcSet={buildSrcSet(featuredMedia?.backdrop_path)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 80vw"
              alt={title}
              className="w-full h-full object-cover filter grayscale-[20%]"
              onLoad={() => {
                setIsLoaded(true);
                setFirstLoad(false);
              }}
              loading={currentIndex === 0 ? "eager" : "lazy"}
              fetchPriority={currentIndex === 0 ? "high" : "auto"}
            />

            {/* Monochromatic gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 from-10% via-gray-900/70 via-40% to-gray-950/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/60 to-transparent" />
            
            {/* Vertical split line (desktop only) */}
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-gray-800/0 via-gray-800/30 to-gray-800/0" />
          </motion.div>
        </AnimatePresence>

        {/* Modern content area with vertical layout */}
        <motion.div 
          className="absolute inset-0 lg:relative lg:w-1/3 flex flex-col justify-end lg:justify-center items-start z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            transform: `translateX(${visualSwipeFeedback * 0.02}px)` // Subtle visual feedback during swipe
          }}
        >
          <motion.div
            className="w-full h-full flex flex-col justify-end lg:justify-center p-6 sm:p-8 md:p-10 lg:p-12"
            variants={contentBlockVariants}
            initial="initial"
            animate="animate"
          >
            {/* Metadata badges - More compact on mobile */}
            <motion.div 
              variants={contentItemVariants} 
              className="flex flex-wrap items-center gap-2 md:gap-3 mb-3 md:mb-4"
            >
              <span className="px-2 py-1 rounded-sm bg-white/10 backdrop-blur-sm text-xs font-medium text-white uppercase tracking-wider border-l-2 border-white">
                {featuredMedia?.media_type === 'movie' ? 'Movie' : 'TV Series'}
              </span>

              {releaseYear && (
                <span className="flex items-center px-2 py-1 rounded-sm bg-white/5 backdrop-blur-sm text-xs font-medium text-white/90">
                  <Calendar className="w-3 h-3 mr-1" />
                  {releaseYear}
                </span>
              )}

              {featuredMedia?.vote_average > 0 && (
                <span className="flex items-center px-2 py-1 rounded-sm bg-white/5 backdrop-blur-sm text-xs font-medium text-white/90">
                  <Star className="w-3 h-3 mr-1 fill-white text-white" />
                  {featuredMedia?.vote_average.toFixed(1)}
                </span>
              )}
            </motion.div>

            {/* Title Section with Enhanced Typography */}
            <motion.div variants={contentItemVariants} className="mb-3 md:mb-4">
              {featuredMedia?.logo_path ? (
                <img
                  src={getImageUrl(featuredMedia.logo_path, backdropSizes.medium)}
                  alt={title}
                  className="max-h-16 md:max-h-24 mb-2 drop-shadow-lg filter grayscale"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white text-balance" 
                    style={{ fontFamily: "'Playfair Display', serif" }}>
                  {title}
                </h1>
              )}

              {/* Tagline with serif styling */}
              {featuredMedia?.tagline && (
                <p className="text-lg md:text-xl text-white/80 mt-2 mb-2 font-serif italic">
                  {featuredMedia.tagline}
                </p>
              )}
            </motion.div>

            {/* Overview - Styled with serif font */}
            <motion.p 
              variants={contentItemVariants}
              className="text-white/80 mb-6 md:mb-8 line-clamp-3 sm:line-clamp-4 text-base md:text-lg font-serif leading-relaxed"
            >
              {featuredMedia?.overview}
            </motion.p>

            {/* Action buttons - Monochromatic styling */}
            <motion.div 
              variants={contentItemVariants}
              className="flex flex-wrap gap-4 mt-2"
            >
              <Button
                onClick={handlePlay}
                className="bg-white hover:bg-white/90 text-gray-900 flex items-center transition-all active:scale-95 hover:scale-105 rounded-none px-6 py-3 group"
                size={isMobile ? "default" : "lg"}
                style={{ minWidth: isMobile ? 120 : 160, minHeight: isMobile ? 44 : 48 }}
                aria-label="Play Now"
              >
                <Play className="h-5 w-5 mr-2 group-hover:translate-x-0.5 transition-transform" />
                <span className="font-medium tracking-wide">Play Now</span>
              </Button>

              <Button
                onClick={handleMoreInfo}
                variant="outline"
                size={isMobile ? "default" : "lg"}
                className="border border-white/40 bg-transparent text-white hover:bg-white/10 hover:border-white flex items-center transition-all active:scale-95 rounded-none px-6 py-3 group"
                style={{ minWidth: isMobile ? 120 : 160, minHeight: isMobile ? 44 : 48 }}
                aria-label="More Info"
              >
                <Info className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium tracking-wide">Details</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced monochromatic pagination indicators with progress animation */}
      {filteredMedia.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:bottom-6 flex space-x-3 z-20">
          {filteredMedia.map((_, index) => (
            <button
              key={index}
              className={`h-[2px] rounded-none transition-all ${
                index === currentIndex
                  ? 'bg-white w-8 pagination-indicator-active'
                  : 'bg-white/30 w-4 hover:bg-white/50'
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

      {/* Previous/Next buttons - Redesigned for monochromatic theme */}
      {filteredMedia.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white p-2 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all hover:bg-white/10 z-20"
            onClick={goToPrev}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white p-2 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all hover:bg-white/10 z-20"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Auto-rotation control - Monochromatic styling */}
      <button
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white p-1.5 flex items-center justify-center z-20 focus:opacity-100 transition-all hover:bg-white/10"
        onClick={toggleAutoRotation}
        aria-label={isAutoRotating ? "Pause auto-rotation" : "Resume auto-rotation"}
      >
        <span className="relative block w-5 h-5">
          {/* AnimatePresence for icon switch */}
          <AnimatePresence initial={false} mode="wait">
            {isAutoRotating ? (
              <motion.span
                key="pause"
                initial={{ opacity: 0, scale: 0.7, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 90 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Pause className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span
                key="play"
                initial={{ opacity: 0, scale: 0.7, rotate: 90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: -90 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Play className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </button>
    </section>
  );
};

export default Hero;
