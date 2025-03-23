import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import { getMatchStreams } from '@/utils/sports-api';

const SportMatchPlayer = () => {
  const { matchId } = useParams();
  const source = 'alpha'; // Assuming source is alpha for now
  const { data: streams, isLoading, error } = useQuery({
    queryKey: ['match-streams', source, matchId],
    queryFn: () => getMatchStreams(source, matchId),
  });

  if (isLoading) {
    return <div>Loading video player...</div>;
  }

  if (error) {
    return <div>Error loading video player.</div>;
  }

  const embedUrl = streams && streams.length > 0 ? streams[0].embedUrl : '';

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

            {/* Video Player will be here */}
            <div className="aspect-video bg-black rounded-lg">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allowFullScreen
                  title="Video Player"
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
