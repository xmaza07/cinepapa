
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPopularTVShows, getTopRatedTVShows } from '@/utils/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tv, ChevronDown, Grid3X3, List } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 20;

const TVShows = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated'>('popular');
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const popularTVQuery = useQuery({
    queryKey: ['popularTV'],
    queryFn: getPopularTVShows,
  });
  
  const topRatedTVQuery = useQuery({
    queryKey: ['topRatedTV'],
    queryFn: getTopRatedTVShows,
  });
  
  const handleShowMorePopular = () => {
    setPopularPage(prev => prev + 1);
    toast({
      title: "Loading more TV shows",
      description: "Loading the next set of popular TV shows",
      duration: 2000,
    });
  };
  
  const handleShowMoreTopRated = () => {
    setTopRatedPage(prev => prev + 1);
    toast({
      title: "Loading more TV shows",
      description: "Loading the next set of top rated TV shows",
      duration: 2000,
    });
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };
  
  // Calculate displayed items based on current page
  const displayedPopularTV = popularTVQuery.data 
    ? popularTVQuery.data.slice(0, popularPage * ITEMS_PER_PAGE)
    : [];
  
  const displayedTopRatedTV = topRatedTVQuery.data 
    ? topRatedTVQuery.data.slice(0, topRatedPage * ITEMS_PER_PAGE)
    : [];
  
  // Check if there are more items to load
  const hasMorePopular = popularTVQuery.data 
    ? popularTVQuery.data.length > displayedPopularTV.length
    : false;
    
  const hasMoreTopRated = topRatedTVQuery.data
    ? topRatedTVQuery.data.length > displayedTopRatedTV.length
    : false;
  
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1 animate-fade-in" style={{ animationDuration: '0.5s' }}>
          <div className="container px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-3 pt-10">
                <Tv className="h-8 w-8 text-accent animate-pulse-slow" />
                <h1 className="text-3xl font-bold text-white">TV Shows</h1>
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
                {popularTVQuery.isLoading ? (
                  <div className="py-12 text-center text-white">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4">Loading popular TV shows...</p>
                  </div>
                ) : popularTVQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={displayedPopularTV} title="Popular TV Shows" listView={viewMode === 'list'} />
                    
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
                    
                    {displayedPopularTV.length > 0 && (
                      <Pagination className="mt-8">
                        <PaginationContent>
                          {[...Array(Math.ceil(popularTVQuery.data?.length || 0) / ITEMS_PER_PAGE)].slice(0, 5).map((_, i) => (
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
                {topRatedTVQuery.isLoading ? (
                  <div className="py-12 text-center text-white">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-4">Loading top rated TV shows...</p>
                  </div>
                ) : topRatedTVQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={displayedTopRatedTV} title="Top Rated TV Shows" listView={viewMode === 'list'} />
                    
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
                    
                    {displayedTopRatedTV.length > 0 && (
                      <Pagination className="mt-8">
                        <PaginationContent>
                          {[...Array(Math.ceil(topRatedTVQuery.data?.length || 0) / ITEMS_PER_PAGE)].slice(0, 5).map((_, i) => (
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

export default TVShows;
