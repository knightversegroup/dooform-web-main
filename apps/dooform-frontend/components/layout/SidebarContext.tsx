"use client";

import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 400;
const SIDEBAR_DEFAULT_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const STORAGE_KEY = "sidebar-width";

export interface SidebarContextType {
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

export const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [width, setWidthState] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

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

  useEffect(() => {
    if (isHydrated && !isCollapsed) {
      localStorage.setItem(STORAGE_KEY, width.toString());
    }
  }, [width, isHydrated, isCollapsed]);

  const setWidth = useCallback((newWidth: number) => {
    setWidthState(Math.min(Math.max(newWidth, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH));
  }, []);

  const toggleCollapse = useCallback(() => setIsCollapsed((prev) => !prev), []);
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

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
