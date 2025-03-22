
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPopularMovies, getTopRatedMovies } from '@/utils/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Film, ChevronDown, Grid3X3, List } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 20;

const Movies = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated'>('popular');
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const popularMoviesQuery = useQuery({
    queryKey: ['popularMovies'],
    queryFn: getPopularMovies,
  });
  
  const topRatedMoviesQuery = useQuery({
    queryKey: ['topRatedMovies'],
    queryFn: getTopRatedMovies,
  });
  
  const handleShowMorePopular = () => {
    setPopularPage(prev => prev + 1);
    toast({
      title: "Loading more movies",
      description: "Loading the next set of popular movies",
      duration: 2000,
    });
  };
  
  const handleShowMoreTopRated = () => {
    setTopRatedPage(prev => prev + 1);
    toast({
      title: "Loading more movies",
      description: "Loading the next set of top rated movies",
      duration: 2000,
    });
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };
  
  // Calculate displayed items based on current page
  const displayedPopularMovies = popularMoviesQuery.data 
    ? popularMoviesQuery.data.slice(0, popularPage * ITEMS_PER_PAGE)
    : [];
  
  const displayedTopRatedMovies = topRatedMoviesQuery.data 
    ? topRatedMoviesQuery.data.slice(0, topRatedPage * ITEMS_PER_PAGE)
    : [];
  
  // Check if there are more items to load
  const hasMorePopular = popularMoviesQuery.data 
    ? popularMoviesQuery.data.length > displayedPopularMovies.length
    : false;
    
  const hasMoreTopRated = topRatedMoviesQuery.data
    ? topRatedMoviesQuery.data.length > displayedTopRatedMovies.length
    : false;
  
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1 animate-fade-in" style={{ animationDuration: '0.5s' }}>
          <div className="container px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 pt-10">
                <Film className="h-8 w-8 text-accent animate-pulse-slow" />
                <h1 className="text-3xl font-bold text-white">Movies</h1>
              </div>
              
              <div className="flex items-center gap-4 pt-6">
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
            
            <Tabs defaultValue="popular" onValueChange={(value) => setActiveTab(value as 'popular' | 'top_rated')}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <TabsList className="mb-4 md:mb-0">
                  <TabsTrigger value="popular" className="data-[state=active]:bg-accent/20">Popular</TabsTrigger>
                  <TabsTrigger value="top_rated" className="data-[state=active]:bg-accent/20">Top Rated</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="popular" className="focus-visible:outline-none animate-fade-in">
                {popularMoviesQuery.isLoading ? (
                  <div className="py-12 text-center text-white">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4">Loading popular movies...</p>
                  </div>
                ) : popularMoviesQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={displayedPopularMovies} title="Popular Movies" listView={viewMode === 'list'} />
                    
                    {hasMorePopular && (
                      <div className="flex justify-center my-8">
                        <Button 
                          onClick={handleShowMorePopular}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                        >
                          Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" />
                        </Button>
                      </div>
                    )}
                    
                    {displayedPopularMovies.length > 0 && (
                      <Pagination className="mt-8">
                        <PaginationContent>
                          {[...Array(Math.ceil(popularMoviesQuery.data?.length || 0) / ITEMS_PER_PAGE)].slice(0, 5).map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink 
                                isActive={popularPage === i + 1} 
                                onClick={() => setPopularPage(i + 1)}
                                className={popularPage === i + 1 ? "bg-accent text-white border-accent" : "text-white/70"}
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="top_rated" className="focus-visible:outline-none animate-fade-in">
                {topRatedMoviesQuery.isLoading ? (
                  <div className="py-12 text-center text-white">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4">Loading top rated movies...</p>
                  </div>
                ) : topRatedMoviesQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading movies. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={displayedTopRatedMovies} title="Top Rated Movies" listView={viewMode === 'list'} />
                    
                    {hasMoreTopRated && (
                      <div className="flex justify-center my-8">
                        <Button 
                          onClick={handleShowMoreTopRated}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                        >
                          Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" />
                        </Button>
                      </div>
                    )}
                    
                    {displayedTopRatedMovies.length > 0 && (
                      <Pagination className="mt-8">
                        <PaginationContent>
                          {[...Array(Math.ceil(topRatedMoviesQuery.data?.length || 0) / ITEMS_PER_PAGE)].slice(0, 5).map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink 
                                isActive={topRatedPage === i + 1} 
                                onClick={() => setTopRatedPage(i + 1)}
                                className={topRatedPage === i + 1 ? "bg-accent text-white border-accent" : "text-white/70"}
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                        </PaginationContent>
                      </Pagination>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Movies;
