import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"


// Consider moving this type to a shared types file if reused elsewhere
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}


const PWAInstallPrompt = ({
  promptTitle = "Install App?",
  promptDescription = "Install this app for offline access and a better experience.",
  installButtonLabel = "Install",
  installedMessage = "The app has been installed successfully!",
  installStartedMessage = "The app installation has started.",
  installCancelledMessage = "You can install the app later from the menu.",
  installFailedMessage = "There was an error installing the app. Please try again.",
}: {
  promptTitle?: string;
  promptDescription?: string;
  installButtonLabel?: string;
  installedMessage?: string;
  installStartedMessage?: string;
  installCancelledMessage?: string;
  installFailedMessage?: string;
}) => {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(() => {
    // Improve detection: check localStorage and display-mode
    return (
      localStorage.getItem('app-installed') === 'true' ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  });
  const [promptVisible, setPromptVisible] = useState(false);
  const [cardDismissed, setCardDismissed] = useState(false);




  // Prevent multiple toasts
  // Prevent multiple toasts
  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsAppInstalled(true);
        localStorage.setItem('app-installed', 'true');
        toast({
          title: "Installation Started",
          description: installStartedMessage,
        });
      } else {
        toast({
          title: "Installation Cancelled",
          description: installCancelledMessage,
        });
      }
      setDeferredPrompt(null);
      setPromptVisible(false);
    } catch (error) {
      toast({
        title: "Installation Failed",
        description: installFailedMessage,
        variant: "destructive"
      });
      setPromptVisible(false);
    }
  }, [deferredPrompt, toast, installStartedMessage, installCancelledMessage, installFailedMessage]);

  // Show the card only if not dismissed
  const showInstallCard = useCallback(() => {
    if (promptVisible || cardDismissed) return;
    setPromptVisible(true);
  }, [promptVisible, cardDismissed]);



  useEffect(() => {
    // Handler for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isAppInstalled) {
        showInstallCard();
      }
    };

    // Handler for appinstalled
    const handleAppInstalled = (e: Event) => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      localStorage.setItem('app-installed', 'true');
      toast({
        title: "Successfully Installed",
        description: installedMessage,
      });
      setPromptVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast, isAppInstalled, showInstallCard, installedMessage]);

  // Accessibility: aria-live for prompt
  // Card-style popup UI
  if (!deferredPrompt || isAppInstalled || !promptVisible || cardDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-xs w-full" aria-live="polite">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-5 flex flex-col gap-3 animate-fade-in">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-base text-neutral-900 dark:text-white">{promptTitle}</span>
          <button
            onClick={() => { setCardDismissed(true); setPromptVisible(false); }}
            className="ml-2 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none"
            aria-label="Dismiss install prompt"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">{promptDescription}</div>
        <Button
          variant="default"
          size="lg"
          onClick={handleInstallClick}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label={installButtonLabel}
        >
          {installButtonLabel}
        </Button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
