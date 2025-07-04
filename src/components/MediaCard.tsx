import React, { useState } from 'react';
import { useWatchHistory } from '@/hooks/watch-history';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { triggerHapticFeedback, triggerSuccessHaptic } from '@/utils/haptic-feedback';
import { Media } from '@/utils/types';
import { backdropSizes, posterSizes } from '@/utils/api';
import { getImageUrl } from '@/utils/services/tmdb';
import { Star, Info, Heart, Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackMediaPreference, trackMediaView } from '@/lib/analytics';
import { NetflixButton } from '@/components/ui/netflix-button';

interface MediaCardProps {
  media: Media;
  className?: string;
  featured?: boolean;
  minimal?: boolean;
  isActive: boolean;
  onCardClick: (id: number | string) => void;
}

/**
 * Netflix-style MediaCard component with 16:9 aspect ratio and hover effects
 * @param {MediaCardProps} props
 */
const MediaCard = React.memo(({ media, className, featured = false, minimal = false, isActive, onCardClick }: MediaCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const { addToFavorites, removeFromFavorites, isInFavorites, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchHistory();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);
  const navigate = useNavigate();

  const handleImageError = () => {
    setImageError(true);
    setImgLoading(false);
  };

  const handleImageLoad = () => {
    setImgLoading(false);
  };

  React.useEffect(() => {
    setIsFavorite(isInFavorites(media.id, media.media_type));
    setIsInMyWatchlist(isInWatchlist(media.id, media.media_type));
  }, [media.id, media.media_type, isInFavorites, isInWatchlist]);

  const mediaId = media.media_id || media.id;

  

  const detailPath = media.media_type === 'movie' 
    ? `/movie/${mediaId}` 
    : `/tv/${mediaId}`;
  const handleClick = async () => {
    // Provide haptic feedback when a card is selected
    triggerHapticFeedback(25);
    
    const detailPath = `/${media.media_type}/${media.id}`;
    // Track the media selection
    await Promise.all([
      trackMediaPreference(media.media_type, 'select'),
      trackMediaView({
        mediaType: media.media_type as 'movie' | 'tv',
        mediaId: media.id.toString(),
        title: media.title || media.name || '',
      })
    ]);
    navigate(detailPath);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Different haptic feedback based on action (add/remove from favorites)
    if (isFavorite) {
      triggerHapticFeedback(20);
      await removeFromFavorites(media.id, media.media_type);
      setIsFavorite(false);
    } else {
      // Special pattern for adding to favorites
      triggerSuccessHaptic();
      await addToFavorites({
        media_id: media.id,
        media_type: media.media_type,
        title: media.title || media.name || '',
        poster_path: media.poster_path,
        backdrop_path: media.backdrop_path,
        overview: media.overview,
        rating: media.vote_average
      });
      setIsFavorite(true);
    }
    await trackMediaPreference(media.media_type as 'movie' | 'tv', 'favorite');
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isInMyWatchlist) {
      triggerHapticFeedback(20);
      await removeFromWatchlist(media.id, media.media_type);
      setIsInMyWatchlist(false);
    } else {
      triggerSuccessHaptic();
      await addToWatchlist({
        media_id: media.id,
        media_type: media.media_type,
        title: media.title || media.name || '',
        poster_path: media.poster_path,
        backdrop_path: media.backdrop_path,
        overview: media.overview,
        rating: media.vote_average
      });
      setIsInMyWatchlist(true);
    }
  };

  // Netflix-style play handler
  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    triggerHapticFeedback(25);
    
    if (media.media_type === 'tv') {
      navigate(`/watch/tv/${media.id}/1/1`);
    } else {
      navigate(`/watch/${media.media_type}/${media.id}`);
    }
  };

  // Netflix match percentage (mock for now)
  const matchPercentage = Math.floor(Math.random() * 40) + 60; // 60-99%
  
  const title = media.title || media.name || 'Untitled';
  const releaseYear = (media.release_date || media.first_air_date)?.substring(0, 4);

  // Netflix-style hover delay

  // Touch support: tap to toggle info panel on mobile
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const handleMouseEnter = () => {
    if (isTouchDevice) return;
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const timeout = setTimeout(() => {
      setIsHovered(true);
    }, 500); // 500ms delay like Netflix
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsHovered(false);
  };

  // On touch, tap toggles info panel
  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsHovered((prev) => !prev);
  };

  if (minimal) {
    return (
      <Link
        to={detailPath}
        className={cn("block h-full", className)}
        aria-label={`View details for ${media.title || media.name}`}
      >
        <div className="relative h-full rounded-md overflow-hidden shadow-md">
          {imgLoading && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse" aria-hidden="true" />
          )}
          <img
            src={imageError ? '/placeholder.svg' : getImageUrl(media.poster_path, posterSizes.medium) || '/placeholder.svg'}
            alt={media.title || media.name || 'Media Poster'}
            className={cn("object-cover w-full h-full", imgLoading ? "opacity-0" : "opacity-100")}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{
        scale: 1.10,
        zIndex: 50,
      }}
      animate={isActive ? {
        scale: 1.10,
        zIndex: 50,
      } : {}}
      className={cn(
        "group/card relative cursor-pointer transition-all duration-300 ease-out",
        "hover:z-50",
        className
      )}
      style={{ borderColor: 'transparent', borderWidth: 2, borderStyle: 'solid' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleTouchEnd}
      onClick={() => onCardClick(media.id)}
    >
      <motion.div
        layout
        className="relative overflow-hidden rounded bg-gray-900 shadow-lg"
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={isActive ? handleClick : undefined}
      >
        {/* Netflix 16:9 aspect ratio container */}
        <div className="relative aspect-video w-full">
          {imgLoading && (
            <div className="absolute inset-0 bg-gray-800 animate-pulse" />
          )}
          <img
            src={imageError ? '/placeholder.svg' : getImageUrl(media.backdrop_path, backdropSizes.medium) || '/placeholder.svg'}
            alt={title}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              imgLoading ? "opacity-0" : "opacity-100"
            )}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
          {/* Netflix-style gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {/* Show title at the bottom when not hovered/active, and always show on mobile when info panel is open */}
          {(!(isHovered || isActive) || (isHovered || isActive && window.innerWidth < 768)) && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1 z-50">
              <span className="block text-xs md:text-sm text-white font-bold truncate text-center drop-shadow-lg" style={{
                textShadow: '0 2px 8px #000, 0 0px 2px #000',
              }}>{title}</span>
            </div>
          )}
        </div>

        {/* Glassmorphism hover info panel */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{
            opacity: isHovered || isActive ? 1 : 0,
            y: isHovered || isActive ? 0 : '100%',
            scale: isHovered || isActive ? 1.05 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 28,
            duration: 0.35,
            ease: 'backOut',
          }}
          className={cn(
            "absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-lg border-t border-white/20 p-4 space-y-3 shadow-2xl",
            "md:rounded-b-lg md:inset-x-0 md:bottom-0 md:top-auto md:h-auto md:w-auto",
            "rounded-b-lg",
            "!h-full !w-full !top-0 !left-0 !right-0 !bottom-0 z-50 flex flex-col justify-end md:static md:flex-none md:justify-normal",
            !(isHovered || isActive) && "pointer-events-none",
          )}
          style={{
            ...(isHovered || isActive ? {
              // On small screens, make the info panel cover the card
              borderRadius: window.innerWidth < 768 ? 12 : undefined,
            } : {}),
          }}
        >
            {/* Match percentage and year */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-400 font-bold">{matchPercentage}% Match</span>
              {releaseYear && <span className="text-gray-300">{releaseYear}</span>}
            </div>
            {/* Title */}
            <h3 className="text-white font-bold text-base line-clamp-1">{title}</h3>
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePlay}
                  className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  aria-label="Play"
                >
                  <Play className="w-5 h-5 text-black fill-current" />
                </button>
                <button
                  onClick={handleWatchlistClick}
                  className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label={isInMyWatchlist ? "Remove from list" : "Add to list"}
                >
                  <Plus className={cn("w-5 h-5 text-white transition-transform", isInMyWatchlist && "rotate-45")} />
                </button>
                <button
                  onClick={handleFavoriteClick}
                  className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <ThumbsUp className={cn("w-5 h-5 transition-colors", isFavorite ? "text-white" : "text-gray-300")} />
                </button>
              </div>
              <Link
                to={`/${media.media_type}/${media.id}`}
                className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="More info"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </Link>
            </div>
            {/* Genres/Rating */}
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span>{media.media_type === 'movie' ? 'Movie' : 'Series'}</span>
              {media.vote_average > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{media.vote_average.toFixed(1)}</span>
                </div>
              )}
            </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
});

export default MediaCard;
