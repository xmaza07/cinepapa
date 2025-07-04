import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { triggerHapticFeedback } from '@/utils/haptic-feedback';
import PWAInstallPrompt from './PWAInstallPrompt';
import { Menu, Search, Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from './navigation/Logo';
import SearchBar from './navigation/SearchBar';
import MobileMenu from './navigation/MobileMenu';
import UserMenu from './navigation/UserMenu';
import AuthButtons from './navigation/AuthButtons';

interface NetflixNavItem {
  label: string;
  href: string;
  active?: boolean;
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();

  const navItems: NetflixNavItem[] = [
    { label: 'Home', href: '/', active: location.pathname === '/' },
    { label: 'TV Shows', href: '/tv', active: location.pathname === '/tv' },
    { label: 'Movies', href: '/movies', active: location.pathname === '/movies' },
    { label: 'New & Popular', href: '/trending', active: location.pathname === '/trending' },
    { label: 'My List', href: '/watchlist', active: location.pathname === '/watchlist' },
  ];

  useEffect(() => {
    // Show install prompt after a delay
    setTimeout(() => {
      setShowInstallPrompt(true);
    }, 5000); // 5 seconds delay
  }, []);

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

  useEffect(() => {
    // Prevent scrolling when mobile menu is open
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleSearch = () => {
    triggerHapticFeedback(15);
    setIsSearchExpanded(!isSearchExpanded);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-black' : 'bg-gradient-to-b from-black/80 to-transparent'
    }`}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-12 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Logo />
            
            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    item.active ? 'text-white font-bold' : 'text-gray-300'
                  }`}
                  onClick={() => triggerHapticFeedback(10)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side: Search, Notifications, Profile */}
          <div className="flex items-center space-x-4">
            {/* Desktop search */}
            <div className="hidden md:block">
              <SearchBar />
            </div>

            {/* Mobile search button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSearch}
                className="text-white hover:bg-white/10"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Notifications - only for logged in users */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex text-white hover:bg-white/10"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
            )}
            
            {/* User menu or auth buttons */}
            {user ? (
              <>
                {showInstallPrompt && <PWAInstallPrompt />}
                <UserMenu />
              </>
            ) : (
              <>
                {showInstallPrompt && <PWAInstallPrompt />}
                <AuthButtons />
              </>
            )}
            
            {/* Mobile menu button - only visible on mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              onClick={() => {
                triggerHapticFeedback(20);
                setIsMobileMenuOpen(true);
              }}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
        
        {/* Expanded mobile search overlay */}
        {isMobile && isSearchExpanded && (
          <div className="fixed inset-0 bg-black z-50 p-4">
            <div className="flex items-center space-x-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSearch}
                className="text-white hover:bg-white/10"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <SearchBar 
                isMobile 
                expanded={true} 
                onToggleExpand={toggleSearch} 
                className="flex-1"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile menu overlay */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => {
          triggerHapticFeedback(20);
          setIsMobileMenuOpen(false);
        }}
      />
    </header>
  );
};

export default Navbar;
