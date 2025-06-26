import { motion } from 'framer-motion';
import { triggerHapticFeedback } from '@/utils/haptic-feedback';
import { Play, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WatchHistoryItem } from '@/contexts/types/watch-history';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';

interface ContinueWatchingCardProps {
  item: WatchHistoryItem;
  onContinueWatching: (item: WatchHistoryItem) => void;
  onNavigateToDetails: (event: React.MouseEvent, item: WatchHistoryItem) => void;
}

const formatLastWatched = (dateString: string) => {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime()) || date > new Date()) {
      return 'Recently';
    }
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Recently';
  }
};

const formatTimeRemaining = (position: number, duration: number) => {
  if (!duration) return '';
  const remaining = Math.max(0, duration - position);
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
};

const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ item, onContinueWatching, onNavigateToDetails }) => {
  return (
    <motion.div
      className="relative flex-none w-[280px] md:w-[300px] aspect-video bg-card rounded-xl overflow-hidden group cursor-pointer hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 border border-transparent hover:border-accent/70"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => {
        triggerHapticFeedback(25); // Stronger feedback for main action
        onContinueWatching(item);
      }}
      style={{
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
      }}
    >
      <img
        src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
        alt={item.title}
        className="w-full h-full object-cover transition-transform group-hover:scale-110 group-hover:brightness-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-sm" />
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-white font-semibold line-clamp-1 text-base md:text-lg drop-shadow-sm">{item.title}</h3>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-black/30 hover:bg-accent/80 transition-colors -mt-1"
                  onClick={e => {
                    triggerHapticFeedback(15); // Light feedback for info button
                    onNavigateToDetails(e, item);
                  }}
                >
                  <Info className="h-3.5 w-3.5 text-white" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>View details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center justify-between text-xs text-white/70 mb-2">
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatLastWatched(item.created_at)}
          </span>
          {item.media_type === 'tv' && (
            <span>S{item.season} E{item.episode}</span>
          )}
        </div>
        <div className="mb-3 relative">
          <Progress
            value={(item.watch_position / item.duration) * 100}
            className="h-1.5 bg-white/10 rounded-full"
          />
          <div className="text-xs text-white/70 mt-1 text-right">
            {formatTimeRemaining(item.watch_position, item.duration)}
          </div>
        </div>
        <Button
          className="w-full bg-gradient-to-r from-accent to-accent/80 hover:from-accent/80 hover:to-accent/60 text-white flex items-center justify-center gap-1 shadow-lg transition-all duration-200"
          size="sm"
        >
          <Play className="h-3 w-3" />
          Continue
        </Button>
      </div>
    </motion.div>
  );
};

export default ContinueWatchingCard; 