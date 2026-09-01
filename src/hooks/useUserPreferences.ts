'use client';

import { useState, useEffect } from 'react';

export type CompressionLevel = 'high' | 'balanced' | 'maximum';
export type ViewLayout = 'grid' | 'list';

interface UserPreferences {
  compressionLevel: CompressionLevel;
  viewLayout: ViewLayout;
  soundAlert: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  compressionLevel: 'balanced',
  viewLayout: 'list',
  soundAlert: true,
};

/**
 * Custom hook to manage and persist client-side user dashboard and engine settings.
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

//   useEffect(() => {
//     try {
//       const stored = localStorage.getItem('uc_user_preferences');
//       if (stored) {
//         // setPreferences(JSON.parse(stored));
//                 setPreferences(() => JSON.parse(stored));
//       }
//     } catch (error) {
//       console.error('Failed to read user preferences from localStorage:', error);
//     } finally {
//       setIsHydrated(true);
//     }
//   }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('uc_user_preferences');
      if (stored) {
        // Pushing execution to the macro-task queue to completely bypass synchronous render alerts
        setTimeout(() => {
          setPreferences(JSON.parse(stored));
        }, 0);
      }
    } catch (error) {
      console.error('Failed to read user preferences from localStorage:', error);
    } finally {
      setTimeout(() => {
        setIsHydrated(true);
      }, 0);
    }
  }, []);


  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem('uc_user_preferences', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to write user preferences to localStorage:', error);
      }
      return updated;
    });
  };

  return {
    ...preferences,
    isHydrated,
    setCompressionLevel: (level: CompressionLevel) => updatePreference('compressionLevel', level),
    setViewLayout: (layout: ViewLayout) => updatePreference('viewLayout', layout),
    setSoundAlert: (isActive: boolean) => updatePreference('soundAlert', isActive),
  };
}
