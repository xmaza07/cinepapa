
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getPopularTVShows, getTopRatedTVShows, getTrendingTVShows } from '@/utils/api';
import { Media, ensureExtendedMediaArray } from '@/utils/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MediaGrid from '@/components/MediaGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tv, ChevronDown, Grid3X3, List, Filter } from 'lucide-react';
import PageTransition from '@/components/PageTransition';
import { useToast } from '@/hooks/use-toast';
import { MediaGridSkeleton } from '@/components/MediaSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuCheckboxItem, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ITEMS_PER_PAGE = 20;

// Streaming platform definition
interface StreamingPlatform {
  id: string;
  name: string;
  logo?: string;
}

const STREAMING_PLATFORMS: StreamingPlatform[] = [
  { id: 'netflix', name: 'Netflix' },
  { id: 'prime', name: 'Amazon Prime Video' },
  { id: 'hulu', name: 'Hulu' },
  { id: 'paramount', name: 'Paramount+' },
  { id: 'disney', name: 'Disney+' },
  { id: 'hbo', name: 'HBO Max' },
  { id: 'apple', name: 'Apple TV+' },
  { id: 'peacock', name: 'Peacock' },
];

const TVShows = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'popular' | 'top_rated' | 'trending'>('popular');
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [trendingPage, setTrendingPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [allPopularShows, setAllPopularShows] = useState<Media[]>([]);
  const [allTopRatedShows, setAllTopRatedShows] = useState<Media[]>([]);
  const [allTrendingShows, setAllTrendingShows] = useState<Media[]>([]);
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'first_air_date' | 'rating'>('default');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [platformFilters, setPlatformFilters] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Query hooks for popular, top rated, and trending TV shows
  const popularTVQuery = useQuery({
    queryKey: ['popularTV', popularPage],
    queryFn: () => getPopularTVShows(popularPage),
    placeholderData: keepPreviousData,
  });

  const topRatedTVQuery = useQuery({
    queryKey: ['topRatedTV', topRatedPage],
    queryFn: () => getTopRatedTVShows(topRatedPage),
    placeholderData: keepPreviousData,
  });

  const trendingTVQuery = useQuery({
    queryKey: ['trendingTV', trendingPage],
    queryFn: () => getTrendingTVShows(trendingPage),
    placeholderData: keepPreviousData,
  });

  // Effects for popular, top rated, and trending TV shows
  useEffect(() => {
    if (popularTVQuery.data) {
      console.log('Raw Popular TV Data:', popularTVQuery.data);
      setAllPopularShows(prev => {
        const newShows = popularTVQuery.data
          .filter(show => !prev.some(p => p.id === (show.id || show.media_id)))
          .map(show => {
            return {
              ...show,
              id: show.id || show.media_id || 0,
              media_id: show.id || show.media_id || 0,
              media_type: 'tv' as 'tv',
            };
          });
        return [...prev, ...newShows];
      });
    }
  }, [popularTVQuery.data]);

  useEffect(() => {
    if (topRatedTVQuery.data) {
      console.log('Raw Top Rated TV Data:', topRatedTVQuery.data);
      setAllTopRatedShows(prev => {
        const newShows = topRatedTVQuery.data
          .filter(show => !prev.some(p => p.id === (show.id || show.media_id)))
          .map(show => {
            return {
              ...show,
              id: show.id || show.media_id || 0,
              media_id: show.id || show.media_id || 0,
              media_type: 'tv' as 'tv',
            };
          });
        return [...prev, ...newShows];
      });
    }
  }, [topRatedTVQuery.data]);

  useEffect(() => {
    if (trendingTVQuery.data) {
      console.log('Raw Trending TV Data:', trendingTVQuery.data);
      setAllTrendingShows(prev => {
        const newShows = trendingTVQuery.data
          .filter(show => !prev.some(p => p.id === (show.id || show.media_id)))
          .map(show => {
            return {
              ...show,
              id: show.id || show.media_id || 0,
              media_id: show.id || show.media_id || 0,
              media_type: 'tv' as 'tv',
            };
          });
        return [...prev, ...newShows];
      });
    }
  }, [trendingTVQuery.data]);

  // Prefetching effects
  useEffect(() => {
    if (popularTVQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['popularTV', popularPage + 1],
        queryFn: () => getPopularTVShows(popularPage + 1),
      });
    }
  }, [popularPage, queryClient, popularTVQuery.data]);

  useEffect(() => {
    if (topRatedTVQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['topRatedTV', topRatedPage + 1],
        queryFn: () => getTopRatedTVShows(topRatedPage + 1),
      });
    }
  }, [topRatedPage, queryClient, topRatedTVQuery.data]);

  useEffect(() => {
    if (trendingTVQuery.data?.length === ITEMS_PER_PAGE) {
      queryClient.prefetchQuery({
        queryKey: ['trendingTV', trendingPage + 1],
        queryFn: () => getTrendingTVShows(trendingPage + 1),
      });
    }
  }, [trendingPage, queryClient, trendingTVQuery.data]);

  // Function to toggle streaming platform filter
  const togglePlatformFilter = (platformId: string) => {
    setPlatformFilters(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  // Function to clear all platform filters
  const clearPlatformFilters = () => {
    setPlatformFilters([]);
  };

  // Mock function to simulate checking if a show is available on a platform
  const isShowAvailableOnPlatform = (show: Media, platformId: string): boolean => {
    // This is a mock implementation - in a real app, you would check the actual streaming data
    // Either from an API or from data embedded in the show object
    // Using show ID modulo for demonstration purposes only:
    const platformIndex = STREAMING_PLATFORMS.findIndex(p => p.id === platformId);
    if (platformIndex === -1) return false;
    
    // For demo purposes, distribute shows across platforms based on ID
    return (show.id % STREAMING_PLATFORMS.length) === platformIndex;
  };

  // Enhanced filter function that includes platform filtering
  const applyFiltersAndSort = (shows: Media[]) => {
    let filteredShows = [...shows];
    
    // Apply genre filter
    if (genreFilter !== 'all') {
      filteredShows = filteredShows.filter(show => 
        show.genre_ids?.includes(parseInt(genreFilter))
      );
    }

    // Apply platform filters
    if (platformFilters.length > 0) {
      filteredShows = filteredShows.filter(show =>
        platformFilters.some(platformId => isShowAvailableOnPlatform(show, platformId))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'name':
        filteredShows.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'first_air_date':
        filteredShows.sort((a, b) => 
          new Date(b.first_air_date).getTime() - new Date(a.first_air_date).getTime()
        );
        break;
      case 'rating':
        filteredShows.sort((a, b) => b.vote_average - a.vote_average);
        break;
      default:
        break;
    }
    
    return filteredShows;
  };

  // Apply filters to each set of shows
  const filteredPopularShows = applyFiltersAndSort(allPopularShows);
  const filteredTopRatedShows = applyFiltersAndSort(allTopRatedShows);
  const filteredTrendingShows = applyFiltersAndSort(allTrendingShows);

  // Event handlers
  const handleShowMorePopular = () => setPopularPage(prev => prev + 1);
  const handleShowMoreTopRated = () => setTopRatedPage(prev => prev + 1);
  const handleShowMoreTrending = () => setTrendingPage(prev => prev + 1);
  const toggleViewMode = () => setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  const toggleFilterPanel = () => setShowFilterPanel(!showFilterPanel);

  // Loading state indicators
  const hasMorePopular = popularTVQuery.data?.length === ITEMS_PER_PAGE;
  const hasMoreTopRated = topRatedTVQuery.data?.length === ITEMS_PER_PAGE;
  const hasMoreTrending = trendingTVQuery.data?.length === ITEMS_PER_PAGE;

  // Get the currently active shows based on the selected tab
  const getActiveShows = () => {
    switch (activeTab) {
      case 'popular':
        return filteredPopularShows;
      case 'top_rated':
        return filteredTopRatedShows;
      case 'trending':
        return filteredTrendingShows;
      default:
        return [];
    }
  };

  // Calculate applied filter count for the filter button badge
  const appliedFiltersCount = (genreFilter !== 'all' ? 1 : 0) + platformFilters.length;

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
                <Select 
                  value={sortBy} 
                  onValueChange={(value: 'default' | 'name' | 'first_air_date' | 'rating') => setSortBy(value)}
                >
                  <SelectTrigger className="w-[180px] border-white/10 text-white bg-transparent">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10 text-white">
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="first_air_date">First Air Date</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger className="w-[180px] border-white/10 text-white bg-transparent">
                    <SelectValue placeholder="Filter by Genre" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-white/10 text-white">
                    <SelectItem value="all">All Genres</SelectItem>
                    <SelectItem value="10759">Action & Adventure</SelectItem>
                    <SelectItem value="35">Comedy</SelectItem>
                    <SelectItem value="18">Drama</SelectItem>
                    <SelectItem value="10765">Sci-Fi & Fantasy</SelectItem>
                    <SelectItem value="80">Crime</SelectItem>
                    <SelectItem value="9648">Mystery</SelectItem>
                    <SelectItem value="10762">Kids</SelectItem>
                  </SelectContent>
                </Select>

                {/* New Streaming Platform Filter Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white hover:bg-white/10 relative"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Platforms
                      {appliedFiltersCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-accent text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {appliedFiltersCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-background border-white/10 text-white">
                    <DropdownMenuLabel>Streaming Platforms</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {STREAMING_PLATFORMS.map(platform => (
                      <DropdownMenuCheckboxItem
                        key={platform.id}
                        checked={platformFilters.includes(platform.id)}
                        onCheckedChange={() => togglePlatformFilter(platform.id)}
                        className="cursor-pointer"
                      >
                        {platform.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                    {platformFilters.length > 0 && (
                      <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <div className="px-2 py-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={clearPlatformFilters}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

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

            {/* Advanced Filter Panel (Optional) */}
            {showFilterPanel && (
              <div className="mb-6 p-4 bg-black/30 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Available on:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {STREAMING_PLATFORMS.map(platform => (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`platform-${platform.id}`}
                        checked={platformFilters.includes(platform.id)}
                        onCheckedChange={() => togglePlatformFilter(platform.id)}
                      />
                      <label
                        htmlFor={`platform-${platform.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {platform.name}
                      </label>
                    </div>
                  ))}
                </div>
                {platformFilters.length > 0 && (
                  <Button
                    variant="outline"
                    size="xs"
                    className="mt-3"
                    onClick={clearPlatformFilters}
                  >
                    Clear Platform Filters
                  </Button>
                )}
              </div>
            )}
            
            <Tabs defaultValue="popular" onValueChange={(value) => setActiveTab(value as 'popular' | 'top_rated' | 'trending')}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <TabsList className="mb-4 md:mb-0">
                  <TabsTrigger value="popular" className="data-[state=active]:bg-accent/20">Popular</TabsTrigger>
                  <TabsTrigger value="top_rated" className="data-[state=active]:bg-accent/20">Top Rated</TabsTrigger>
                  <TabsTrigger value="trending" className="data-[state=active]:bg-accent/20">Trending</TabsTrigger>
                </TabsList>
                
                {/* Platform Filter Summary */}
                {platformFilters.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center text-sm text-white/70">
                    <span>Showing on:</span>
                    {platformFilters.map(platformId => {
                      const platform = STREAMING_PLATFORMS.find(p => p.id === platformId);
                      return platform ? (
                        <span key={platformId} className="px-2 py-1 rounded-full bg-accent/20 text-xs">
                          {platform.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              
              <TabsContent value="popular" className="focus-visible:outline-none animate-fade-in">
                {popularTVQuery.isLoading ? (
                  <MediaGridSkeleton listView={viewMode === 'list'} />
                ) : popularTVQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={ensureExtendedMediaArray(filteredPopularShows)} title="Popular TV Shows" listView={viewMode === 'list'} />
                    {hasMorePopular && (
                      <div className="flex justify-center my-8">
                        <Button
                          onClick={handleShowMorePopular}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                        >
                          {popularTVQuery.isFetching ? (
                            <>Loading...</>
                          ) : (
                            <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="top_rated" className="focus-visible:outline-none animate-fade-in">
                {topRatedTVQuery.isLoading ? (
                  <MediaGridSkeleton listView={viewMode === 'list'} />
                ) : topRatedTVQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={ensureExtendedMediaArray(filteredTopRatedShows)} title="Top Rated TV Shows" listView={viewMode === 'list'} />
                    {hasMoreTopRated && (
                      <div className="flex justify-center my-8">
                        <Button
                          onClick={handleShowMoreTopRated}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                        >
                          {topRatedTVQuery.isFetching ? (
                            <>Loading...</>
                          ) : (
                            <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="trending" className="focus-visible:outline-none animate-fade-in">
                {trendingTVQuery.isLoading ? (
                  <MediaGridSkeleton listView={viewMode === 'list'} />
                ) : trendingTVQuery.isError ? (
                  <div className="py-12 text-center text-white">Error loading TV shows. Please try again.</div>
                ) : (
                  <>
                    <MediaGrid media={ensureExtendedMediaArray(filteredTrendingShows)} title="Trending TV Shows" listView={viewMode === 'list'} />
                    {hasMoreTrending && (
                      <div className="flex justify-center my-8">
                        <Button
                          onClick={handleShowMoreTrending}
                          variant="outline"
                          className="border-white/10 text-white hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all duration-300"
                        >
                          {trendingTVQuery.isFetching ? (
                            <>Loading...</>
                          ) : (
                            <>Show More <ChevronDown className="ml-2 h-4 w-4 animate-bounce" /></>
                          )}
                        </Button>
                      </div>
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
