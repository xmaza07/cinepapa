
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { getMatchStreams } from '@/utils/sports-api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const SportMatchPlayer = () => {
  const { matchId } = useParams();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const { data: streams, isLoading, error } = useQuery({
    queryKey: ['match-streams', matchId],
    queryFn: () => getMatchStreams(null, matchId), // Fetch all sources
  });

  useEffect(() => {
    if (streams && streams.length > 0) {
      const initialSource = streams[0]?.source || null;
      setSelectedSource(initialSource);
    }
  }, [streams]);

  const handleSourceChange = (source) => {
    setSelectedSource(source);
    setIsPlayerLoaded(false); // Reset player loaded state when changing source
  };

  const embedUrl = streams && selectedSource ? streams.find(s => s.source === selectedSource)?.embedUrl : '';

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsPlayerLoaded(true);
  };

  if (isLoading) {
    return <div>Loading video player...</div>;
  }

  if (error) {
    return <div>Error loading video player.</div>;
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
            )}

            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  title="Video Player"
                  onLoad={handleIframeLoad}
                ></iframe>
              ) : (
                <div>No streams available for this match.</div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default SportMatchPlayer;
