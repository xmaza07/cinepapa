import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Media } from '@/utils/types';
import { backdropSizes } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Play, Info, Star, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
  media: Media[];
  className?: string;
}

const Hero = ({ media, className }: HeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const filteredMedia = useMemo(() => 
    media.filter(item => item.backdrop_path), 
    [media]
  );
  
  const featuredMedia = useMemo(() => 
    filteredMedia[currentIndex],
    [filteredMedia, currentIndex]
  );

  const minSwipeDistance = 50;

  const handleImageError = useCallback(() => {
    setError('Failed to load image');
    setIsLoaded(true);
  }, []);

  const handleNavigation = useCallback((direction: 'next' | 'prev') => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsLoaded(false);
      setCurrentIndex(prev => {
        if (direction === 'next') {
          return (prev + 1) % filteredMedia.length;
        } else {
          return (prev - 1 + filteredMedia.length) % filteredMedia.length;
        }
      });
    }, 300);
  }, [filteredMedia.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handleNavigation('prev');
    } else if (e.key === 'ArrowRight') {
      handleNavigation('next');
    }
  }, [handleNavigation]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNavigation('next');
    } else if (isRightSwipe) {
      handleNavigation('prev');
    }

    if (filteredMedia.length > 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      startInterval();
    }
  }, [touchStart, touchEnd, handleNavigation, filteredMedia.length]);

  const startInterval = useCallback(() => {
    if (filteredMedia.length <= 1) return;
    
    intervalRef.current = setInterval(() => {
      handleNavigation('next');
    }, 10000);
  }, [filteredMedia.length, handleNavigation]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.focus();
    }

    if (filteredMedia.length > 1) {
      startInterval();
    }

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [filteredMedia, startInterval, handleKeyDown]);

  useEffect(() => {
    if (isLoaded) {
      setIsTransitioning(false);
    }
  }, [isLoaded]);

  const handleMouseEnter = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    startInterval();
  }, [startInterval]);

  if (!featuredMedia) return null;

  const title = featuredMedia.title || featuredMedia.name || 'Untitled';
  const releaseDate = featuredMedia.release_date || featuredMedia.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';

  const handlePlay = () => {
    const mediaType = featuredMedia.media_type;
    const id = featuredMedia.id;
    navigate(mediaType === 'tv' ? `/watch/tv/${id}/1/1` : `/watch/${mediaType}/${id}`);
  };

  const handleMoreInfo = () => {
    const { media_type: mediaType, id } = featuredMedia;
    navigate(`/${mediaType}/${id}`);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-[75vh] md:h-[85vh] overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      tabIndex={0}
      role="region"
      aria-label="Featured content carousel"
    >
      <AnimatePresence>
        {(!isLoaded || error) && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background flex items-center justify-center z-10"
          >
            {error ? (
              <p className="text-accent">{error}</p>
            ) : (
              <Spinner size="lg" className="text-accent" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0, 
            scale: isLoaded ? 1 : 1.05,
            filter: isTransitioning ? 'blur(8px)' : 'blur(0px)'
          }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={`${backdropSizes.original}${featuredMedia.backdrop_path}`}
            alt={`Backdrop for ${title}`}
            className="w-full h-full object-cover"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
          />

          <div className="absolute inset-0 hero-gradient-enhanced" />
          <div className="absolute inset-0 md:w-1/2 hero-side-gradient" />
        </motion.div>
      </AnimatePresence>

      {filteredMedia.length > 1 && (
        <>
          <button
            onClick={() => handleNavigation('prev')}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleNavigation('next')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: isLoaded && !isTransitioning ? 1 : 0, 
            y: isLoaded && !isTransitioning ? 0 : 20
          }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16 flex flex-col items-start max-w-3xl"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-wrap items-center gap-3 mb-4"
          >
            <span className="px-3 py-1 rounded-full bg-accent/90 backdrop-blur-sm text-xs font-medium text-white uppercase tracking-wider">
              {featuredMedia.media_type === 'movie' ? 'Movie' : 'TV Series'}
            </span>
            
            {releaseYear && (
              <span className="flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white">
                <Calendar className="w-3 h-3 mr-1" />
                {releaseYear}
              </span>
            )}
            
            {featuredMedia.vote_average > 0 && (
              <span className="flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white">
                <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                {featuredMedia.vote_average.toFixed(1)}
              </span>
            )}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-4xl md:text-6xl font-bold text-white mb-3 hero-text-shadow text-balance"
          >
            {title}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-white/90 mb-8 line-clamp-3 md:line-clamp-3 text-sm md:text-base max-w-2xl hero-text-shadow"
          >
            {featuredMedia.overview}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <Button
              onClick={handlePlay}
              className="hero-button bg-accent hover:bg-accent/90 text-white flex items-center transition-all hover:scale-105 shadow-lg shadow-accent/20"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Play Now
            </Button>
            
            <Button
              onClick={handleMoreInfo}
              variant="outline"
              size="lg"
              className="hero-button border-white/30 bg-black/40 text-white hover:bg-black/60 hover:border-white/50 flex items-center transition-all hover:scale-105"
            >
              <Info className="h-4 w-4 mr-2" />
              More Info
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {filteredMedia.length > 1 && (
        <div 
          className="absolute bottom-6 right-6 md:bottom-12 md:right-12 flex space-x-2 z-10"
          role="tablist"
          aria-label="Choose slide to display"
        >
          {filteredMedia.slice(0, 5).map((_, index) => (
            <button
              key={index}
              className={`pagination-indicator h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-accent w-8 pagination-indicator-active'
                  : 'bg-white/30 w-2 hover:bg-white/50'
              }`}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setIsLoaded(false);
                  setCurrentIndex(index);
                }, 300);
              }}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Hero;
