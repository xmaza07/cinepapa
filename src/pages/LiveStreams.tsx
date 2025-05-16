
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import LiveStreamCard from '@/components/LiveStreamCard';
import { useLiveStreams } from '@/hooks/use-live-streams';
import PageTransition from '@/components/PageTransition';

export interface LiveStream {
  event_catagory: string;
  event_name: string;
  match_id: number;
  match_name: string;
  team_1: string;
  team_1_flag: string;
  team_2: string;
  team_2_flag: string;
  banner: string;
  stream_link: string;
}

const LiveStreams = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const { data, isLoading, isError, error, refetch } = useLiveStreams();

  // Handle manual refresh
  const handleRefresh = () => {
    toast({
      title: 'Refreshing live streams',
      description: 'Fetching the latest live streams data...'
    });
    refetch();
  };

  // Filter streams based on active tab
  const filteredStreams = data?.matches?.filter(stream => 
    activeTab === 'all' || stream.event_catagory.toLowerCase() === activeTab
  );

  // Get unique categories for tabs
  const categories = data?.matches 
    ? ['all', ...Array.from(new Set(data.matches.map(stream => stream.event_catagory.toLowerCase())))]
    : ['all'];

  return (
    <PageTransition>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Live Streams</h1>
            <p className="text-gray-400 mt-2">
              {data ? 
                `${data.total_mathes} live streams available • Last updated: ${data.last_upaded}` : 
                'Loading available streams...'
              }
            </p>
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isError ? (
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load live streams</h2>
            <p className="text-gray-400 mb-4 max-w-md">
              {error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'}
            </p>
            <Button onClick={() => refetch()} variant="destructive">
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <Tabs 
              defaultValue="all" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList className="bg-background/30 backdrop-blur-sm">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="capitalize"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i}
                        className="bg-card/30 animate-pulse rounded-lg h-[320px]"
                      ></div>
                    ))}
                  </div>
                ) : filteredStreams && filteredStreams.length > 0 ? (
                  <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1 }}
                  >
                    {filteredStreams.map((stream) => (
                      <LiveStreamCard key={stream.match_id} stream={stream} />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-gray-400">No live streams available for this category.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </PageTransition>
  );
};

export default LiveStreams;
