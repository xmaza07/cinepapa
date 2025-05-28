
import React, { useState, useEffect } from 'react';
import PWAInstallPrompt from './PWAInstallPrompt';
import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks';
import { useIsMobile } from '@/hooks/use-mobile';
import AnimatedLogo from './navigation/AnimatedLogo';
import TechVideoBackground from './navigation/TechVideoBackground';
import SearchBar from './navigation/SearchBar';
import NavLinks from './navigation/NavLinks';
import MobileMenu from './navigation/MobileMenu';
import UserMenu from './navigation/UserMenu';
import AuthButtons from './navigation/AuthButtons';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Show install prompt after a delay
    setTimeout(() => {
      setShowInstallPrompt(true);
    }, 5000);
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
    setIsSearchExpanded(!isSearchExpanded);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'nav-scrolled' : 'nav-transparent'
    }`}>
      {/* Tech Video Background - Only on desktop */}
      {!isMobile && <TechVideoBackground />}
      
      <div className="container mx-auto px-4 py-3 relative z-10">
        <div className="flex items-center justify-between">
          {/* Logo area - always visible */}
          <div className="flex items-center">
            <AnimatedLogo isMobile={isMobile} />
          </div>
          
          {/* Desktop nav links - hidden on mobile */}
          <div className="hidden md:flex items-center justify-center ml-8">
            <NavLinks />
          </div>

          {/* Right side: Search, Profile/Auth, Menu button */}
          <div className="flex items-center gap-3">
            {/* Desktop search bar - hidden on mobile */}
            <div className="hidden md:block">
              <SearchBar />
            </div>
            
            {/* Mobile search - Only visible on mobile */}
            {isMobile && !isSearchExpanded && (
              <SearchBar 
                isMobile 
                expanded={isSearchExpanded} 
                onToggleExpand={toggleSearch}
              />
            )}

            {/* Expanded mobile search takes full width - Only visible when expanded */}
            {isMobile && isSearchExpanded && (
              <div className="absolute inset-x-0 top-0 p-3 bg-black/95 backdrop-blur-xl z-50 flex items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleSearch}
                  className="mr-2 text-white hover:bg-white/10"
                >
                  <Menu className="h-6 w-6" />
                </Button>
                <SearchBar 
                  isMobile 
                  expanded={true} 
                  onToggleExpand={toggleSearch} 
                  className="flex-1"
                  onSearch={toggleSearch}
                />
              </div>
            )}
            
            {/* User menu or auth buttons */}
            {!isSearchExpanded && (
              <>
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
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu overlay */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </header>
  );
};

export default Navbar;
