
import { Film } from 'lucide-react';

const MoviesHeader = () => {
  return (
    <div className="flex items-center gap-3 pt-10 mb-8">
      <Film className="h-8 w-8 text-accent animate-pulse-slow" />
      <h1 className="text-3xl font-bold text-white">Movies</h1>
    </div>
  );
};

export default MoviesHeader;
