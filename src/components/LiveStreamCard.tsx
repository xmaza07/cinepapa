
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserPreferences } from '@/hooks/user-preferences';
import { LiveStream } from '@/pages/LiveStreams';

interface LiveStreamCardProps {
  stream: LiveStream;
}

const LiveStreamCard = ({ stream }: LiveStreamCardProps) => {
  const { userPreferences } = useUserPreferences();
  const accentColor = userPreferences?.accentColor || 'hsl(var(--accent))';
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-white/10 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-video">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-card animate-pulse"></div>
          )}
          <img
            src={stream.banner}
            alt={stream.match_name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
          
          <Badge 
            className="absolute top-3 right-3 text-xs"
            style={{ background: accentColor }}
          >
            {stream.event_catagory.toUpperCase()}
          </Badge>
          
          <div className="absolute bottom-3 left-3 flex items-center space-x-2">
            <img 
              src={stream.team_1_flag} 
              alt={stream.team_1} 
              className="w-8 h-8 rounded-full object-cover border border-white/20" 
            />
            <span className="text-white font-semibold">VS</span>
            <img 
              src={stream.team_2_flag} 
              alt={stream.team_2} 
              className="w-8 h-8 rounded-full object-cover border border-white/20" 
            />
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-white text-lg mb-1 line-clamp-1">{stream.match_name}</h3>
          <p className="text-gray-400 text-sm mb-3">{stream.event_name}</p>
          
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button 
              asChild
              className="w-full"
              style={{ background: accentColor }}
            >
              <Link to={`/watch/live/${stream.match_id}`} state={{ stream }}>
                <Play className="mr-2 h-4 w-4" />
                Watch 
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              asChild
            >
              <a 
                href={stream.stream_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Stream URL
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LiveStreamCard;
