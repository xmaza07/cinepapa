import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, Clock, Trash2, Bookmark, Heart } from 'lucide-react';
import { useWatchHistory } from '@/hooks/watch-history';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks';

const WatchHistory = () => {
  const { watchHistory, clearWatchHistory, favorites, watchlist, addToFavorites, addToWatchlist, removeFromFavorites, removeFromWatchlist } = useWatchHistory();
  const { toast } = useToast();
  const { user } = useAuth();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [activeTab, setActiveTab] = useState<'history' | 'favorites' | 'watchlist'>('history');

  const handleClearHistory = () => {
    clearWatchHistory();
    toast({
      title: "Watch history cleared",
      description: "Your watch history has been successfully cleared."
    });
  };

  // Sort watch history based on selected option
  const sortedWatchHistory = [...watchHistory].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
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
    created_at: item.created_at
  }));

  // Convert favorites to Media format
  const favoritesMedia = favorites.map(item => ({
    id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || '',
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: []
  }));

  // Convert watchlist to Media format
  const watchlistMedia = watchlist.map(item => ({
    id: item.media_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    overview: item.overview || '',
    vote_average: item.rating || 0,
    media_type: item.media_type,
    genre_ids: []
  }));

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'history' | 'favorites' | 'watchlist');
  };

  const handleItemRemove = (mediaId: number, mediaType: 'movie' | 'tv') => {
    if (activeTab === 'favorites') {
      removeFromFavorites(mediaId, mediaType);
      toast({
        title: "Removed from favorites",
        description: "The item has been removed from your favorites."
      });
    } else if (activeTab === 'watchlist') {
      removeFromWatchlist(mediaId, mediaType);
      toast({
        title: "Removed from watchlist",
        description: "The item has been removed from your watchlist."
      });
    }
  };

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center">
              {activeTab === 'history' && <History className="h-6 w-6 mr-3 text-accent" />}
              {activeTab === 'favorites' && <Heart className="h-6 w-6 mr-3 text-accent" />}
              {activeTab === 'watchlist' && <Bookmark className="h-6 w-6 mr-3 text-accent" />}
              <h1 className="text-2xl font-bold text-white">
                {activeTab === 'history' && 'Your Watch History'}
                {activeTab === 'favorites' && 'Your Favorites'}
                {activeTab === 'watchlist' && 'Your Watchlist'}
              </h1>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {activeTab === 'history' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                </Button>
              )}
              
              {activeTab === 'history' && watchHistory.length > 0 && (
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
          
          <Tabs defaultValue="history" onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 bg-black/20 border border-white/10">
              <TabsTrigger value="history" className="data-[state=active]:bg-accent">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="favorites" className="data-[state=active]:bg-accent">
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="data-[state=active]:bg-accent">
                <Bookmark className="h-4 w-4 mr-2" />
                Watchlist
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="history" className="mt-0">
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
            </TabsContent>
            
            <TabsContent value="favorites" className="mt-0">
              {favorites.length > 0 ? (
                <MediaGrid media={favoritesMedia} listView />
              ) : (
                <div className="glass p-8 rounded-lg text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-white/50" />
                  <h3 className="text-lg font-medium text-white mb-2">No favorites yet</h3>
                  <p className="text-white/70 mb-4">
                    Add movies and shows to your favorites for quick access.
                  </p>
                  <Button onClick={() => window.location.href = '/'}>
                    Browse Content
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="watchlist" className="mt-0">
              {watchlist.length > 0 ? (
                <MediaGrid media={watchlistMedia} listView />
              ) : (
                <div className="glass p-8 rounded-lg text-center">
                  <Bookmark className="h-12 w-12 mx-auto mb-4 text-white/50" />
                  <h3 className="text-lg font-medium text-white mb-2">Your watchlist is empty</h3>
                  <p className="text-white/70 mb-4">
                    Add movies and shows to your watchlist to watch later.
                  </p>
                  <Button onClick={() => window.location.href = '/'}>
                    Browse Content
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
      
      <Footer />
    </div>
  );
};

export default WatchHistory;
