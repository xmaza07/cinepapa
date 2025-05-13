import * as React from "react";
import { useAuth } from "@/hooks";
import { ToastAction, type ToastActionElement } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import type { FeatureNotification } from "../api/feature-notifications";
import { fetchFeatureNotifications } from "../api/feature-notifications";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserPreferences } from "@/contexts/types/user-preferences";

// NOTE: This file must be named .tsx to support JSX below!
export function useFeatureNotifications(): void {
  const { user } = useAuth();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!user) return;

    const checkForNewFeatures = async () => {
      try {
        // Check if notifications are enabled in user preferences
        const userPreferencesRef = doc(db, "userPreferences", user.uid);
        const userPreferencesDoc = await getDoc(userPreferencesRef);
        const userPreferences = userPreferencesDoc.data() as UserPreferences | undefined;

        // If notifications are explicitly disabled, do not show any notifications
        if (userPreferences?.isNotificationsEnabled === false) {
          return;
        }

        const lastSeenVersion = localStorage.getItem(`lastSeenFeature-${user.uid}`) || "0.0.0";
        const { notifications, currentVersion } = await fetchFeatureNotifications();
        
        notifications.forEach((feature: FeatureNotification) => {
          if (feature.version > lastSeenVersion) {
            // Show the main feature notification
            toast({
              title: feature.title,
              description: feature.description,
              duration: 10000, // 10 seconds
              variant: "default",
              action: (
                <ToastAction
                  aria-label="Acknowledge new feature"
                  onClick={() => {
                    localStorage.setItem(`lastSeenFeature-${user.uid}`, feature.version);
                  }}
                >
                  Got it!
                </ToastAction>
              ) as ToastActionElement
            });

            // If there is a details link, show a follow-up notification
            if (feature.details?.link) {
              setTimeout(() => {
                toast({
                  title: "Want to learn more?",
                  description: "Click here to see the details of this new feature.",
                  duration: 8000,
                  variant: "default",
                  action: (
                    <ToastAction
                      aria-label="Learn more about the new feature"
                      onClick={() => {
                        window.open(feature.details?.link || "", "_blank");
                      }}
                    >
                      Learn More
                    </ToastAction>
                  ) as ToastActionElement
                });
              }, 3000);
            }
          }
        });

        // Update the last seen version to the current version
        localStorage.setItem(`lastSeenFeature-${user.uid}`, currentVersion);
      } catch (error) {
        console.error("Error checking for new features:", error);
      }
    };

    // Check for new features when the component mounts
    checkForNewFeatures();

    // Also check when the tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForNewFeatures();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, toast]);

  // No return needed
}
