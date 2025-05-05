
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';
import TVShowsTabs from './components/TVShowsTabs';
import TVShowsHeader from './components/TVShowsHeader';
import TVShowsFilters from './components/TVShowsFilters';
import { useToast } from '@/hooks/use-toast';

const TVShowsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated' | 'trending'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'first_air_date' | 'rating'>('default');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [platformFilters, setPlatformFilters] = useState<string[]>([]);
  const [showPlatformBar, setShowPlatformBar] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 animate-fade-in" style={{ animationDuration: '0.5s' }}>
          <div className="container px-4 py-8">
            <TVShowsHeader />
            
            <TVShowsFilters
              sortBy={sortBy}
              onSortChange={(value: 'default' | 'name' | 'first_air_date' | 'rating') => setSortBy(value)}
              genreFilter={genreFilter}
              onGenreChange={setGenreFilter}
              platformFilters={platformFilters}
              setPlatformFilters={setPlatformFilters}
              viewMode={viewMode}
              toggleViewMode={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
              showPlatformBar={showPlatformBar}
              togglePlatformBar={() => setShowPlatformBar(!showPlatformBar)}
            />
            
            <TVShowsTabs 
              activeTab={activeTab} 
              onTabChange={(value) => setActiveTab(value as 'popular' | 'top_rated' | 'trending')}
              viewMode={viewMode}
              sortBy={sortBy}
              genreFilter={genreFilter}
              platformFilters={platformFilters}
            />
          </div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default TVShowsPage;
