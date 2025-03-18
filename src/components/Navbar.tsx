
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Home, Film, Tv, TrendingUp, Menu, X, Keyboard } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import InstallPWAButton from './InstallPWAButton';

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const navItems: NavItem[] = [
    { title: 'Home', path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
    { title: 'Movies', path: '/movies', icon: <Film className="h-4 w-4 mr-2" /> },
    { title: 'TV Shows', path: '/tv', icon: <Tv className="h-4 w-4 mr-2" /> },
    { title: 'Trending', path: '/trending', icon: <TrendingUp className="h-4 w-4 mr-2" /> },
  ];

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show keyboard hint on first visit
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('hasSeenKeyboardHint');
    if (!hasSeenHint) {
      setTimeout(() => {
        setShowKeyboardHint(true);
        localStorage.setItem('hasSeenKeyboardHint', 'true');
      }, 5000);
    }
  }, []);

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMobileMenuOpen(false);
    }
  };

  // Show keyboard shortcut toast
  const showKeyboardShortcutToast = () => {
    toast({
      title: "Keyboard Shortcut",
      description: "Press / to quickly focus the search bar from anywhere",
      duration: 5000,
    });
    setShowKeyboardHint(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen ? 'glass py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center text-white text-xl font-bold transition-transform hover:scale-105"
        >
          <span className="text-accent">Let's</span>
          <span className="ml-1">Stream</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md flex items-center text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? 'text-accent bg-white/10'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center relative ml-4">
          <div className="relative group">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search... (Press /)"
              className="w-[180px] bg-white/10 border-white/10 pl-9 text-white placeholder:text-white/50 focus:bg-white/15"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Keyboard shortcut hint */}
            {showKeyboardHint && (
              <div 
                className="absolute right-0 top-full mt-2 bg-background border border-white/10 p-2 rounded text-xs text-white animate-fade-in z-50"
                onClick={showKeyboardShortcutToast}
              >
                <div className="flex items-center cursor-pointer">
                  <Keyboard className="h-3 w-3 mr-1 text-accent" />
                  Press / for quick search
                </div>
              </div>
            )}
          </div>
          <Button type="submit" variant="ghost" size="sm" className="ml-2 hidden">
            Search
          </Button>
        </form>
        
        {/* Install PWA Button */}
        <div className="hidden md:block ml-2">
          <InstallPWAButton />
        </div>
        
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass animate-fade-in">
          <div className="px-4 py-3 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                  location.pathname === item.path
                    ? 'text-accent bg-white/10'
                    : 'text-white hover:text-accent hover:bg-white/5'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
            <form onSubmit={handleSearch} className="pt-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full bg-white/10 border-white/10 pl-9 text-white placeholder:text-white/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>
            
            {/* Mobile Install PWA Button */}
            <div className="pt-2">
              <InstallPWAButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
