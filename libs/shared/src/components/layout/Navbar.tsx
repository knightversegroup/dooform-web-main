"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, LucideIcon } from "lucide-react";
import { useAuth } from "../../auth/hooks";
import { DooformLogo } from "../ui/DooformLogo";

const DEFAULT_PROFILE_IMAGE = "/profile_default.webp";

export interface NavTab {
  name: string;
  href: string;
  icon: LucideIcon;
  position: "left" | "right";
}

export interface NavbarProps {
  tabs: NavTab[];
  logoHref?: string;
  badge?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  profileHref?: string;
  onLogout?: () => void;
}

export function Navbar({
  tabs,
  logoHref = "/",
  badge,
  showSearch = false,
  searchPlaceholder = "ค้นหา...",
  profileHref,
  onLogout,
}: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    onLogout?.();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Nav Bar */}
      <div className="flex flex-col justify-center h-16 py-2.5 px-2.5 bg-stone-100">
        <div className="flex items-center justify-between w-full max-w-[1080px] mx-auto h-8 px-2">
          {/* Logo */}
          <Link href={logoHref} className="flex items-center gap-2 p-1">
            <DooformLogo width={106} height={20} className="shrink-0" />
            {badge && (
              <span className="text-xs bg-blue-900/10 text-blue-900 px-2 py-0.5 rounded-full font-medium font-sans">
                {badge}
              </span>
            )}
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            {showSearch && (
              <div className="relative flex items-center w-64 h-8 px-3 py-1 bg-white border border-neutral-400 rounded">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  className="flex-1 text-sm font-medium font-sans text-neutral-400 placeholder-neutral-400 bg-transparent outline-none"
                />
                <svg
                  className="w-5 h-5 text-neutral-400"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            )}

            {/* Account menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 px-2 py-1 h-8 bg-blue-900 border border-blue-900 rounded text-white text-sm font-medium font-sans"
              >
                <span>จัดการบัญชี</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                  <div className="px-3 py-2 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <img
                        src={user?.picture_url || DEFAULT_PROFILE_IMAGE}
                        alt={user?.display_name || "Profile"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {user?.display_name ||
                            user?.first_name ||
                            user?.email?.split("@")[0] ||
                            "User"}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  {profileHref && (
                    <div className="py-1">
                      <Link
                        href={profileHref}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                      >
                        <User className="w-4 h-4 opacity-50" />
                        <span>ตั้งค่าบัญชี</span>
                      </Link>
                    </div>
                  )}
                  <div className="border-t border-neutral-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    >
                      <LogOut className="w-4 h-4 opacity-50" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex h-12 px-2.5 bg-stone-100 border-b border-neutral-200">
        <div className="flex items-center justify-between w-full max-w-[1080px] mx-auto h-12">
          {/* Left tabs */}
          <div className="flex items-center gap-3 h-12">
            {tabs
              .filter((tab) => tab.position === "left")
              .map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2.5 px-2 py-1 h-12 text-sm font-medium font-sans transition-colors border-b-2 ${
                    isActive(tab.href)
                      ? "text-blue-900 border-blue-900"
                      : "text-neutral-600 border-transparent hover:text-blue-900"
                  }`}
                >
                  <tab.icon className="w-5 h-5" strokeWidth={1.67} />
                  <span>{tab.name}</span>
                </Link>
              ))}
          </div>

          {/* Right tabs */}
          <div className="flex items-center gap-2.5 px-2 py-1 h-12">
            {tabs
              .filter((tab) => tab.position === "right")
              .map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2.5 px-2 py-1 h-12 text-sm font-medium font-sans transition-colors border-b-2 ${
                    isActive(tab.href)
                      ? "text-blue-900 border-blue-900"
                      : "text-neutral-600 border-transparent hover:text-blue-900"
                  }`}
                >
                  <tab.icon className="w-5 h-5" strokeWidth={1.67} />
                  <span>{tab.name}</span>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
}
