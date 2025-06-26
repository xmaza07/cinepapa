import { Play, Calendar, Star, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { backdropSizes } from '@/utils/api';
import { Episode, Season } from '@/utils/types';
import { format } from 'date-fns';
import { getImageUrl } from '@/utils/services/tmdb';
import { useState, useEffect, useRef, useCallback } from 'react';

interface TVShowEpisodesProps {
  seasons: Season[];
  episodes: Episode[];
  selectedSeason: number;
  onSeasonChange: (season: number) => void;
  onPlayEpisode: (seasonNumber: number, episodeNumber: number) => void;
}

// A throttle function to prevent too many scroll events
type ThrottleableFunction = (...args: unknown[]) => unknown;

const throttle = <T extends ThrottleableFunction>(func: T, delay: number): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return undefined;
    }
    lastCall = now;
    return func(...args) as ReturnType<T>;
  };
};

export const TVShowEpisodes = ({
  seasons,
  episodes,
  selectedSeason,
  onSeasonChange,
  onPlayEpisode
}: TVShowEpisodesProps) => {
  // Track watched episodes progress
  const [watchProgress, setWatchProgress] = useState<Record<number, number>>({});
  // For scrollable season selector
  const seasonSelectorRef = useRef<HTMLDivElement>(null);
  // For tracking touch/drag events
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // Get filtered seasons (only numbered seasons > 0)
  const filteredSeasons = seasons.filter(season => season.season_number > 0);
  
  // Track if we're showing all seasons or need scrolling
  const showAllSeasons = filteredSeasons.length <= 7;
  
  // Get current season's episode count - memoize this value to prevent recalculations
  const currentSeason = seasons.find(s => s.season_number === selectedSeason);
  const currentSeasonEpisodeCount = currentSeason?.episode_count || 0;
  
  // Simulate watched progress - replace with your actual implementation later
  useEffect(() => {
    // This is mock data - in a real app, you would load this from your user's watch history
    const progress: Record<number, number> = {};
    
    // Only calculate watch progress if we have valid data to work with
    if (currentSeasonEpisodeCount > 0) {
      filteredSeasons.forEach(season => {
        if (season.season_number < selectedSeason) {
          // Assume previous seasons are 100% watched
          progress[season.season_number] = 100;
        } else if (season.season_number === selectedSeason) {
          // Progress for current season based on episodes
          const calculatedProgress = Math.floor((episodes.length / currentSeasonEpisodeCount) * 100);
          progress[season.season_number] = calculatedProgress > 0 ? calculatedProgress : 0;
        } else {
          // Future seasons are 0% watched
          progress[season.season_number] = 0;
        }
      });
      
      // Compare with previous state to avoid unnecessary updates
      let shouldUpdate = false;
      for (const season of filteredSeasons) {
        if (watchProgress[season.season_number] !== progress[season.season_number]) {
          shouldUpdate = true;
          break;
        }
      }
      
      if (shouldUpdate) {
        setWatchProgress(progress);
      }
    }
  }, [filteredSeasons, selectedSeason, episodes.length, currentSeasonEpisodeCount, watchProgress]);
  
  // Handle scrolling for the season selector
  const scrollSeasons = (direction: 'left' | 'right') => {
    if (!seasonSelectorRef.current) return;
    
    const container = seasonSelectorRef.current;
    const cardWidth = 180; // Width of each season card
    const cardMargin = 12; // Approximate margin between cards (gap-3 = 12px)
    const containerWidth = container.clientWidth;
    
    // Calculate how many cards are visible at once (typically 2-3 on medium screens)
    const visibleCards = Math.floor(containerWidth / (cardWidth + cardMargin));
    
    // Find the current scroll position
    const currentScroll = container.scrollLeft;
    
    // Calculate the target scroll position based on card width and direction
    let targetScroll;
    if (direction === 'left') {
      // Scroll back one card (or a page width if visibleCards > 1)
      targetScroll = currentScroll - (visibleCards > 1 ? containerWidth : cardWidth + cardMargin);
    } else {
      // Scroll forward one card (or a page width if visibleCards > 1)
      targetScroll = currentScroll + (visibleCards > 1 ? containerWidth : cardWidth + cardMargin);
    }
    
    // Scroll to the target position
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
  };
  
  // Scroll selected season into view when it changes
  useEffect(() => {
    if (showAllSeasons || !seasonSelectorRef.current) return;
    
    // Find the button for the selected season
    const selectedButton = seasonSelectorRef.current.querySelector(`[data-season="${selectedSeason}"]`);
    if (selectedButton) {
      // Use the scrollIntoView API for smooth centering
      selectedButton.scrollIntoView({
        behavior: 'smooth', 
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedSeason, showAllSeasons]);
  
  // Touch/Mouse event handlers for smooth drag scrolling
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (showAllSeasons || !seasonSelectorRef.current) return;
    
    setIsDragging(true);
    setStartX(e.pageX - seasonSelectorRef.current.offsetLeft);
    setScrollLeft(seasonSelectorRef.current.scrollLeft);
  }, [showAllSeasons]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !seasonSelectorRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - seasonSelectorRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-speed multiplier
    seasonSelectorRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);
  
  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (showAllSeasons || !seasonSelectorRef.current) return;
    
    setIsDragging(true);
    setStartX(e.touches[0].clientX - seasonSelectorRef.current.offsetLeft);
    setScrollLeft(seasonSelectorRef.current.scrollLeft);
  }, [showAllSeasons]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !seasonSelectorRef.current) return;
    
    const x = e.touches[0].clientX - seasonSelectorRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    seasonSelectorRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);
  
  // Register scroll snap after scrolling stops
  useEffect(() => {
    if (showAllSeasons || !seasonSelectorRef.current) return;
    
    const scrollContainer = seasonSelectorRef.current;
    let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
    
    const handleScrollEnd = throttle(() => {
      // Find the nearest snap point
      const scrollLeft = scrollContainer.scrollLeft;
      const cardWidth = 180 + 12; // Card width + gap
      const cardIndex = Math.round(scrollLeft / cardWidth);
      const targetScroll = cardIndex * cardWidth;
      
      // Only snap if we're not too far from the target
      if (Math.abs(scrollLeft - targetScroll) < cardWidth / 3) {
        scrollContainer.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    }, 150);
    
    // Use scroll event with timeout for better browser compatibility
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(handleScrollEnd, 150);
    };
    
    // Try to use scrollend if supported, fallback to scroll + timeout
    try {
      scrollContainer.addEventListener('scrollend', handleScrollEnd);
    } catch (e) {
      // scrollend not supported, use scroll with timeout instead
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      try {
        scrollContainer.removeEventListener('scrollend', handleScrollEnd);
      } catch (e) {
        // Ignore error if scrollend is not supported
      }
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [showAllSeasons]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Seasons & Episodes</h2>
        <div className="text-sm text-white/90 px-3 py-1 bg-black/30 rounded-full border border-white/10">
          {episodes.length} episodes
        </div>
      </div>
      
      <div className="relative mb-8 bg-black/40 backdrop-blur-sm rounded-lg p-4 border border-white/5 shadow-lg">
        <div className="text-sm text-white font-medium mb-4">Select Season:</div>
        
        {/* Season selector - Horizontal layout */}
        <div className="relative">
          {/* Scroll buttons - only shown when seasons > 7 */}
          {!showAllSeasons && (
            <>
              <button 
                onClick={() => scrollSeasons('left')}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-black/50 hover:bg-accent/80 text-white/80 hover:text-white transition-colors shadow-md"
                aria-label="Previous seasons"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => scrollSeasons('right')}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-black/50 hover:bg-accent/80 text-white/80 hover:text-white transition-colors shadow-md"
                aria-label="Next seasons"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          
          {/* Horizontal season list */}
          <div 
            ref={seasonSelectorRef}
            className={`flex gap-3 ${showAllSeasons ? 'flex-wrap justify-center' : 'overflow-x-auto pb-3 pt-1 scrollbar-hide scroll-smooth'} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              scrollSnapType: showAllSeasons ? 'none' : 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              userSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleMouseUp}
            onTouchMove={handleTouchMove}
          >
            {filteredSeasons.map((season) => {
              const progress = watchProgress[season.season_number] || 0;
              const isActive = selectedSeason === season.season_number;
              
              return (
                <button
                  key={season.id}
                  data-season={season.season_number}
                  onClick={() => onSeasonChange(season.season_number)}
                  className={`flex-shrink-0 flex flex-col items-center rounded-lg shadow-md overflow-hidden transition-all ${isActive 
                    ? 'ring-1 ring-accent/80 bg-black/60 transform scale-[1.02]' 
                    : 'bg-black/50 hover:bg-black/70 hover:scale-[1.02]'} ${showAllSeasons ? 'w-[120px]' : 'w-[180px]'}`}
                  style={{ scrollSnapAlign: showAllSeasons ? 'none' : 'center' }}
                  aria-pressed={isActive}
                >
                  <div className="w-full bg-black/60 border-b border-white/5 py-1.5 px-3 text-center">
                    <span className="text-sm font-medium text-white/90">
                      Season {season.season_number}
                    </span>
                  </div>
                  
                  <div className="p-3 flex flex-col items-center w-full">
                    <div className={`relative w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isActive 
                      ? 'bg-accent ring-1 ring-white/20' 
                      : progress === 100 
                        ? 'bg-green-500/90' 
                        : progress > 0 
                          ? 'bg-amber-500/90' 
                          : 'bg-black/40 border border-white/10'}`}
                    >
                      {progress === 100 ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white text-sm font-medium">{season.season_number}</span>
                      )}
                      
                      {/* Progress circle for in-progress seasons */}
                      {progress > 0 && progress < 100 && (
                        <svg viewBox="0 0 36 36" className="absolute inset-0 w-10 h-10 -rotate-90">
                          <circle
                            cx="18"
                            cy="18"
                            r="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={`${progress}, 100`}
                            className="text-white/50"
                          />
                        </svg>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <span className="text-xs text-white/70 block">{season.episode_count || 0} {season.episode_count === 1 ? 'episode' : 'episodes'}</span>
                      
                      {progress > 0 && progress < 100 && (
                        <span className="text-xs bg-black/50 border border-white/10 rounded-full px-2 py-0.5 inline-block mt-1 text-white/90">
                          {progress}% watched
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Season information */}
        {filteredSeasons.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/10 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">Season {selectedSeason}</span>
              {watchProgress[selectedSeason] > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent/80 text-xs text-white">
                  {watchProgress[selectedSeason]}% watched
                </span>
              )}
            </div>
            {
              // Display season air date or overview if available
              filteredSeasons.find(s => s.season_number === selectedSeason)?.overview && (
                <p className="mt-2">
                  {filteredSeasons.find(s => s.season_number === selectedSeason)?.overview}
                </p>
              )
            }
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-medium text-white mb-4">Episodes</h3>
        
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {episodes.length > 0 ? (
          episodes.map(episode => (
            <div key={episode.id} className="bg-black/50 backdrop-blur-sm border border-white/5 overflow-hidden rounded-lg flex flex-col h-full shadow-md">
              <div className="relative">
                {episode.still_path ? (
                  <img 
                    src={getImageUrl(episode.still_path, backdropSizes.small)} 
                    alt={`${episode.name} still`}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-black/60 flex items-center justify-center">
                    <span className="text-white/30">No image available</span>
                  </div>
                )}
                
                <div className="absolute top-2 right-2 bg-black/70 border border-white/10 rounded-full px-2 py-1 text-xs font-medium text-white/90">
                  Episode {episode.episode_number}
                </div>
                
                {episode.vote_average > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 border border-white/10 rounded-full px-2 py-1 flex items-center text-amber-400 text-xs">
                    <Star className="h-3 w-3 mr-1 fill-amber-400" />
                    {episode.vote_average.toFixed(1)}
                  </div>
                )}
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-white font-medium text-lg mb-1">
                    {episode.name}
                  </h3>
                  
                  {episode.air_date && (
                    <div className="flex items-center text-white/60 text-xs mb-3">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(episode.air_date)}
                    </div>
                  )}
                  
                  <p className="text-white/70 text-sm mb-3 line-clamp-3">{episode.overview || "No overview available."}</p>
                </div>
                
                <Button 
                  onClick={() => onPlayEpisode(episode.season_number, episode.episode_number)}
                  size="sm"
                  className="bg-accent hover:bg-accent/80 text-white flex items-center w-full justify-center shadow-sm"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Play Episode
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-white/80 col-span-2 bg-black/50 backdrop-blur-sm border border-white/5 rounded-lg shadow-md">
            <p>No episodes available for Season {selectedSeason}.</p>
            {filteredSeasons.length > 0 && selectedSeason !== filteredSeasons[0].season_number && (
              <Button 
                variant="outline" 
                onClick={() => onSeasonChange(filteredSeasons[0].season_number)}
                className="mt-3 border-white/10 text-white/90 hover:bg-accent/10 hover:border-accent/20"
              >
                View Season {filteredSeasons[0].season_number}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TVShowEpisodes;
