
import React from 'react';
import { Link } from 'react-router-dom';
import { APIMatch } from '@/utils/sports-types';
import { getMatchPosterUrl, getTeamBadgeUrl } from '@/utils/sports-api';
import { formatDistanceToNow, format } from 'date-fns';
import { Clock, Tv } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useUserPreferences } from '@/hooks/user-preferences';

interface SportMatchCardProps {
  match: APIMatch;
  className?: string;
}

const SportMatchCard = ({ match, className }: SportMatchCardProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || 'hsl(var(--accent))';
  
  const isLive = new Date().getTime() - match.date < 3 * 60 * 60 * 1000; // Consider live if started less than 3 hours ago
  const matchTime = new Date(match.date);
  
  return (
    <Link
      to={`/sports/player/${match.id}`}
      className={cn(
        "block transform transition-all duration-300 hover:-translate-y-1",
        className
      )}
    >
      <Card className="overflow-hidden bg-card/80 backdrop-blur-sm border-white/10 h-full shadow-md hover:shadow-lg">
        <div className="relative aspect-video">
          {match.poster ? (
            <img
              src={getMatchPosterUrl(match.poster)}
              alt={match.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900 flex items-center justify-center">
              <span className="text-white text-lg">{match.category}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {isLive && (
            <Badge
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700"
              style={{ background: accentColor }}
            >
              <span className="mr-1 h-2 w-2 rounded-full bg-white animate-pulse inline-block"></span>
              LIVE
            </Badge>
          )}

          {match.popular && !isLive && (
            <Badge
              className="absolute top-2 right-2"
              style={{ background: accentColor }}
            >
              Popular
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold text-white mb-2 line-clamp-2">{match.title}</h3>

          {match.teams ? (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <img
                  src={getTeamBadgeUrl(match.teams.home.badge)}
                  alt={match.teams.home.name}
                  className="w-6 h-6 object-contain mr-2"
                  loading="lazy"
                />
                <span className="text-sm text-white/80 truncate max-w-[80px]">{match.teams.home.name}</span>
              </div>

              <div className="text-white/50 text-xs">VS</div>

              <div className="flex items-center">
                <span className="text-sm text-white/80 truncate max-w-[80px]">{match.teams.away.name}</span>
                <img
                  src={getTeamBadgeUrl(match.teams.away.badge)}
                  alt={match.teams.away.name}
                  className="w-6 h-6 object-contain ml-2"
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <div className="mb-3 text-sm text-white/80">{match.category}</div>
          )}

          <div className="flex justify-between items-center text-xs text-white/60">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {isLive ? (
                <span>Started {formatDistanceToNow(matchTime, { addSuffix: true })}</span>
              ) : (
                <span>{format(matchTime, 'MMM d, yyyy - h:mm a')}</span>
              )}
            </div>

            <div className="flex items-center">
              <Tv className="h-3 w-3 mr-1" />
              <span>{match.sources.length} {match.sources.length === 1 ? 'source' : 'sources'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SportMatchCard;
