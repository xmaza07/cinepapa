// src/utils/video-sources.ts
// Extracted from api.ts for single responsibility: defines all video source providers and their URL logic.
// This module is now responsible only for video source definitions.
import { VideoSource } from './types';
import { fetchMovieSources, fetchTVSources } from './custom-api';

export const videoSources: VideoSource[] = [
  {
    key: 'vidlink',
    name: 'VidLink',
    getMovieUrl: (id: number) => `https://vidlink.pro/movie/${id}?autoplay=true&title=true`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidlink.pro/tv/${id}/${season}/${episode}?autoplay=true&title=true`,
  },
  {
    key: 'autoembed',
    name: 'AutoEmbed',
    getMovieUrl: (id: number) => `https://player.autoembed.cc/embed/movie/${id}?autoplay=true`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}?autoplay=true`,
  },
  {
    key: '2embed',
    name: '2Embed',
    getMovieUrl: (id: number) => `https://www.2embed.cc/embed/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://www.2embed.cc/embed/tv/${id}&s=${season}&e=${episode}`,
  },
  {
    key: 'multiembed',
    name: 'MultiEmbed',
    getMovieUrl: (id: number) => `https://multiembed.mov/video_id=${id}&tmdb=1`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://multiembed.mov/video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    key: '2embed-org',
    name: '2Embed.org',
    getMovieUrl: (id: number) => `https://2embed.org/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://2embed.org/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'autoembed-co',
    name: 'AutoEmbed.co',
    getMovieUrl: (id: number) => `https://autoembed.co/movie/tmdb/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`,
  },
  {
    key: 'vidsrc-xyz',
    name: 'VidSrc.xyz',
    getMovieUrl: (id: number) => `https://vidsrc.xyz/embed/movie?tmdb=${id}&ds_lang=en`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}&ds_lang=en`,
  },
  {
    key: 'moviesapi',
    name: 'MoviesAPI',
    getMovieUrl: (id: number) => `https://moviesapi.club/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://moviesapi.club/tv/${id}-${season}-${episode}`,
  },
  {
    key: 'nontongo',
    name: 'NontonGo',
    getMovieUrl: (id: number) => `https://www.NontonGo.win/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://www.NontonGo.win/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: '111movies',
    name: '111Movies',
    getMovieUrl: (id: number) => `https://111movies.com/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://111movies.com/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'flicky',
    name: 'Flicky',
    getMovieUrl: (id: number) => `https://flicky.host/embed/movie?id=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://flicky.host/embed/tv?id=${id}/${season}/${episode}`,
  },
  {
    key: 'vidjoy',
    name: 'VidJoy',
    getMovieUrl: (id: number) => `https://vidjoy.pro/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidjoy.pro/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'embed-su',
    name: 'Embed.su',
    getMovieUrl: (id: number) => `https://embed.su/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://embed.su/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'primewire',
    name: 'PrimeWire',
    getMovieUrl: (id: number) => `https://www.primewire.tf/embed/movie?tmdb=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://www.primewire.tf/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    key: 'smashystream',
    name: 'SmashyStream',
    getMovieUrl: (id: number) => `https://embed.smashystream.com/playere.php?tmdb=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  {
    key: 'vidstream',
    name: 'VidStream',
    getMovieUrl: (id: number) => `https://vidstream.site/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidstream.site/embed/tv/${id}/${episode}`,
  },
  {
    key: 'videasy',
    name: 'Videasy',
    getMovieUrl: (id: number) => `https://player.videasy.net/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://player.videasy.net/tv/${id}/${season}/${episode}`,
  },
  {
    key: 'vidsrc-wtf-2',
    name: 'VidSrc.wtf (API 2)',
    getMovieUrl: (id: number) => `https://vidsrc.wtf/api/2/movie?id=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidsrc.wtf/api/2/tv?id=${id}&s=${season}&e=${episode}`,
  },
  {
    key: 'vidsrc-wtf-3',
    name: 'VidSrc.wtf (API 3)',
    getMovieUrl: (id: number) => `https://vidsrc.wtf/api/3/movie?id=${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidsrc.wtf/api/3/tv?id=${id}&s=${season}&e=${episode}`,
  },
  {
    key: 'vidfast',
    name: 'VidFast',
    getMovieUrl: (id: number) => `https://vidfast.pro/movie/${id}?autoPlay=true`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidfast.pro/tv/${id}/${season}/${episode}?autoPlay=true`,
  },
  {
    key: 'vidbinge',
    name: 'VidBinge',
    getMovieUrl: (id: number) => `https://vidbinge.dev/embed/movie/${id}`,
    getTVUrl: (id: number, season: number, episode: number) => 
      `https://vidbinge.dev/embed/tv/${id}/${season}/${episode}`,
  },
  {
    key: "custom-api",
    name: "Custom API (HLS)",
    getMovieUrl: async (movieId: number) => {
      const result = await fetchMovieSources(movieId);
      if (result && typeof result.url === 'string' && result.url.trim() !== '') {
        return result.url;
      }
      return null;
    },
    getTVUrl: async (tvId: number, season: number, episode: number) => {
      const result = await fetchTVSources(tvId, season, episode);
      if (result && typeof result.url === 'string' && result.url.trim() !== '') {
        return result.url;
      }
      return null;
    }
  }
];
