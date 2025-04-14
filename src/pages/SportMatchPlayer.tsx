import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { getMatchStreams } from '@/utils/sports-api';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { swMonitor } from '@/utils/sw-monitor';
import { saveLocalData, getLocalData } from '@/utils/supabase';

const SportMatchPlayer = () => {
  const { matchId } = useParams();
  const { toast } = useToast();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [cachedStreams, setCachedStreams] = useState(null);
  
  // Load cached stream data if available
  useEffect(() => {
    const loadCachedData = async () => {
      const data = await getLocalData(`sport-streams-${matchId}`, null);
      setCachedStreams(data);
    };
    
    loadCachedData();
  }, [matchId]);
  
  const { data: streams, isLoading, error } = useQuery({
    queryKey: ['match-streams', matchId],
    queryFn: () => getMatchStreams(null, matchId),
    placeholderData: cachedStreams, // Use cached data as placeholder
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
  
  // Cache streams when we get them
  useEffect(() => {
    if (streams && streams.length > 0) {
      saveLocalData(`sport-streams-${matchId}`, streams, 30 * 60 * 1000); // Cache for 30 minutes
      
      // Set initial source if not already set
      if (!selectedSource) {
        const initialSource = streams[0]?.source || null;
        setSelectedSource(initialSource);
      }
    }
  }, [streams, matchId, selectedSource]);

  const handleSourceChange = (source) => {
    setSelectedSource(source);
    setIsPlayerLoaded(false); // Reset player loaded state when changing source
    setLoadAttempts(0); // Reset load attempts counter
    
    toast({
      title: "Source changed",
      description: `Switched to ${source}`,
      duration: 2000,
    });
  };

  const embedUrl = streams && selectedSource ? 
    streams.find(s => s.source === selectedSource)?.embedUrl : '';

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsPlayerLoaded(true);
    
    // Record successful stream load without using recordCacheAccess
    console.log('Stream loaded successfully:', embedUrl);
    
    toast({
      title: "Stream loaded",
      description: "Video player ready",
      duration: 2000,
    });
  };
  
  // Handle iframe load error
  const handleIframeError = () => {
    setLoadAttempts(prev => prev + 1);
    
    if (loadAttempts < 2) {
      toast({
        title: "Stream loading failed",
        description: "Attempting to reload...",
        variant: "destructive",
        duration: 3000,
      });
      
      // Force refresh of the iframe by toggling the key
      setIsPlayerLoaded(false);
    } else {
      toast({
        title: "Stream unavailable",
        description: "Please try another source",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  if (isLoading && !cachedStreams) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent mx-auto mb-4"></div>
          <p>Loading video player...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-center p-6 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Error Loading Player</h2>
          <p className="text-white/70 mb-4">We couldn't load the video player for this match.</p>
          <p className="text-sm text-white/50">Technical details: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="pt-20 pb-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Sport Match Player</h1>
              <p className="text-white/70">Watch the match: {matchId}</p>
            </div>

            {/* Source Selection Dropdown */}
            {streams && streams.length > 1 && (
              <div className="mb-4 flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="bg-white/10 text-white rounded-md px-4 py-2 inline-flex items-center justify-center">
                    {selectedSource ? `Source: ${selectedSource}` : 'Select Source'}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background border border-white/20">
                    {streams.map((stream) => (
                      <DropdownMenuItem key={stream.source} onSelect={() => handleSourceChange(stream.source)}>
                        {stream.source}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <div className="text-sm text-white/50">
                  {isPlayerLoaded ? (
                    <span className="text-green-400">✓ Stream loaded</span>
                  ) : embedUrl ? (
                    <span className="animate-pulse">Loading stream...</span>
                  ) : null}
                </div>
              </div>
            )}

            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
              {embedUrl ? (
                <iframe
                  key={`${selectedSource}-${loadAttempts}`}
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  title="Video Player"
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                ></iframe>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <p>No streams available for this match.</p>
                </div>
              )}
              
              {/* Loading overlay */}
              {!isPlayerLoaded && embedUrl && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-accent mx-auto mb-2"></div>
                    <p>Loading stream...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Stream info */}
            {selectedSource && (
              <div className="mt-4 p-4 bg-white/5 rounded-md">
                <h3 className="text-lg font-medium text-white mb-2">Stream Information</h3>
                <p className="text-sm text-white/70">
                  Source: {selectedSource} • 
                  Quality: {streams?.find(s => s.source === selectedSource)?.hd ? 'HD' : 'SD'} •
                  Status: {isPlayerLoaded ? 'Ready' : 'Loading'}
                </p>
                <p className="text-xs text-white/50 mt-1">
                  If the current stream isn't working, try switching to another source.
                </p>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default SportMatchPlayer;
