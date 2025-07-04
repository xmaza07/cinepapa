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
      className="relative flex-none w-[320px] md:w-[380px] aspect-video bg-gray-900 rounded overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-110 hover:z-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.1 }}
      onClick={() => {
        triggerHapticFeedback(25);
        onContinueWatching(item);
      }}
    >
      <img
        src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
        alt={item.title}
        className="w-full h-full object-cover transition-transform group-hover:scale-110 group-hover:brightness-110"
      />
      {/* Netflix-style gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      
      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
        <div 
          className="h-full bg-red-600 transition-all duration-300"
          style={{ width: `${(item.watch_position / item.duration) * 100}%` }}
        />
      </div>
      
      {/* Netflix-style title overlay */}
      <div className="absolute bottom-2 left-3 right-3">
        <h3 className="text-white font-medium text-sm line-clamp-1">{item.title}</h3>
        {item.media_type === 'tv' && (
          <p className="text-gray-300 text-xs">S{item.season} E{item.episode}</p>
        )}
      </div>
      
      {/* Netflix-style play overlay on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
          <Play className="w-6 h-6 text-black fill-current ml-1" />
        </div>
      </div>
    </motion.div>
  );
};

export default ContinueWatchingCard; 