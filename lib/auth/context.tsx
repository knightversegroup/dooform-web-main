'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { AuthContextType, User, AuthResponse } from './types';
import { apiClient } from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'dooform_auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const authData = JSON.parse(stored);
          setUser(authData.user);
          setAccessToken(authData.accessToken);
          setRefreshToken(authData.refreshToken);
          apiClient.setAccessToken(authData.accessToken);

          // Check if profile needs to be completed
          if (authData.user && !authData.user.profile_completed) {
            const currentPath = window.location.pathname;
            if (currentPath !== '/profile/setup' &&
                !currentPath.startsWith('/login') &&
                !currentPath.startsWith('/auth/line/callback')) {
              window.location.href = '/profile/setup';
            }
          }
        }
      } catch (error) {
        console.error('[AuthContext] Failed to load auth state:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadAuthState();
  }, []);

  // Save auth state to localStorage and sync with API client whenever it changes
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (user && accessToken && refreshToken) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user, accessToken, refreshToken })
      );
      apiClient.setAccessToken(accessToken);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      apiClient.setAccessToken(null);
    }
  }, [user, accessToken, refreshToken, isInitialized]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();

      let data: AuthResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Server returned invalid response (${response.status}): ${responseText}`);
      }

      if (!response.ok || !data.success) {
        const errorMessage = data.message || 'Login failed';
        throw new Error(errorMessage);
      }

      setUser(data.data.user);
      setAccessToken(data.data.access_token);
      setRefreshToken(data.data.refresh_token);

      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    router.push('/login');
  }, [router]);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Token refresh failed');
      }

      setAccessToken(data.data.access_token);
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      throw error;
    }
  }, [refreshToken, logout]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      return { ...prevUser, ...updates };
    });
  }, []);

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!user && !!accessToken,
    isLoading: isLoading || !isInitialized,
    login,
    logout,
    refreshAccessToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
