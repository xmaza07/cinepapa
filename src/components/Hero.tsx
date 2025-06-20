
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Media } from '@/utils/types';
import { backdropSizes } from '@/utils/api';
import { getImageUrl } from '@/utils/services/tmdb';
import { Button } from '@/components/ui/button';
import { Play, Info, Star, Calendar, Pause, ChevronLeft, ChevronRight, Share2, Heart, Bookmark } from 'lucide-react';
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
  const minSwipeDistance = isMobile ? 15 : 40;
  const touchSensitivity = isMobile ? 1.5 : 1.2;

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart(e.touches[0].clientX);
      setIsSwiping(false);
      setVisualSwipeFeedback(0);
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
      preloadNextImage();
    }, 8000);
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
      scale: 1.05
    },
    animate: { 
      opacity: isLoaded ? 1 : 0,
      scale: isLoaded ? 1 : 1.05,
      transition: { 
        opacity: { duration: 0.8, ease: "easeOut" },
        scale: { duration: 1.2, ease: "easeOut" }
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.4, ease: "easeIn" } 
    }
  };

  const contentVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  if (!filteredMedia.length) return null;
  
  return (
    <section
      ref={carouselRef}
      className="relative w-full min-h-[80vh] overflow-hidden group hero-immersive"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label="Featured media carousel"
      aria-roledescription="carousel"
      style={{
        fontFamily: "'Helvetica Neue', 'Arial', sans-serif"
      }}
    >
      {/* Loading Skeleton */}
      {firstLoad && !isLoaded && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="w-full h-full">
            <Skeleton className="w-full h-full animate-pulse bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900" />
          </div>
        </div>
      )}

      {/* Background Image with Dramatic Overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentIndex}`}
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0"
          style={{
            transform: `translateX(${visualSwipeFeedback * 0.02}px)`
          }}
        >
          {/* Hero Image */}
          <img
            src={getImageUrl(featuredMedia?.backdrop_path, backdropSizes.large)}
            srcSet={buildSrcSet(featuredMedia?.backdrop_path)}
            sizes="100vw"
            alt={title}
            className="w-full h-full object-cover"
            onLoad={() => {
              setIsLoaded(true);
              setFirstLoad(false);
            }}
            loading={currentIndex === 0 ? "eager" : "lazy"}
            fetchPriority={currentIndex === 0 ? "high" : "auto"}
          />

          {/* Dramatic Gradient Overlay - Immersive Design System */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, rgba(10,10,12,0.9) 30%, rgba(10,10,12,0.2) 100%)'
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Hero Content - Immersive Layout */}
      <motion.div 
        className="absolute inset-0 flex flex-col justify-center z-10"
        style={{ padding: '5%' }}
        variants={contentVariants}
        initial="initial"
        animate="animate"
        style={{
          transform: `translateX(${visualSwipeFeedback * 0.01}px)`
        }}
      >
        {/* Metadata Container */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center gap-4 mb-2"
          style={{ fontSize: '1rem', color: '#E0E0E0' }}
        >
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium text-white uppercase tracking-wider">
            {featuredMedia?.media_type === 'movie' ? 'Movie' : 'TV Series'}
          </span>

          {releaseYear && (
            <span className="flex items-center text-sm font-medium text-white/90">
              <Calendar className="w-4 h-4 mr-1.5" />
              {releaseYear}
            </span>
          )}

          {featuredMedia?.vote_average > 0 && (
            <span className="flex items-center text-sm font-medium text-white/90">
              <Star className="w-4 h-4 mr-1.5 fill-yellow-400 text-yellow-400" />
              {featuredMedia?.vote_average.toFixed(1)}
            </span>
          )}
        </motion.div>

        {/* Hero Title - Immersive Typography */}
        <motion.div variants={itemVariants} className="mb-2">
          <h1 
            className="text-white font-black uppercase tracking-wider leading-none"
            style={{
              fontSize: 'clamp(3rem, 10vw, 6rem)',
              fontWeight: '900',
              lineHeight: '1.1',
              letterSpacing: '0.05em'
            }}
          >
            {title}
          </h1>
        </motion.div>

        {/* Subtitle/Overview */}
        <motion.div variants={itemVariants} className="mb-8">
          {featuredMedia?.tagline && (
            <p className="text-white/80 text-lg mb-3 font-medium">
              {featuredMedia.tagline}
            </p>
          )}
          
          <p 
            className="text-white/70 max-w-2xl line-clamp-3 leading-relaxed"
            style={{ fontSize: '1rem' }}
          >
            {featuredMedia?.overview}
          </p>
        </motion.div>

        {/* CTA Container - Immersive Button Design */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center gap-4"
        >
          <Button
            onClick={handlePlay}
            className="bg-white hover:bg-white/85 text-black font-semibold px-7 py-3 rounded-full text-sm transition-all active:scale-95 hover:scale-105 border-[1.5px] border-transparent"
            size="lg"
            aria-label="Watch Now"
          >
            <Play className="h-5 w-5 mr-2 fill-black" />
            <span className="uppercase tracking-wide">Watch Now</span>
          </Button>

          <Button
            onClick={handleMoreInfo}
            variant="outline"
            size="lg"
            className="bg-transparent border-[1.5px] border-white text-white hover:bg-white/10 font-semibold px-7 py-3 rounded-full text-sm transition-all active:scale-95"
            aria-label="More Info"
          >
            <Info className="h-5 w-5 mr-2" />
            <span className="uppercase tracking-wide">More Info</span>
          </Button>
        </motion.div>
      </motion.div>

      {/* Icon Tray - Bottom Right */}
      <div className="absolute bottom-8 right-8 flex items-center gap-6 z-20">
        <button
          className="p-3 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Add to favorites"
        >
          <Heart className="w-6 h-6" />
        </button>
        <button
          className="p-3 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Add to watchlist"
        >
          <Bookmark className="w-6 h-6" />
        </button>
        <button
          className="p-3 rounded-lg bg-black/30 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Share"
        >
          <Share2 className="w-6 h-6" />
        </button>
      </div>

      {/* Thumbnail Rail - Bottom Left */}
      {filteredMedia.length > 1 && (
        <div className="absolute bottom-8 left-8 flex items-center gap-4 z-20">
          {filteredMedia.slice(0, 5).map((item, index) => (
            <button
              key={item.id}
              className={`w-30 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white shadow-lg'
                  : 'border-white/20 hover:border-white/50'
              }`}
              onClick={() => {
                setIsLoaded(false);
                setCurrentIndex(index);
              }}
              aria-label={`View ${item.title || item.name}`}
            >
              <img
                src={getImageUrl(item.backdrop_path, backdropSizes.small)}
                alt={item.title || item.name}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Navigation Controls */}
      {filteredMedia.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white p-3 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all hover:bg-white/10 z-20"
            onClick={goToPrev}
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white p-3 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all hover:bg-white/10 z-20"
            onClick={goToNext}
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Auto-rotation control */}
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white p-2 flex items-center justify-center z-20 transition-all hover:bg-white/10"
        onClick={toggleAutoRotation}
        aria-label={isAutoRotating ? "Pause auto-rotation" : "Resume auto-rotation"}
      >
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
      </button>
    </section>
  );
};

export default Hero;
