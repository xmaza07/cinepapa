import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Media } from '@/utils/types';
import { backdropSizes } from '@/utils/api';
import { getImageUrl } from '@/utils/services/tmdb';
import { Button } from '@/components/ui/button';
import { Play, Info, Star, Calendar } from 'lucide-react';
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
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const filteredMedia = useMemo(() => 
    media.filter(item => item.backdrop_path), 
    [media]
  );
  
  const featuredMedia = filteredMedia[currentIndex];

  // Required minimum distance between touch start and touch end to be detected as swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsLoaded(false);
        if (isLeftSwipe) {
          setCurrentIndex((prev) => (prev + 1) % filteredMedia.length);
        } else if (isRightSwipe) {
          setCurrentIndex((prev) => (prev - 1 + filteredMedia.length) % filteredMedia.length);
        }
      }, 300);
    }

    // Restart the interval after touch end
    if (filteredMedia.length > 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      startInterval();
    }
  };

  const startInterval = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsLoaded(false);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredMedia.length);
      }, 500);
    }, 10000);
  }, [filteredMedia.length]);

  useEffect(() => {
    if (filteredMedia.length <= 1) return;
    startInterval();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [filteredMedia, startInterval]);

  useEffect(() => {
    if (isLoaded) {
      setIsTransitioning(false);
    }
  }, [isLoaded]);

  const handleMouseEnter = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (filteredMedia.length <= 1) return;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsLoaded(false);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredMedia.length);
      }, 500);
    }, 10000);
  };

  if (!featuredMedia) return null;

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
    const mediaType = featuredMedia.media_type;
    const id = featuredMedia.id;

    navigate(`/${mediaType}/${id}`);
  };

  return (
    <div 
      className={`relative w-full h-[75vh] md:h-[85vh] overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background flex items-center justify-center z-10"
          >
            <Spinner size="lg" className="text-accent" />
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
        >          <img
            src={getImageUrl(featuredMedia.backdrop_path, backdropSizes.original)}
            alt={title}
            className="w-full h-full object-cover"
            onLoad={() => setIsLoaded(true)}
          />

          <div className="absolute inset-0 hero-gradient-enhanced" />
          <div className="absolute inset-0 md:w-1/2 hero-side-gradient" />
        </motion.div>
      </AnimatePresence>

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
        <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 flex space-x-2 z-10">
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
              aria-label={`View featured item ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Hero;
