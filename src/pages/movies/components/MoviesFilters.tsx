
import { Filter, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MoviesFiltersProps {
  sortBy: 'default' | 'title' | 'release_date' | 'rating';
  onSortChange: (value: 'default' | 'title' | 'release_date' | 'rating') => void;
  genreFilter: string;
  onGenreChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  toggleViewMode: () => void;
}

const MoviesFilters = ({
  sortBy,
  onSortChange,
  genreFilter,
  onGenreChange,
  viewMode,
  toggleViewMode
}: MoviesFiltersProps) => {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 pt-6">
          <Select 
            value={sortBy} 
            onValueChange={onSortChange}
          >
            <SelectTrigger className="w-[180px] border-white/10 text-white bg-transparent">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent className="bg-background border-white/10 text-white">
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="release_date">Release Date</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>

          <Select value={genreFilter} onValueChange={onGenreChange}>
            <SelectTrigger className="w-[180px] border-white/10 text-white bg-transparent">
              <SelectValue placeholder="Filter by Genre" />
            </SelectTrigger>
            <SelectContent className="bg-background border-white/10 text-white">
              <SelectItem value="all">All Genres</SelectItem>
              <SelectItem value="28">Action</SelectItem>
              <SelectItem value="12">Adventure</SelectItem>
              <SelectItem value="35">Comedy</SelectItem>
              <SelectItem value="18">Drama</SelectItem>
              <SelectItem value="27">Horror</SelectItem>
              <SelectItem value="10749">Romance</SelectItem>
              <SelectItem value="878">Sci-Fi</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="border-white/10 text-white hover:bg-white/10 group"
            onClick={toggleViewMode}
          >
            {viewMode === 'grid' ? (
              <>
                <List className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                List View
              </>
            ) : (
              <>
                <Grid3X3 className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Grid View
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MoviesFilters;
