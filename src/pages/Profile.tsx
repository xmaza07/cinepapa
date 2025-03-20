
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useWatchHistory } from '@/hooks/use-watch-history';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { User, History, Settings } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user, signOut } = useAuth();
  const { watchHistory, clearWatchHistory } = useWatchHistory();
  const { userPreferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState('history');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to home if not logged in
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleClearHistory = () => {
    clearWatchHistory();
    toast({
      title: "Watch history cleared",
      description: "Your watch history has been successfully cleared."
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-slow text-white font-medium">Loading...</div>
      </div>
    );
  }

  // Convert watch history items to Media format for the MediaGrid
  const watchHistoryMedia = watchHistory.map(item => ({
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
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 bg-accent text-white text-2xl">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || 'User'} />
              <AvatarFallback>
                {user.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">
                {user.user_metadata?.full_name || user.email || 'User Profile'}
              </h1>
              <p className="text-white/70">{user.email}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={signOut}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="bg-background border border-white/10">
            <TabsTrigger value="history" className="data-[state=active]:bg-accent">
              <History className="h-4 w-4 mr-2" />
              Watch History
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-accent">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="history" className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Your Watch History</h2>
              
              {watchHistory.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClearHistory}
                  className="border-white/20 bg-black/50 text-white hover:bg-black/70"
                >
                  Clear History
                </Button>
              )}
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
                <Button onClick={() => navigate('/')}>
                  Browse Content
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preferences" className="pt-4">
            <div className="glass p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Your Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Preferred Source</h3>
                  <p className="text-white/70">
                    {userPreferences?.preferred_source ? 
                      `Your preferred video source is set to: ${userPreferences.preferred_source}` : 
                      'No preferred video source set.'}
                  </p>
                </div>
                
                {/* More preference options can be added here */}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
      
      <Footer />
    </div>
  );
};

export default Profile;
