import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Media } from '@/utils/types';
import { backdropSizes } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Play, Info, Star, Calendar } from 'lucide-react';
import Spinner from '@/components/ui/spinner';
import { motion, AnimatePresence } from 'framer-motion';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface HeroProps {
  media: Media[];
  className?: string;
}

const Hero = ({ media, className }: HeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();
  
  const filteredMedia = media.filter(item => item.backdrop_path);
  const featuredMedia = filteredMedia[currentIndex];

  if (!featuredMedia) return null;

  const title = featuredMedia.title || featuredMedia.name || 'Untitled';
  const releaseDate = featuredMedia.release_date || featuredMedia.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';

  const handlePlay = () => {
    const mediaType = featuredMedia.media_type;
    const id = featuredMedia.id;

    if (mediaType === 'tv') {
      navigate(`/player/tv/${id}/1/1`);
    } else {
      navigate(`/player/${mediaType}/${id}`);
    }
  };

  const handleMoreInfo = () => {
    const mediaType = featuredMedia.media_type;
    const id = featuredMedia.id;
    navigate(`/${mediaType}/${id}`);
  };

  return (
    <div className={`relative w-full h-[75vh] md:h-[85vh] overflow-hidden ${className}`}>
      <Carousel
        opts={{
          align: "start",
          loop: true,
          containScroll: false,
          dragFree: true
        }}
        className="w-full h-full"
        setApi={(api) => {
          api?.on("select", () => {
            setCurrentIndex(api.selectedScrollSnap());
            setIsLoaded(false);
          });
        }}
      >
        <CarouselContent>
          {filteredMedia.map((item, index) => (
            <CarouselItem key={item.id} className="relative w-full h-full pl-0">
              <AnimatePresence>
                {!isLoaded && index === currentIndex && (
                  <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background flex items-center justify-center z-10"
                  >
                    <Spinner size="lg" className="text-accent" />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ 
                  opacity: index === currentIndex ? 1 : 0.3, 
                  scale: 1,
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <img
                  src={`${backdropSizes.original}${item.backdrop_path}`}
                  alt={item.title || item.name}
                  className="w-full h-full object-cover"
                  onLoad={() => index === currentIndex && setIsLoaded(true)}
                />
                <div className="absolute inset-0 hero-gradient-enhanced" />
                <div className="absolute inset-0 md:w-1/2 hero-side-gradient" />
              </motion.div>

              {index === currentIndex && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16 flex flex-col items-start max-w-3xl z-10"
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="flex flex-wrap items-center gap-3 mb-4"
                  >
                    <span className="px-3 py-1 rounded-full bg-accent/90 backdrop-blur-sm text-xs font-medium text-white uppercase tracking-wider">
                      {item.media_type === 'movie' ? 'Movie' : 'TV Series'}
                    </span>
                    
                    {releaseYear && (
                      <span className="flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white">
                        <Calendar className="w-3 h-3 mr-1" />
                        {releaseYear}
                      </span>
                    )}
                    
                    {item.vote_average > 0 && (
                      <span className="flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white">
                        <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                        {item.vote_average.toFixed(1)}
                      </span>
                    )}
                  </motion.div>

                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="text-4xl md:text-6xl font-bold text-white mb-3 hero-text-shadow text-balance"
                  >
                    {item.title || item.name}
                  </motion.h1>

                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="text-white/90 mb-8 line-clamp-3 md:line-clamp-3 text-sm md:text-base max-w-2xl hero-text-shadow"
                  >
                    {item.overview}
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
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

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
                setCurrentIndex(index);
                setIsLoaded(false);
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
