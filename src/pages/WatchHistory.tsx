
import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, Clock, Trash2 } from 'lucide-react';
import { useWatchHistory } from '@/hooks/use-watch-history';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const WatchHistory = () => {
  const { watchHistory, clearWatchHistory } = useWatchHistory();
  const { toast } = useToast();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const handleClearHistory = () => {
    clearWatchHistory();
    toast({
      title: "Watch history cleared",
      description: "Your watch history has been successfully cleared."
    });
  };

  // Sort watch history based on selected option
  const sortedWatchHistory = [...watchHistory].sort((a, b) => {
    const dateA = new Date(a.last_watched).getTime();
    const dateB = new Date(b.last_watched).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Convert watch history items to Media format for the MediaGrid
  const watchHistoryMedia = sortedWatchHistory.map(item => ({
    id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || '',
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: [],
    // Additional watch info to display
    watch_position: item.watch_position,
    duration: item.duration,
    last_watched: item.last_watched
  }));

  return (
    <div className="min-h-screen bg-background pb-16">
      <Navbar />
      
      <motion.div 
        className="container mx-auto pt-24 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass p-6 rounded-lg mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <History className="h-6 w-6 mr-3 text-accent" />
              <h1 className="text-2xl font-bold text-white">Your Watch History</h1>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="border-white/20 bg-black/50 text-white hover:bg-black/70"
              >
                <Clock className="h-4 w-4 mr-2" />
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </Button>
              
              {watchHistory.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearHistory}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {watchHistory.length > 0 ? (
          <MediaGrid media={watchHistoryMedia} listView />
        ) : (
          <div className="glass p-8 rounded-lg text-center">
            <History className="h-12 w-12 mx-auto mb-4 text-white/50" />
            <h3 className="text-lg font-medium text-white mb-2">No watch history yet</h3>
            <p className="text-white/70 mb-4">
              Start watching movies and shows to build your history.
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Browse Content
            </Button>
          </div>
        )}
      </motion.div>
      
      <Footer />
    </div>
  );
};

export default WatchHistory;
