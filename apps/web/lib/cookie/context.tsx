'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type CookieConsentType = 'all' | 'necessary' | 'custom' | null;

export interface CookiePreferences {
  necessary: boolean; // Always true - required for site functionality
  analytics: boolean; // Google Analytics
  marketing: boolean; // GTM for marketing/targeting
}

export interface CookieConsentContextType {
  consent: CookieConsentType;
  preferences: CookiePreferences;
  isConsentGiven: boolean;
  showBanner: boolean;
  acceptAll: () => void;
  acceptNecessary: () => void;
  acceptCustom: (preferences: Partial<CookiePreferences>) => void;
  resetConsent: () => void;
  openSettings: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const COOKIE_CONSENT_KEY = 'dooform_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'dooform_cookie_preferences';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

interface CookieConsentProviderProps {
  children: ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [consent, setConsent] = useState<CookieConsentType>(null);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load consent state from localStorage on mount
  useEffect(() => {
    const loadConsentState = () => {
      try {
        const storedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);
        const storedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);

        if (storedConsent) {
          setConsent(storedConsent as CookieConsentType);
          if (storedPreferences) {
            setPreferences(JSON.parse(storedPreferences));
          }
          setShowBanner(false);
        } else {
          // No consent given yet, show banner
          setShowBanner(true);
        }
      } catch (error) {
        console.error('[CookieConsent] Failed to load consent state:', error);
        setShowBanner(true);
      } finally {
        setIsInitialized(true);
      }
    };

    loadConsentState();
  }, []);

  // Save consent state to localStorage
  const saveConsent = useCallback((newConsent: CookieConsentType, newPreferences: CookiePreferences) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, newConsent as string);
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(newPreferences));

      // Update GTM consent state
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: newPreferences.analytics ? 'granted' : 'denied',
          ad_storage: newPreferences.marketing ? 'granted' : 'denied',
          ad_user_data: newPreferences.marketing ? 'granted' : 'denied',
          ad_personalization: newPreferences.marketing ? 'granted' : 'denied',
        });
      }
    } catch (error) {
      console.error('[CookieConsent] Failed to save consent state:', error);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setConsent('all');
    setPreferences(newPreferences);
    setShowBanner(false);
    saveConsent('all', newPreferences);
  }, [saveConsent]);

  const acceptNecessary = useCallback(() => {
    const newPreferences: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    setConsent('necessary');
    setPreferences(newPreferences);
    setShowBanner(false);
    saveConsent('necessary', newPreferences);
  }, [saveConsent]);

  const acceptCustom = useCallback((customPreferences: Partial<CookiePreferences>) => {
    const newPreferences: CookiePreferences = {
      necessary: true, // Always required
      analytics: customPreferences.analytics ?? false,
      marketing: customPreferences.marketing ?? false,
    };
    setConsent('custom');
    setPreferences(newPreferences);
    setShowBanner(false);
    saveConsent('custom', newPreferences);
  }, [saveConsent]);

  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    } catch (error) {
      console.error('[CookieConsent] Failed to reset consent:', error);
    }
    setConsent(null);
    setPreferences(defaultPreferences);
    setShowBanner(true);
  }, []);

  const openSettings = useCallback(() => {
    setShowBanner(true);
  }, []);

  const value: CookieConsentContextType = {
    consent,
    preferences,
    isConsentGiven: consent !== null,
    showBanner: isInitialized && showBanner,
    acceptAll,
    acceptNecessary,
    acceptCustom,
    resetConsent,
    openSettings,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
