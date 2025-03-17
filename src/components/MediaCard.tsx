
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Media } from '@/utils/types';
import { posterSizes } from '@/utils/api';
import { Play, Info } from 'lucide-react';

interface MediaCardProps {
  media: Media;
  featured?: boolean;
}

const MediaCard = ({ media, featured = false }: MediaCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const title = media.title || media.name || 'Untitled';
  const releaseDate = media.release_date || media.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : '';
  
  const mediaType = media.media_type;
  const detailsUrl = `/${mediaType}/${media.id}`;
  const playerUrl = `/player/${mediaType}/${media.id}`;
  
  return (
    <div 
      className={`media-card relative rounded-lg overflow-hidden ${
        featured ? 'aspect-[2/3] h-[350px]' : 'aspect-[2/3]'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-background image-skeleton rounded-lg" />
      )}
      
      {/* Poster image */}
      <img
        src={`${posterSizes.medium}${media.poster_path}`}
        alt={title}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          e.currentTarget.src = '/placeholder.svg';
          setImageLoaded(true);
        }}
      />
      
      {/* Hover overlay */}
      <div 
        className={`absolute inset-0 bg-black/70 flex flex-col justify-between p-4 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="text-white text-sm font-medium">
          <div className="flex items-center justify-between mb-2">
            <span className="px-2 py-1 rounded bg-accent text-xs font-medium">
              {mediaType === 'movie' ? 'Movie' : 'TV'}
            </span>
            {media.vote_average > 0 && (
              <span className="flex items-center text-amber-400 text-xs">
                <span className="mr-1">★</span>
                {media.vote_average.toFixed(1)}
              </span>
            )}
          </div>
          {releaseYear && <div className="text-white/70 text-xs mb-1">{releaseYear}</div>}
        </div>
        
        <div>
          <h3 className="text-white font-bold mb-2 line-clamp-2">{title}</h3>
          <div className="flex space-x-2">
            <Link 
              to={playerUrl}
              className="flex-1 flex items-center justify-center bg-accent hover:bg-accent/80 text-white rounded py-1.5 text-sm font-medium transition-colors"
            >
              <Play className="h-3 w-3 mr-1" />
              Play
            </Link>
            <Link 
              to={detailsUrl}
              className="flex-1 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded py-1.5 text-sm font-medium transition-colors"
            >
              <Info className="h-3 w-3 mr-1" />
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
