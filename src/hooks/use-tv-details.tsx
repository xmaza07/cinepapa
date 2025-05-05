
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTVDetails, getTVRecommendations, getSeasonDetails, getTVTrailer, getTVCast } from '@/utils/api';
import { TVDetails, Episode, Media, CastMember } from '@/utils/types';
import { useWatchHistory } from '@/hooks/watch-history';
import { useToast } from '@/hooks/use-toast';

export const useTVDetails = (id: string | undefined) => {
  const [tvShow, setTVShow] = useState<TVDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'episodes' | 'about' | 'cast' | 'reviews'>('episodes');
  const [recommendations, setRecommendations] = useState<Media[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isInMyWatchlist, setIsInMyWatchlist] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { watchHistory, addToFavorites, addToWatchlist, removeFromFavorites, removeFromWatchlist, isInFavorites, isInWatchlist } = useWatchHistory();

  useEffect(() => {
    const fetchTVData = async () => {
      if (!id) {
        setError("TV show ID is required");
        setIsLoading(false);
        return;
      }

      const tvId = parseInt(id, 10);
      if (isNaN(tvId)) {
        setError("Invalid TV show ID");
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const [tvData, recommendationsData, castData] = await Promise.all([
          getTVDetails(tvId),
          getTVRecommendations(tvId),
          getTVCast(tvId),
        ]);
        
        if (!tvData) {
          setError("TV show not found");
          return;
        }

        setTVShow(tvData);
        setRecommendations(recommendationsData);
        setCast(castData);
        
        if (tvData.seasons && tvData.seasons.length > 0) {
          const firstSeason = tvData.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
            setSelectedSeason(firstSeason.season_number);
          }
        }
      } catch (error) {
        console.error('Error fetching TV show data:', error);
        setError("Failed to load TV show data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTVData();
  }, [id]);
  
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!tvShow || !selectedSeason) return;
      
      try {
        const episodesData = await getSeasonDetails(tvShow.id, selectedSeason);
        setEpisodes(episodesData);
      } catch (error) {
        console.error('Error fetching episodes:', error);
      }
    };
    
    fetchEpisodes();
  }, [tvShow, selectedSeason]);

  useEffect(() => {
    const fetchTrailer = async () => {
      if (tvShow?.id) {
        try {
          const trailerData = await getTVTrailer(tvShow.id);
          setTrailerKey(trailerData);
        } catch (error) {
          console.error('Error fetching trailer:', error);
        }
      }
    };
    
    fetchTrailer();
  }, [tvShow?.id]);

  useEffect(() => {
    if (tvShow?.id) {
      setIsFavorite(isInFavorites(tvShow.id, 'tv'));
      setIsInMyWatchlist(isInWatchlist(tvShow.id, 'tv'));
    }
  }, [tvShow?.id, isInFavorites, isInWatchlist]);
  
  const handlePlayEpisode = (seasonNumber: number, episodeNumber: number) => {
    if (tvShow) {
      navigate(`/watch/tv/${tvShow.id}/${seasonNumber}/${episodeNumber}`);
    }
  };

  const handleToggleFavorite = () => {
    if (!tvShow) return;
    
    if (isFavorite) {
      removeFromFavorites(tvShow.id, 'tv');
      setIsFavorite(false);
    } else {
      addToFavorites({
        media_id: tvShow.id,
        media_type: 'tv',
        title: tvShow.name,
        poster_path: tvShow.poster_path,
        backdrop_path: tvShow.backdrop_path,
        overview: tvShow.overview,
        rating: tvShow.vote_average
      });
      setIsFavorite(true);
    }
  };

  const handleToggleWatchlist = () => {
    if (!tvShow) return;
    
    if (isInMyWatchlist) {
      removeFromWatchlist(tvShow.id, 'tv');
      setIsInMyWatchlist(false);
    } else {
      addToWatchlist({
        media_id: tvShow.id,
        media_type: 'tv',
        title: tvShow.name,
        poster_path: tvShow.poster_path,
        backdrop_path: tvShow.backdrop_path,
        overview: tvShow.overview,
        rating: tvShow.vote_average
      });
      setIsInMyWatchlist(true);
    }
  };

  const getLastWatchedEpisode = () => {
    if (!tvShow || !watchHistory.length) return null;

    const tvWatchHistory = watchHistory.filter(
      item => item.media_id === tvShow.id && item.media_type === 'tv'
    );

    if (!tvWatchHistory.length) return null;

    const lastWatched = tvWatchHistory.reduce((latest, current) => {
      return new Date(current.created_at) > new Date(latest.created_at) ? current : latest;
    });

    return {
      season: lastWatched.season,
      episode: lastWatched.episode,
      progress: Math.round((lastWatched.watch_position / lastWatched.duration) * 100)
    };
  };

  return {
    tvShow,
    episodes,
    selectedSeason,
    setSelectedSeason,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    recommendations,
    cast,
    trailerKey,
    isFavorite,
    isInMyWatchlist,
    handlePlayEpisode,
    handleToggleFavorite,
    handleToggleWatchlist,
    getLastWatchedEpisode,
    navigate
  };
};

export default useTVDetails;
