
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchMedia } from '@/utils/api';
import { Media } from '@/utils/types';
import Navbar from '@/components/Navbar';
import MediaGrid from '@/components/MediaGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, X } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const navigate = useNavigate();

  // Fetch search results when query changes
  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (!searchQuery) return;

    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        const results = await searchMedia(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
    setQuery(searchQuery);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    navigate('/search');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 px-4 md:px-8 max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Search</h1>
        
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="search"
                placeholder="Search for movies, TV shows..."
                className="bg-white/10 border-white/10 pl-10 text-white placeholder:text-white/50 h-12"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <SearchIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button type="submit" className="bg-accent hover:bg-accent/80 h-12 px-6">
              Search
            </Button>
          </div>
        </form>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse-slow text-white">Loading results...</div>
          </div>
        ) : (
          <>
            {searchParams.get('q') ? (
              <MediaGrid 
                media={searchResults} 
                title={`Results for "${searchParams.get('q')}"`} 
              />
            ) : (
              <div className="text-center py-12 text-white/70">
                <p>Enter a search term to find movies and TV shows</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
