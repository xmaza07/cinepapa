
import { FC } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
// ...existing code...
import { LiveStream } from '@/pages/LiveStreams';
import { Button } from './ui/button';

interface LiveStreamCardProps {
  stream: LiveStream;
}

const LiveStreamCard: FC<LiveStreamCardProps> = ({ stream }) => {
  const navigate = useNavigate();

  const handleWatchClick = () => {
    navigate(`/watch/live/${stream.match_id}`, { state: { stream } });
  };

  // Use direct URLs for images (proxy removed)
  const banner = stream.banner;
  const team1Flag = stream.team_1_flag;
  const team2Flag = stream.team_2_flag;

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="bg-card/30 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-accent/50 shadow-lg shadow-black/20 flex flex-col"
    >
      {/* Banner */}
      <div className="relative w-full aspect-video">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
        <img
          src={banner}
          alt={stream.match_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Event Category Badge */}
        <div className="absolute top-3 right-3 z-20">
          <span className="bg-accent/90 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded">
            {stream.event_catagory}
          </span>
        </div>
        {/* Event Name */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
          <p className="text-white/80 text-sm">
            {stream.event_name}
          </p>
          <h3 className="text-white font-semibold text-lg line-clamp-2">
            {stream.match_name}
          </h3>
        </div>
      </div>
      
      {/* Teams */}
      <div className="p-4 flex flex-col">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <img
              src={team1Flag}
              alt={stream.team_1}
              className="w-8 h-8 object-cover rounded-full border border-white/20"
            />
            <span className="text-white text-sm font-medium line-clamp-1">
              {stream.team_1}
            </span>
          </div>
          <span className="text-white/60 text-xs font-bold">VS</span>
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm font-medium text-right line-clamp-1">
              {stream.team_2}
            </span>
            <img
              src={team2Flag}
              alt={stream.team_2}
              className="w-8 h-8 object-cover rounded-full border border-white/20"
            />
          </div>
        </div>
        
        {/* Watch Button */}
        <Button
          onClick={handleWatchClick}
          className="mt-3 w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Play className="w-4 h-4 mr-2" />
          Watch Live
        </Button>
      </div>
    </motion.div>
  );
};

export default LiveStreamCard;
