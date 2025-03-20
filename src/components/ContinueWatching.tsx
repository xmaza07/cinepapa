
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WatchHistoryItem, useWatchHistory } from '@/hooks/use-watch-history';
import { posterSizes } from '@/utils/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Play, X, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

const ContinueWatching = () => {
  const [continueItems, setContinueItems] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { getContinueWatching } = useWatchHistory();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchContinueWatching = async () => {
      if (!user) {
        setContinueItems([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getContinueWatching();
        // Use type assertion to ensure types match
        setContinueItems(data as WatchHistoryItem[]);
      } catch (error) {
        console.error('Error fetching continue watching:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContinueWatching();
  }, [user, getContinueWatching]);

  if (!user || continueItems.length === 0) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = (item: WatchHistoryItem) => {
    if (!item.duration) return 0;
    return (item.watch_position / item.duration) * 100;
  };

  const getPlaybackLink = (item: WatchHistoryItem) => {
    if (item.media_type === 'movie') {
      return `/player/movie/${item.media_id}`;
    } else {
      return `/player/tv/${item.media_id}/${item.season}/${item.episode}`;
    }
  };

  const getDetailsLink = (item: WatchHistoryItem) => {
    return `/${item.media_type}/${item.media_id}`;
  };

  const removeFromHistory = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setContinueItems(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: 'Removed from continue watching',
        description: 'The item has been removed from your continue watching list.',
      });
    } catch (error: any) {
      console.error('Error removing item from history:', error);
      toast({
        title: 'Error removing item',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handlePlay = (item: WatchHistoryItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(getPlaybackLink(item));
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h2 className="text-xl font-bold text-white mb-4">Continue Watching</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64 rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-700" />
              <div className="p-2">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <h2 className="text-xl font-bold text-white mb-4">Continue Watching</h2>
      <div className="grid grid-flow-col auto-cols-max gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {continueItems.map((item) => (
          <Link
            key={item.id}
            to={getDetailsLink(item)}
            className="flex-shrink-0 w-64 glass rounded-lg overflow-hidden hover:scale-105 transition-transform relative group"
          >
            <div className="relative aspect-video">
              {item.backdrop_path ? (
                <img
                  src={`${posterSizes.medium}${item.backdrop_path}`}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <span className="text-white/50">{item.title}</span>
                </div>
              )}
              
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${getProgressPercent(item)}%` }}
                />
              </div>
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="outline"
                  size={isMobile ? "icon" : "default"}
                  onClick={(e) => handlePlay(item, e)}
                  className="bg-accent hover:bg-accent/80 text-white border-0"
                >
                  <Play className="h-5 w-5" />
                  {!isMobile && <span className="ml-1">Resume</span>}
                </Button>
              </div>
              
              {/* Remove button */}
              <button
                onClick={(e) => removeFromHistory(item.id, e)}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-3">
              <h3 className="text-white font-medium truncate">{item.title}</h3>
              <div className="flex items-center text-white/70 text-sm mt-1">
                <Clock className="h-3 w-3 mr-1" />
                {item.media_type === 'tv' ? (
                  <span>S{item.season} E{item.episode} - {formatTime(item.watch_position)}</span>
                ) : (
                  <span>{formatTime(item.watch_position)} / {formatTime(item.duration)}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ContinueWatching;
