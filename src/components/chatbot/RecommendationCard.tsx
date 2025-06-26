import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Media } from '@/utils/types';
import { triggerHapticFeedback, triggerSuccessHaptic, triggerErrorHaptic } from '@/utils/haptic-feedback';
import { StreamingAvailability } from '@/utils/services/streaming-platform';
import { ThumbsUp, ThumbsDown, Play, Info, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getValidatedRoute } from '@/utils/tmdb-search';
import { useToast } from '@/hooks/use-toast';

interface RecommendationCardProps {
  media: Media;
  availability?: StreamingAvailability[];
  onRate: (rating: number) => void;
  personalizedScore: number;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  media,
  availability,
  onRate,
  personalizedScore
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect mobile screens
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigation = async (type: 'details' | 'watch') => {
    setIsNavigating(true);
    try {
      const route = await getValidatedRoute(media, type);
      if (route === '/not-found') {
        toast({
          title: 'Content Not Found',
          description: 'Could not find exact match for this content.',
          variant: 'destructive',
          duration: 3000
        });
      } else {
        navigate(route);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: 'Navigation Error',
        description: 'Failed to load content details.',
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setIsNavigating(false);
    }
  };
  const releaseYear = media.release_date ? 
    new Date(media.release_date).getFullYear() : 
    media.first_air_date ? 
    new Date(media.first_air_date).getFullYear() : 
    null;

  const streamingPlatforms = availability?.filter(a => a.type === 'subscription')
    .map(a => a.providerId);

  return (
    <Card className={`${isMobile ? 'p-3' : 'p-4'} space-y-3 backdrop-blur bg-background/80 hover:bg-background/90 transition-colors ${isMobile ? 'touch-manipulation' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>
            {media.title || media.name} {releaseYear && `(${releaseYear})`}
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            {media.media_type && (
              <Badge variant="outline" className="capitalize text-xs">
                {media.media_type}
              </Badge>
            )}
            {personalizedScore > 0.7 && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(personalizedScore * 100)}% Match
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              triggerSuccessHaptic();
              onRate(1);
            }}
            className="p-1.5 rounded-full hover:bg-success/20 text-success transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <button 
            onClick={() => {
              triggerErrorHaptic();
              onRate(-1);
            }}
            className="p-1.5 rounded-full hover:bg-destructive/20 text-destructive transition-colors"
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {media.overview && (
        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground line-clamp-2 leading-snug`}>
          {media.overview}
        </p>
      )}

      <div className="h-px bg-border/10 -mx-4" />

      <div className={`flex items-center ${isMobile ? 'flex-col space-y-2 items-stretch' : 'justify-between'}`}>
        <div className="flex flex-wrap gap-1">
          {streamingPlatforms?.map(platform => (
            <Badge 
              key={platform}
              variant="outline" 
              className="text-xs bg-background/50"
            >
              {platform}
            </Badge>
          ))}
        </div>
        
        <div className={`flex items-center ${isMobile ? 'justify-center w-full' : 'space-x-2'}`}>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                triggerHapticFeedback(15);
                handleNavigation('details');
              }}
              disabled={isNavigating}
              className={`flex items-center space-x-1 ${isMobile ? 'text-xs' : 'text-sm'} px-2 py-1 rounded-l bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 ${isMobile ? 'flex-1 justify-center' : ''}`}
            >
              {isNavigating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Info className="h-4 w-4" />
              )}
              <span>Details</span>
            </button>
            <button
              onClick={() => {
                triggerHapticFeedback(25);
                handleNavigation('watch');
              }}
              disabled={isNavigating}
              className={`flex items-center space-x-1 ${isMobile ? 'text-xs' : 'text-sm'} px-2 py-1 rounded-r bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 ${isMobile ? 'flex-1 justify-center' : ''}`}
            >
              {isNavigating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Play</span>
            </button>
          </div>
          {!isMobile && availability && availability.length > 0 && (
            <div className="flex gap-1">
              {availability.map((a, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-xs bg-background/50"
                >
                  {a.providerId}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default RecommendationCard;
