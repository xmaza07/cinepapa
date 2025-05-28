
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, Film, Tv2, Trophy, Flame, Search, User, History, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import AnimatedLogo from './AnimatedLogo';
import TechVideoBackground from './TechVideoBackground';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      x: '100%',
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
        staggerChildren: 0.05,
        when: 'beforeChildren',
      },
    },
  };

  const menuItemVariants = {
    closed: {
      opacity: 0,
      x: 20,
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Movies', path: '/movie', icon: Film },
    { name: 'TV Shows', path: '/tv', icon: Tv2 },
    { name: 'Sports', path: '/sports', icon: Trophy },
    { name: 'Trending', path: '/trending', icon: Flame },
    { name: 'Search', path: '/search', icon: Search },
  ];

  if (user) {
    menuItems.push(
      { name: 'Profile', path: '/profile', icon: User },
      { name: 'Watch History', path: '/watch-history', icon: History }
    );
  } else {
    menuItems.push(
      { name: 'Login', path: '/login', icon: User },
      { name: 'Sign Up', path: '/signup', icon: User }
    );
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Menu */}
      <motion.div
        className="fixed top-0 right-0 bottom-0 w-64 bg-background/95 backdrop-blur-lg shadow-lg z-50 overflow-y-auto"
        variants={menuVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
      >
        {/* Tech Video Background for Mobile */}
        <TechVideoBackground className="opacity-30" />
        
        {/* Header with Logo and Close Button */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <AnimatedLogo isMobile={true} />
          <button 
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white transition-colors rounded-md hover:bg-white/10"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="px-4 pb-6 relative z-10">
          <ul className="space-y-1 mt-4">
            {menuItems.map((item) => (
              <motion.li key={item.path} variants={menuItemVariants}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    "flex items-center py-3 px-4 rounded-md transition-all duration-200",
                    "hover:bg-white/10 hover:translate-x-1",
                    isActive(item.path)
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border-l-2 border-blue-400"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  <motion.div
                    whileHover={{ rotate: 5 }}
                    className="mr-3"
                  >
                    <item.icon size={18} />
                  </motion.div>
                  {item.name}
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>
      </motion.div>
    </>
  );
};

export default MobileMenu;
