"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  User,
  LogOut,
  FileText,
  Settings,
  History,
  BookMarked,
  BookOpenText,
  Search,
  Key,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useSidebar } from "./SidebarContext";

const DEFAULT_PROFILE_IMAGE = "/profile_default.webp";

const NAV_TABS = [
  // Left side
  { name: "รายการเอกสาร", href: "/templates", icon: FileText, position: "left" },
  { name: "ประวัติการกรอก", href: "/history", icon: History, position: "left" },
  { name: "คลังคำศัพท์", href: "/dictionary", icon: BookMarked, position: "left" },
  // Right side
  { name: "คู่มือการใช้งาน", href: "/docs", icon: BookOpenText, position: "right" },
];

// Admin navigation (only visible to admins)
const ADMIN_TABS = [
  { name: "ตั้งค่าระบบ", href: "/console", icon: Settings, position: "left" },
  { name: "จัดการผู้ใช้", href: "/admin/users", icon: Users, position: "left" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAppsMenuOpen, setIsAppsMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const appsMenuRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        appsMenuRef.current &&
        !appsMenuRef.current.contains(event.target as Node)
      ) {
        setIsAppsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top Nav Bar */}
      <div className="flex flex-col justify-center h-16 py-2.5 px-2.5 bg-stone-100">
        {/* Inner container */}
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto h-8 px-2">
          {/* Logo - Padding: 4px */}
          <Link href="/templates" className="flex items-center p-1">
            <Image
              src="/Vector.svg"
              alt="Dooform"
              width={106}
              height={20}
              className="shrink-0"
            />
          </Link>

          {/* Right side container - Gap: 12px */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex items-center w-64 h-8 px-3 py-1 bg-white border border-neutral-400 rounded">
              <input
                type="text"
                placeholder="ค้นหาเอกสาร..."
                className="flex-1 text-sm font-medium font-sans text-neutral-400 placeholder-neutral-400 bg-transparent outline-none"
              />
              <Search className="w-5 h-5 text-neutral-400" />
            </div>

            {/* จัดการบัญชี */}
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
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    >
                      <User className="w-4 h-4 opacity-50" />
                      <span>ตั้งค่าบัญชี</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin/tokens"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                      >
                        <Key className="w-4 h-4 opacity-50" />
                        <span>จัดการ Token</span>
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-neutral-100 py-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
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
        {/* Inner container */}
        <div className="flex items-center justify-between w-full max-w-5xl mx-auto h-12">
          {/* Left tabs - Gap: 12px */}
          <div className="flex items-center gap-3 h-12">
            {NAV_TABS.filter((tab) => tab.position === "left").map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2.5 px-2 py-1 h-12 text-sm font-medium font-sans transition-colors border-b-2 ${
                    isActive
                      ? "text-blue-900 border-blue-900"
                      : "text-neutral-600 border-transparent hover:text-blue-900"
                  }`}
                >
                  <tab.icon className="w-5 h-5" strokeWidth={1.67} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
            {/* Admin tabs - Only visible to admins */}
            {isAdmin && ADMIN_TABS.filter((tab) => tab.position === "left").map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2.5 px-2 py-1 h-12 text-sm font-medium font-sans transition-colors border-b-2 ${
                    isActive
                      ? "text-blue-900 border-blue-900"
                      : "text-neutral-600 border-transparent hover:text-blue-900"
                  }`}
                >
                  <tab.icon className="w-5 h-5" strokeWidth={1.67} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right tabs */}
          <div className="flex items-center gap-2.5 px-2 py-1 h-12">
            {NAV_TABS.filter((tab) => tab.position === "right").map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2.5 px-2 py-1 h-12 text-sm font-medium font-sans transition-colors border-b-2 ${
                    isActive
                      ? "text-blue-900 border-blue-900"
                      : "text-neutral-600 border-transparent hover:text-blue-900"
                  }`}
                >
                  <tab.icon className="w-5 h-5" strokeWidth={1.67} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
