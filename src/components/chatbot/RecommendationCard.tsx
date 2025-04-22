import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Film, Tv, Star, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Media } from '@/utils/types';
import { validateTMDBId } from '@/utils/api';

interface RecommendationCardProps {
  media: Media;
  genres?: string[];
  rating?: string;
  expectedTmdbId?: number;
}

const RecommendationCard = ({ media, genres, rating, expectedTmdbId }: RecommendationCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const handleWatchClick = async () => {
    setIsValidating(true);
    try {
      // Validate TMDB ID before redirecting
      const isValid = await validateTMDBId(media.media_type, media.id);
      // Check if the recommended TMDB ID matches the expected one
      if (isValid && (!expectedTmdbId || media.id === expectedTmdbId)) {
        navigate(`/watch/${media.media_type}/${media.id}`);
      } else if (isValid && expectedTmdbId && media.id !== expectedTmdbId) {
        toast({
          title: 'Content Link Mismatch',
          description: `Expected TMDB ID: ${expectedTmdbId}, but got: ${media.id}. Please use the correct link or contact support.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Invalid Content Link',
          description: `The content link does not match the correct TMDB ID. Please try another title or contact support.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error validating TMDB ID:', error);
      toast({
        title: 'Validation Error',
        description: 'Unable to verify content. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="bg-muted/50 border-primary/10 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              {media.media_type === 'movie' ? (
                <Film className="h-5 w-5 mr-2 text-primary" />
              ) : (
                <Tv className="h-5 w-5 mr-2 text-primary" />
              )}
              <h3 className="font-medium text-lg">
                {media.title || media.name}
                {media.release_date && (
                  <span className="text-muted-foreground ml-2">
                    ({media.release_date.substring(0, 4)})
                  </span>
                )}
                {media.first_air_date && (
                  <span className="text-muted-foreground ml-2">
                    ({media.first_air_date.substring(0, 4)})
                  </span>
                )}
              </h3>
            </div>
            <Badge variant="outline" className="ml-2">
              {media.media_type === 'movie' ? 'Movie' : 'TV Show'}
            </Badge>
          </div>

          {media.overview && (
            <p className="text-sm text-muted-foreground line-clamp-2">{media.overview}</p>
          )}

          {genres && genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {genres.map((genre, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {rating && (
            <div className="flex items-center text-sm">
              <Star className="h-4 w-4 mr-1 text-amber-400 fill-amber-400" />
              <span>{rating}</span>
            </div>
          )}

          <Button 
            onClick={handleWatchClick}
            className="mt-2 w-full"
            variant="default"
            disabled={isValidating}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {isValidating ? 'Validating...' : `Watch ${media.media_type === 'movie' ? 'Movie' : 'Show'}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
