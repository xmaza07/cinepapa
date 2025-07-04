import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { triggerHapticFeedback } from '@/utils/haptic-feedback';
import { useNavigate } from 'react-router-dom';
import { Media } from '@/utils/types';
import { backdropSizes } from '@/utils/api';
import { getImageUrl } from '@/utils/services/tmdb';
import { NetflixButton } from '@/components/ui/netflix-button';
import { Play, Info, Star, ChevronLeft, ChevronRight, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaPreferences } from '@/hooks/use-media-preferences';
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
  const { preference } = useMediaPreferences();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Filter and prioritize media based on user preferences
  const filteredMedia = useMemo(() => {
    const withBackdrop = media.filter(item => item.backdrop_path);
    
    // If user has a preference, prioritize that content type
    if (preference && preference !== 'balanced') {
      const preferred = withBackdrop.filter(item => item.media_type === preference);
      const others = withBackdrop.filter(item => item.media_type !== preference);
      return [...preferred, ...others];
    }
    
    return withBackdrop;
  }, [media, preference]);
  
  const featuredMedia = filteredMedia[currentIndex] as ExtendedMedia;

  // Preload the featured image
  useEffect(() => {
    if (featuredMedia?.backdrop_path) {
      const img = new window.Image();
      img.src = getImageUrl(featuredMedia.backdrop_path, backdropSizes.large);
      img.onload = () => setIsLoaded(true);
    }
  }, [featuredMedia]);

  // Navigation functions
  const goToNext = useCallback(() => {
    triggerHapticFeedback(15);
    setIsLoaded(false);
    setCurrentIndex((prev) => (prev + 1) % filteredMedia.length);
  }, [filteredMedia.length]);

  const goToPrev = useCallback(() => {
    triggerHapticFeedback(15);
    setIsLoaded(false);
    setCurrentIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length);
  }, [filteredMedia.length]);

  // Auto rotation management
  const startAutoRotation = useCallback(() => {
    if (filteredMedia.length <= 1) return;
    intervalRef.current = setInterval(() => {
      goToNext();
    }, 8000); // 8 seconds per slide
  }, [filteredMedia.length, goToNext]);

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

  const toggleAutoRotation = () => {
    triggerHapticFeedback(20);
    if (isAutoRotating) {
      pauseAutoRotation();
    } else {
      restartAutoRotation();
    }
    setIsAutoRotating(!isAutoRotating);
  };

  // Touch handling for swipes
  const minSwipeDistance = isMobile ? 50 : 100;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.touches[0].clientX);
    pauseAutoRotation();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

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

  // Keyboard navigation
  useKeyPress("ArrowRight", goToNext);
  useKeyPress("ArrowLeft", goToPrev);
  useKeyPress("Space", toggleAutoRotation);

  // Initialize and clean up auto rotation
  useEffect(() => {
    if (isAutoRotating) {
      startAutoRotation();
    }
    return pauseAutoRotation;
  }, [startAutoRotation, isAutoRotating]);

  // Basic media information
  const title = featuredMedia?.title || featuredMedia?.name || 'Untitled';
  const releaseDate = featuredMedia?.release_date || featuredMedia?.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';

  // Netflix-style action handlers
  const handlePlay = () => {
    triggerHapticFeedback(25);
    const mediaType = featuredMedia?.media_type;
    const id = featuredMedia?.id;

    if (mediaType === 'tv') {
      navigate(`/watch/tv/${id}/1/1`);
    } else {
      navigate(`/watch/${mediaType}/${id}`);
    }
  };

  const handleMoreInfo = () => {
    triggerHapticFeedback(20);
    navigate(`/${featuredMedia?.media_type}/${featuredMedia?.id}`);
  };

  if (!filteredMedia.length) return null;

  return (
    <section 
      className="relative w-full h-screen overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${currentIndex}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: isLoaded ? 1 : 0, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ willChange: 'transform, opacity' }}
            className="w-full h-full"
          >
            <img
              src={getImageUrl(featuredMedia.backdrop_path, backdropSizes.original)}
              alt={title}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Netflix-style gradient overlay - stronger on the left */}
        <div className="absolute inset-0 netflix-gradient-left" />
        <div className="absolute inset-0 netflix-gradient-bottom" />
      </div>

      {/* Content - Netflix style left-aligned */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-12 w-full">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-lg lg:max-w-xl"
          >
            {/* Category and Year */}
            <div className="flex items-center space-x-4 mb-4">
              <span className="text-red-600 font-bold text-sm uppercase tracking-wider">
                {featuredMedia.media_type === 'movie' ? 'Film' : 'Series'}
              </span>
              {releaseYear && (
                <span className="text-gray-300 text-sm">
                  {releaseYear}
                </span>
              )}
              {featuredMedia.vote_average > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-gray-300 text-sm">
                    {featuredMedia.vote_average.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {title}
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-white mb-8 line-clamp-3 leading-relaxed max-w-md lg:max-w-lg">
              {featuredMedia.overview}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <NetflixButton
                variant="primary"
                size="lg"
                onClick={handlePlay}
                className="shadow-lg"
              >
                <Play className="w-6 h-6 fill-current" />
                Play
              </NetflixButton>
              
              <NetflixButton
                variant="info"
                size="lg"
                onClick={handleMoreInfo}
              >
                <Info className="w-6 h-6" />
                More Info
              </NetflixButton>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Side navigation arrows */}
      {filteredMedia.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute top-1/2 left-4 md:left-6 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 flex items-center justify-center transition-all z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-4 md:right-6 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 flex items-center justify-center transition-all z-20"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}
      
      {/* Progress indicators */}
      {filteredMedia.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {filteredMedia.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                triggerHapticFeedback(10);
                setCurrentIndex(index);
                setIsLoaded(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Auto-rotation control */}
      {filteredMedia.length > 1 && (
        <button
          onClick={toggleAutoRotation}
          className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 flex items-center justify-center transition-all z-20"
          aria-label={isAutoRotating ? "Pause auto-rotation" : "Resume auto-rotation"}
        >
          {isAutoRotating ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </button>
      )}

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}
    </section>
  );
};

export default Hero;
