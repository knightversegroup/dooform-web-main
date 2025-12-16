"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import Sidebar from "@/app/components/Layout/Sidebar";
import { SidebarProvider, useSidebar } from "@/app/components/Layout/SidebarContext";
import Navbar from "@/app/components/Layout/Navbar";
import { Loader2 } from "lucide-react";

// Main content component that uses sidebar width
function MainContent({ children }: { children: React.ReactNode }) {
  const { width, isResizing } = useSidebar();

  return (
    <main
      className={`pt-14 min-h-screen ${
        isResizing ? "" : "transition-[padding-left] duration-150 ease-out"
      }`}
      style={{ paddingLeft: `${width}px` }}
    >
      <div className="p-6">{children}</div>
    </main>
  );
}

// Desktop layout with sidebar provider
function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="hidden lg:block min-h-screen bg-[#f5f5f7]">
        {/* Fixed Navbar at top */}
        <Navbar />

        {/* Fixed Sidebar */}
        <Sidebar />

        {/* Main content area - offset by navbar height and dynamic sidebar width */}
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <Loader2 className="w-5 h-5 text-black/30 animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile block screen */}
      <div className="lg:hidden min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 mb-6 rounded-2xl bg-neutral-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">
          ใช้งานบนคอมพิวเตอร์
        </h1>
        <p className="text-sm text-neutral-500 max-w-xs">
          Dooform ยังไม่รองรับการใช้งานบนมือถือ
          กรุณาเปิดใช้งานบนคอมพิวเตอร์หรือแท็บเล็ต
        </p>
      </div>

      {/* Desktop layout */}
      <DesktopLayout>{children}</DesktopLayout>
    </>
  );
}
