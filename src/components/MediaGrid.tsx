
import { Media } from '@/utils/types';
import MediaCard from './MediaCard';

interface MediaGridProps {
  media: Media[];
  title?: string;
}

const MediaGrid = ({ media, title }: MediaGridProps) => {
  if (!media || media.length === 0) {
    return (
      <div className="py-8 text-center text-white">
        <p>No results found.</p>
      </div>
    );
  }
  
  return (
    <div className="px-4 md:px-8 py-6">
      {title && <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {media.map((item) => (
          <MediaCard key={`${item.media_type}-${item.id}`} media={item} />
        ))}
      </div>
    </div>
  );
};

export default MediaGrid;
