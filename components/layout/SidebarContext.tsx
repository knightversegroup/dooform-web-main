"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

// ============================================================================
// Constants
// ============================================================================

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_DEFAULT_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const STORAGE_KEY = "sidebar-width";

// ============================================================================
// Types
// ============================================================================

interface SidebarContextType {
  width: number;
  isCollapsed: boolean;
  isResizing: boolean;
  setWidth: (width: number) => void;
  toggleCollapse: () => void;
  startResizing: () => void;
  stopResizing: () => void;
  minWidth: number;
  maxWidth: number;
  collapsedWidth: number;
}

// ============================================================================
// Context
// ============================================================================

const SidebarContext = createContext<SidebarContextType | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [width, setWidthState] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= SIDEBAR_MIN_WIDTH && parsed <= SIDEBAR_MAX_WIDTH) {
        setWidthState(parsed);
      }
    }
    setIsHydrated(true);
  }, []);

  // Save width to localStorage when it changes
  useEffect(() => {
    if (isHydrated && !isCollapsed) {
      localStorage.setItem(STORAGE_KEY, width.toString());
    }
  }, [width, isHydrated, isCollapsed]);

  const setWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.min(Math.max(newWidth, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH);
    setWidthState(clampedWidth);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : width,
        isCollapsed,
        isResizing,
        setWidth,
        toggleCollapse,
        startResizing,
        stopResizing,
        minWidth: SIDEBAR_MIN_WIDTH,
        maxWidth: SIDEBAR_MAX_WIDTH,
        collapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
