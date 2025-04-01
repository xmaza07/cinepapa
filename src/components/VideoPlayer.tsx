import { useState, useEffect } from 'react';
import ArtPlayer from './ArtPlayer';
import { fetchMovieStreams, fetchTVStreams, VidsrcSource } from '@/utils/vidsrc-api';
import { posterSizes } from '@/utils/api';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title: string;
  posterPath?: string;
}

const VideoPlayer = ({ url, title, posterPath }: VideoPlayerProps) => {
  const [isHlsPlayer, setIsHlsPlayer] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [sources, setSources] = useState<VidsrcSource[]>([]);

  useEffect(() => {
    // Check if this is an HLS source
    if (url.startsWith('vidsrcHLS:')) {
      setIsHlsPlayer(true);
      setIsLoadingStream(true);
      
      const parts = url.split(':');
      const mediaId = parseInt(parts[1], 10);
      
      // Handle movie or TV show
      const fetchStreams = async () => {
        try {
          let fetchedSources: VidsrcSource[] = [];
          
          if (parts.length === 2) {
            // Movie
            fetchedSources = await fetchMovieStreams(mediaId);
          } else if (parts.length === 4) {
            // TV Show
            const season = parseInt(parts[2], 10);
            const episode = parseInt(parts[3], 10);
            fetchedSources = await fetchTVStreams(mediaId, season, episode);
          }
          
          setSources(fetchedSources);
          
          // Use the first stream if available
          if (fetchedSources.length > 0 && fetchedSources[0].data.stream) {
            setStreamUrl(fetchedSources[0].data.stream);
          }
        } catch (error) {
          console.error('Error fetching streams:', error);
        } finally {
          setIsLoadingStream(false);
        }
      };
      
      fetchStreams();
    } else {
      setIsHlsPlayer(false);
    }
  }, [url]);

  // If using HLS player, we need to render ArtPlayer
  if (isHlsPlayer) {
    const posterUrl = posterPath ? `${posterSizes.medium}${posterPath}` : '';

    if (isLoadingStream) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <span className="ml-3 text-white">Loading stream...</span>
        </div>
      );
    }

    if (!streamUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <span className="text-white">No stream available</span>
        </div>
      );
    }

    const currentSource = sources.find(source => source.data.stream === streamUrl);
    
    return (
      <ArtPlayer 
        option={{
          url: streamUrl,
          title: title,
          poster: posterUrl,
          subtitle: currentSource?.data.subtitle,
          autoplay: true,
          muted: false,
        }}
        className="w-full h-full"
      />
    );
  }
  
  // Otherwise, render the iframe player
  return (
    <iframe
      src={url}
      width="100%"
      height="100%"
      frameBorder="0"
      allowFullScreen
      title={title}
    ></iframe>
  );
};

export default VideoPlayer;
