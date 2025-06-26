
import { useState, useRef } from 'react';
import { Media } from '@/utils/types';
import MediaCard from './MediaCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ContentRow.module.css';

interface ContentRowProps {
  title: string;
  media: Media[];
  featured?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
}

const ContentRow = ({ title, media, featured = false, onLoadMore, isLoadingMore, loadMoreRef }: ContentRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Handle scroll position to show/hide arrows
  const handleScroll = () => {
    if (!rowRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
  };
  
  // Scroll functions
  const scrollLeft = () => {
    if (!rowRef.current) return;
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };
  
  const scrollRight = () => {
    if (!rowRef.current) return;
    const scrollAmount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };
  
  if (!media || media.length === 0) return null;
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.scrollContainer}>
        {/* Left scroll button */}
        {showLeftArrow && (
          <button
            className={`${styles.scrollButton} ${styles.scrollButtonLeft} ${styles.scrollButtonHiddenLeft}`}
            onClick={scrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {/* Content row */}
        <div 
          ref={rowRef}
          className={styles.contentRow}
          onScroll={handleScroll}
        >
          {media.map((item, index) => (
            <div 
              key={`${item.media_type}-${item.id}`} 
              className={`${styles.mediaItem} ${featured ? styles.mediaItemFeatured : styles.mediaItemRegular}`}
              style={{ 
                animationDelay: `${index * 0.05}s` 
              }}
            >
              <MediaCard media={item} featured={featured} />
            </div>
          ))}
        </div>
        {/* Infinite Scroll Trigger Only (no button) */}
        {loadMoreRef && (
          <div ref={loadMoreRef} className={styles.loadMoreTrigger} />
        )}
        {/* Right scroll button */}
        {showRightArrow && (
          <button
            className={`${styles.scrollButton} ${styles.scrollButtonRight} ${styles.scrollButtonHiddenRight}`}
            onClick={scrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ContentRow;
