import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks';
import { useWatchHistory } from '@/hooks/watch-history';
import { WatchHistoryItem } from '@/contexts/types/watch-history';
import { Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

interface ContinueWatchingProps {
  maxItems?: number;
}

const ContinueWatching = ({ maxItems = 5 }: ContinueWatchingProps) => {
  const { user } = useAuth();
  const { watchHistory } = useWatchHistory();
  const [continuableItems, setContinuableItems] = useState<WatchHistoryItem[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (watchHistory.length > 0) {
      // Filter items that are not complete (less than 90% watched) and have valid dates
      const incomplete = watchHistory
        .filter(item => {
          // Ensure item has valid created_at and progress values
          if (!item.created_at || !item.duration || !item.watch_position) return false;
          try {
            const date = new Date(item.created_at);
            if (isNaN(date.getTime())) return false;
          } catch {
            return false;
          }
          return (item.watch_position / item.duration) < 0.9;
        })
        .sort((a, b) => {
          try {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return dateB.getTime() - dateA.getTime();
          } catch {
            return 0;
          }
        })
        .slice(0, maxItems);
      
      setContinuableItems(incomplete);
    }
  }, [watchHistory, maxItems]);
  
  const formatLastWatched = (dateString: string) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      // Return 'Recently' for invalid dates or dates in the future
      if (isNaN(date.getTime()) || date > new Date()) {
        return 'Recently';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  if (!user || continuableItems.length === 0) {
    return null;
  }
  
  const handleContinueWatching = (item: WatchHistoryItem) => {
    if (item.media_type === 'movie') {
      navigate(`/player/${item.media_type}/${item.media_id}`);
    } else if (item.media_type === 'tv') {
      navigate(`/player/${item.media_type}/${item.media_id}/${item.season}/${item.episode}`);
    }
  };
  
  return (
    <div className="px-4 md:px-8 mt-8 mb-6">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Continue Watching</h2>
      
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {continuableItems.map((item) => (
          <motion.div
            key={`${item.media_id}-${item.season}-${item.episode}`}
            className="relative aspect-video bg-card rounded-lg overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleContinueWatching(item)}
          >
            <img
              src={`https://image.tmdb.org/t/p/w500${item.backdrop_path}`}
              alt={item.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white font-medium line-clamp-1 mb-1">{item.title}</h3>
              <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatLastWatched(item.created_at)}
                </span>
                
                {item.media_type === 'tv' && (
                  <span>S{item.season} E{item.episode}</span>
                )}
              </div>
              
              <Progress 
                value={(item.watch_position / item.duration) * 100} 
                className="h-1 mb-3" 
              />
              
              <Button 
                className="w-full bg-accent hover:bg-accent/80 text-white flex items-center justify-center gap-1"
                size="sm"
              >
                <Play className="h-3 w-3" />
                Continue
              </Button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ContinueWatching;
