
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SportMatchGrid from '@/components/SportMatchGrid';
import PageTransition from '@/components/PageTransition';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sport } from '@/utils/sports-types';
import { 
  getSportsList, 
  getAllPopularMatches, 
  getLiveMatches, 
  getTodayMatches,
  getMatchesBySport
} from '@/utils/sports-api';
import { useToast } from '@/components/ui/use-toast';
import { useUserPreferences } from '@/hooks/user-preferences';

const Sports = () => {
  const [activeTab, setActiveTab] = useState<string>('popular');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const { toast } = useToast();
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || 'hsl(var(--accent))';
  
  // Fetch sports list
  const { 
    data: sportsList = [], 
    isLoading: sportsLoading,
    error: sportsError
  } = useQuery({
    queryKey: ['sports-list'],
    queryFn: getSportsList
  });
  
  // Fetch popular matches
  const { 
    data: popularMatches = [], 
    isLoading: popularLoading 
  } = useQuery({
    queryKey: ['sports-popular-matches'],
    queryFn: getAllPopularMatches
  });
  
  // Fetch live matches
  const { 
    data: liveMatches = [], 
    isLoading: liveLoading 
  } = useQuery({
    queryKey: ['sports-live-matches'],
    queryFn: getLiveMatches
  });
  
  // Fetch today's matches
  const { 
    data: todayMatches = [], 
    isLoading: todayLoading 
  } = useQuery({
    queryKey: ['sports-today-matches'],
    queryFn: getTodayMatches
  });
  
  // Fetch sport-specific matches when a sport is selected
  const { 
    data: sportMatches = [], 
    isLoading: sportMatchesLoading 
  } = useQuery({
    queryKey: ['sports-matches', selectedSport],
    queryFn: () => getMatchesBySport(selectedSport),
    enabled: selectedSport !== 'all'
  });
  
  useEffect(() => {
    if (sportsError) {
      toast({
        title: "Error",
        description: "Failed to load sports. Please try again later.",
        variant: "destructive"
      });
    }
  }, [sportsError, toast]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleSportChange = (sportId: string) => {
    setSelectedSport(sportId);
  };
  
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="pt-20 pb-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Sports</h1>
              <p className="text-white/70">Stream live and upcoming sports events from around the world.</p>
            </div>
            
            {/* Sports categories */}
            <div className="mb-8 overflow-x-auto pb-2">
              <div className="flex space-x-2 min-w-max">
                <button
                  onClick={() => handleSportChange('all')}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    selectedSport === 'all' 
                      ? 'text-white' 
                      : 'text-white/70 hover:text-white/90'
                  }`}
                  style={{ 
                    backgroundColor: selectedSport === 'all' ? accentColor : 'transparent',
                    border: `1px solid ${selectedSport === 'all' ? 'transparent' : 'rgba(255,255,255,0.2)'}`
                  }}
                >
                  All Sports
                </button>
                
                {sportsLoading ? (
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i} 
                        className="w-24 h-10 rounded-full bg-white/10 animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  sportsList.map((sport: Sport) => (
                    <button
                      key={sport.id}
                      onClick={() => handleSportChange(sport.id)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        selectedSport === sport.id 
                          ? 'text-white' 
                          : 'text-white/70 hover:text-white/90'
                      }`}
                      style={{ 
                        backgroundColor: selectedSport === sport.id ? accentColor : 'transparent',
                        border: `1px solid ${selectedSport === sport.id ? 'transparent' : 'rgba(255,255,255,0.2)'}`
                      }}
                    >
                      {sport.name}
                    </button>
                  ))
                )}
              </div>
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/5">
                <TabsTrigger 
                  value="popular" 
                  className="data-[state=active]:text-white data-[state=active]:shadow"
                  style={{ 
                    backgroundColor: activeTab === 'popular' ? accentColor : 'transparent' 
                  }}
                >
                  Popular
                </TabsTrigger>
                <TabsTrigger 
                  value="live" 
                  className="data-[state=active]:text-white data-[state=active]:shadow"
                  style={{ 
                    backgroundColor: activeTab === 'live' ? accentColor : 'transparent' 
                  }}
                >
                  Live Now
                </TabsTrigger>
                <TabsTrigger 
                  value="today" 
                  className="data-[state=active]:text-white data-[state=active]:shadow"
                  style={{ 
                    backgroundColor: activeTab === 'today' ? accentColor : 'transparent' 
                  }}
                >
                  Today
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="popular">
                {popularLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 px-4 md:px-8 py-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="aspect-video rounded-lg bg-white/10 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  selectedSport === 'all' ? (
                    <SportMatchGrid 
                      matches={popularMatches}
                      emptyMessage="No popular matches available at the moment."
                    />
                  ) : (
                    <SportMatchGrid 
                      matches={sportMatches.filter(match => match.popular)}
                      emptyMessage={`No popular ${sportsList.find(s => s.id === selectedSport)?.name || ''} matches available.`}
                    />
                  )
                )}
              </TabsContent>
              
              <TabsContent value="live">
                {liveLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 px-4 md:px-8 py-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="aspect-video rounded-lg bg-white/10 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  selectedSport === 'all' ? (
                    <SportMatchGrid 
                      matches={liveMatches}
                      emptyMessage="No live matches available at the moment."
                    />
                  ) : (
                    <SportMatchGrid 
                      matches={sportMatches.filter(match => 
                        new Date().getTime() - match.date < 3 * 60 * 60 * 1000
                      )}
                      emptyMessage={`No live ${sportsList.find(s => s.id === selectedSport)?.name || ''} matches right now.`}
                    />
                  )
                )}
              </TabsContent>
              
              <TabsContent value="today">
                {todayLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 px-4 md:px-8 py-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="aspect-video rounded-lg bg-white/10 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  selectedSport === 'all' ? (
                    <SportMatchGrid 
                      matches={todayMatches}
                      emptyMessage="No matches scheduled for today."
                    />
                  ) : (
                    <SportMatchGrid 
                      matches={sportMatches.filter(match => {
                        const matchDate = new Date(match.date);
                        const today = new Date();
                        return matchDate.getDate() === today.getDate() &&
                               matchDate.getMonth() === today.getMonth() &&
                               matchDate.getFullYear() === today.getFullYear();
                      })}
                      emptyMessage={`No ${sportsList.find(s => s.id === selectedSport)?.name || ''} matches scheduled for today.`}
                    />
                  )
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Sports;
