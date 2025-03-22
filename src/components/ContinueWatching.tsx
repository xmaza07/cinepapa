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
      // Filter items that are not complete (less than 90% watched)
      const incomplete = watchHistory
        .filter(item => (item.watch_position / item.duration) < 0.9)
        .sort((a, b) => new Date(b.last_watched).getTime() - new Date(a.last_watched).getTime())
        .slice(0, maxItems);
      
      setContinuableItems(incomplete);
    }
  }, [watchHistory, maxItems]);
  
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
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {continuableItems.map((item) => (
          <motion.div
            key={`${item.media_type}-${item.media_id}-${item.season}-${item.episode}`}
            className="glass rounded-lg overflow-hidden hover:bg-white/10 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
          >
            <div 
              className="w-full aspect-video bg-cover bg-center relative"
              style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w780${item.backdrop_path})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-medium line-clamp-1 mb-1">{item.title}</h3>
                <div className="flex items-center justify-between text-xs text-white/70 mb-2">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(item.last_watched), { addSuffix: true })}
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
                  onClick={() => handleContinueWatching(item)}
                  className="w-full bg-accent hover:bg-accent/80 text-white flex items-center justify-center gap-1"
                  size="sm"
                >
                  <Play className="h-4 w-4" />
                  Continue
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default ContinueWatching;
