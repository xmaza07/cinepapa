import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from './Logo';
import NavLinks from './NavLinks';
import { useAuth } from '@/hooks';
import UserMenu from './UserMenu';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ANIMATION_DURATION = 300; // ms, matches Tailwind duration-300

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Handle mount/unmount for animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, ANIMATION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap (basic)
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const firstFocusable = menuRef.current.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [isOpen]);

  // Full focus trap
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const menu = menuRef.current;
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    const getFocusable = () => Array.from(menu.querySelectorAll<HTMLElement>(focusableSelectors.join(',')));

    const handleTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusableEls = getFocusable();
      if (focusableEls.length === 0) return;
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      const active = document.activeElement;
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    };
    document.addEventListener('keydown', handleTrap);
    return () => document.removeEventListener('keydown', handleTrap);
  }, [isOpen]);

  // Only render if visible
  if (!visible) return null;

  // Handle close with animation
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onClose();
    }, ANIMATION_DURATION);
  };

  // Portal content
  const menuContent = (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity duration-300"
        aria-hidden="true"
        onClick={handleClose}
      />
      {/* Menu panel */}
      <div
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        className={`mobile-menu fixed right-0 top-0 h-full w-4/5 max-w-xs bg-neutral-900 shadow-xl transition-transform duration-300 transform ${closing ? 'translate-x-full' : 'translate-x-0'}`}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Logo />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <NavLinks mobile onClick={handleClose} />
        </div>
        
        <div className="p-5 border-t border-white/10">
          {user ? (
            <UserMenu mobile onAction={handleClose} />
          ) : (
            <div className="flex gap-3 justify-center">
              <Button onClick={handleClose} variant="gradient" asChild>
                <a href="/login" className="flex items-center gap-2">
                  <span>Log In</span>
                </a>
              </Button>
              <Button onClick={handleClose} variant="outline" asChild>
                <a href="/signup">Sign Up</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(menuContent, document.body);
};

export default MobileMenu;
