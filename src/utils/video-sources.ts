import { VideoSource } from './types';
import { loadVideoSources } from './video-source-loader';
import { fetchMovieSources, fetchTVSources } from './custom-api';

// Combined video sources - from JSON + custom API
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
  }
];

// Export the combined video sources
export { allVideoSources as videoSources };
export default allVideoSources;
