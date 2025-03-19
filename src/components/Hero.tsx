
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Media } from '@/utils/types';
import { backdropSizes } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Play, Info } from 'lucide-react';

interface HeroProps {
  media: Media[];
}

const Hero = ({ media }: HeroProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();
  const featuredMedia = media[currentIndex];

  // Auto-change featured media
  useEffect(() => {
    if (media.length === 0) return;
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsLoaded(false);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % media.length);
      }, 500);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [media]);

  // Reset transitioning state when new image is loaded
  useEffect(() => {
    if (isLoaded) {
      setIsTransitioning(false);
    }
  }, [isLoaded]);

  if (!featuredMedia) return null;
  
  const title = featuredMedia.title || featuredMedia.name || 'Untitled';
  const releaseDate = featuredMedia.release_date || featuredMedia.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';
  
  const handlePlay = () => {
    const mediaType = featuredMedia.media_type;
    const id = featuredMedia.id;
    
    navigate(`/player/${mediaType}/${id}`);
  };
  
  const handleMoreInfo = () => {
    const mediaType = featuredMedia.media_type;
    const id = featuredMedia.id;
    
    navigate(`/${mediaType}/${id}`);
  };

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-background image-skeleton" />
      )}
      
      {/* Background image */}
      <img
        src={`${backdropSizes.original}${featuredMedia.backdrop_path}`}
        alt={title}
        className={`w-full h-full object-cover transition-all duration-1000 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        } ${isTransitioning ? 'opacity-50' : ''}`}
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Content */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16 flex flex-col items-start max-w-3xl transition-all duration-1000 ${
        isLoaded && !isTransitioning ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="flex items-center space-x-3 mb-2 animate-fade-in">
          <span className="px-2 py-1 rounded bg-accent text-xs font-medium text-white uppercase tracking-wider">
            {featuredMedia.media_type === 'movie' ? 'Movie' : 'TV Series'}
          </span>
          {releaseYear && (
            <span className="text-white/80 text-sm">{releaseYear}</span>
          )}
          <span className="flex items-center text-amber-400 text-sm">
            <span className="mr-1">★</span>
            {featuredMedia.vote_average.toFixed(1)}
          </span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 text-balance">
          {title}
        </h1>
        
        <p className="text-white/80 mb-6 line-clamp-2 md:line-clamp-3 text-sm md:text-base">
          {featuredMedia.overview}
        </p>
        
        <div className="flex space-x-4">
          <Button 
            onClick={handlePlay}
            className="bg-accent hover:bg-accent/80 text-white flex items-center transition-transform hover:scale-105"
          >
            <Play className="h-4 w-4 mr-2" />
            Play
          </Button>
          <Button 
            onClick={handleMoreInfo}
            variant="outline" 
            className="border-white/20 bg-black/50 text-white hover:bg-black/70 flex items-center transition-transform hover:scale-105"
          >
            <Info className="h-4 w-4 mr-2" />
            More Info
          </Button>
        </div>
      </div>
      
      {/* Pagination indicators */}
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex space-x-2">
        {media.slice(0, 5).map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-accent w-6' 
                : 'bg-white/40 hover:bg-white/60'
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
    </div>
  );
};

export default Hero;
