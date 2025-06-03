
import { VideoSource } from './types';
import { loadVideoSources } from './video-source-loader';
import { fetchMovieSources, fetchTVSources } from './custom-api';
import { primewire } from '@/lib/providers/primewire';
import { extractPrimewireStreamUrl } from './primewire-custom-cors';

// Combined video sources - from JSON + custom API + Primewire Custom
const allVideoSources: VideoSource[] = [
  ...loadVideoSources(),
  // Add custom API source
  {
    key: "custom-api",
    name: "Custom API (HLS)",
    getMovieUrl: async (id: number) => {
      const result = await fetchMovieSources(id);
      if (result && typeof result.url === 'string' && result.url.trim() !== '') {
        return result;
      }
      return null;
    },
    getTVUrl: async (id: number, season: number, episode: number) => {
      const result = await fetchTVSources(id, season, episode);
      if (result && typeof result.url === 'string' && result.url.trim() !== '') {
        return result;
      }
      return null;
    }
  },
  // Add Primewire Custom source
  {
    key: "primewire-custom",
    name: "PW-Custom (HLS)",
    getMovieUrl: async (id: number) => {
      try {
        // Use Primewire provider to get movie metadata first
        const posts = await primewire.GetHomePosts('');
        const moviePost = posts.find((post: any) => 
          post.title.toLowerCase().includes('movie') || 
          post.link.includes(`/${id}/`)
        );
        
        if (!moviePost) {
          console.log('Movie not found in Primewire');
          return null;
        }

        // Get movie info and stream
        const movieInfo = await primewire.GetMetaData(moviePost.link, 'movie');
        if (!movieInfo || !movieInfo.linkList || movieInfo.linkList.length === 0) {
          console.log('No stream links found for movie');
          return null;
        }

        // Get stream from first available link
        const firstLink = movieInfo.linkList[0];
        if (!firstLink.directLinks || firstLink.directLinks.length === 0) {
          console.log('No direct links found');
          return null;
        }

        const streamData = await primewire.GetStream(firstLink.directLinks[0].link, 'movie');
        const processedStream = extractPrimewireStreamUrl(streamData);
        
        return {
          url: processedStream.url,
          headers: processedStream.headers
        };
      } catch (error) {
        console.error('Error fetching Primewire movie stream:', error);
        return null;
      }
    },
    getTVUrl: async (id: number, season: number, episode: number) => {
      try {
        // Use Primewire provider to get TV show metadata first
        const posts = await primewire.GetHomePosts('');
        const tvPost = posts.find((post: any) => 
          post.title.toLowerCase().includes('tv') || 
          post.link.includes(`/${id}/`)
        );
        
        if (!tvPost) {
          console.log('TV show not found in Primewire');
          return null;
        }

        // Get TV show info and stream
        const tvInfo = await primewire.GetMetaData(tvPost.link, 'tv');
        if (!tvInfo || !tvInfo.linkList || tvInfo.linkList.length === 0) {
          console.log('No stream links found for TV show');
          return null;
        }

        // Find the specific season/episode link
        const episodeLink = tvInfo.linkList.find((link: any) => 
          link.title.includes(`S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`)
        );

        if (!episodeLink || !episodeLink.directLinks || episodeLink.directLinks.length === 0) {
          console.log('Episode not found or no direct links');
          return null;
        }

        const streamData = await primewire.GetStream(episodeLink.directLinks[0].link, 'tv');
        const processedStream = extractPrimewireStreamUrl(streamData);
        
        return {
          url: processedStream.url,
          headers: processedStream.headers
        };
      } catch (error) {
        console.error('Error fetching Primewire TV stream:', error);
        return null;
      }
    }
  }
];

// Export the combined video sources
export { allVideoSources as videoSources };
export default allVideoSources;
