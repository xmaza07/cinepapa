
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import MoviesHeader from './components/MoviesHeader';
import MoviesFilters from './components/MoviesFilters';
import MoviesTabs from './components/MoviesTabs';
import { useToast } from '@/hooks/use-toast';
import { trackMediaPreference } from '@/lib/analytics';

const MoviesPage = () => {
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated' | 'trending'>('popular');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'release_date' | 'rating'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Track initial page visit
  useEffect(() => {
    void trackMediaPreference('movie', 'browse');
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'popular' | 'top_rated' | 'trending');
    void trackMediaPreference('movie', 'browse');
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <MoviesHeader />
          <MoviesFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            genreFilter={genreFilter}
            onGenreChange={setGenreFilter}
            viewMode={viewMode}
            toggleViewMode={toggleViewMode}
          />
          <MoviesTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            viewMode={viewMode}
            sortBy={sortBy}
            genreFilter={genreFilter}
          />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default MoviesPage;
