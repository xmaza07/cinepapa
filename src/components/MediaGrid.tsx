import { Media } from '@/utils/types';
import MediaCard from './MediaCard';
import { motion, Variants } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Clock } from 'react-feather';

interface MediaGridProps {
  media: Media[];
  title?: string;
  listView?: boolean;
}

const MediaGrid = ({ media, title, listView = false }: MediaGridProps) => {
  if (!media || media.length === 0) {
    return (
      <div className="py-8 text-center text-white">
        <p>No results found.</p>
      </div>
    );
  }

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const renderTimestamp = (media: any) => {
    if (!media.created_at) return null;
    
    return (
      <div className="flex items-center text-xs text-white/70 mb-2">
        <Clock className="h-3 w-3 mr-1" />
        {formatDistanceToNow(new Date(media.created_at), { addSuffix: true })}
      </div>
    );
  };
  
  return (
    <div className="px-4 md:px-8 py-6">
      {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
      
      {listView ? (
        <motion.div
          className="flex flex-col gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {media.map((mediaItem, index) => (
            <motion.div 
              key={`${mediaItem.media_type}-${mediaItem.id}`}
              variants={item}
              className="glass p-4 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex gap-4 items-center">
                <div className="flex-shrink-0 w-16 h-24 md:w-20 md:h-30 overflow-hidden rounded-md">
                  <MediaCard key={`${mediaItem.media_type}-${mediaItem.id}`} media={mediaItem} className="h-full w-full" minimal />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{mediaItem.title || mediaItem.name}</h3>
                  <div className="flex items-center text-sm text-white/70 mb-2">
                    <span>
                      {mediaItem.media_type === 'movie'
                        ? mediaItem.release_date?.substring(0, 4)
                        : mediaItem.first_air_date?.substring(0, 4)}
                    </span>
                    {mediaItem.vote_average > 0 && (
                      <span className="ml-3 flex items-center text-amber-400">
                        ★ {mediaItem.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {renderTimestamp(mediaItem)}
                  <p className="text-white/70 text-sm line-clamp-2">{mediaItem.overview}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {media.map((mediaItem) => (
            <motion.div key={`${mediaItem.media_type}-${mediaItem.id}`} variants={item}>
              <MediaCard media={mediaItem} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MediaGrid;
