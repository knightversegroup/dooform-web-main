"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  HelpCircle,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  FileText,
  Settings,
  BarChart3,
  Users,
  Folder,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useSidebar } from "./SidebarContext";

const DEFAULT_PROFILE_IMAGE = "/profile_default.webp";

const APPS_MENU_ITEMS = [
  {
    name: "Forms",
    href: "/forms",
    icon: FileText,
    description: "Create and manage forms",
  },
  {
    name: "Templates",
    href: "/templates",
    icon: Folder,
    description: "Browse templates",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "View analytics",
  },
  { name: "Team", href: "/team", icon: Users, description: "Manage team" },
  {
    name: "Automations",
    href: "/automations",
    icon: Zap,
    description: "Workflow automations",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "App settings",
  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isCollapsed, toggleCollapse } = useSidebar();
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side - Sidebar toggle and Logo */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCollapse}
              className="flex items-center justify-center w-8 h-8 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {/* Apps Menu */}
            <div className="relative" ref={appsMenuRef}>
              <button
                onClick={() => setIsAppsMenuOpen(!isAppsMenuOpen)}
                className="flex items-center justify-center w-8 h-8 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Apps"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>

              {isAppsMenuOpen && (
                <div className="fixed top-15 left-1 bg-white shadow-lg border border-neutral-200 py-3 z-50">
                  <h3 className="px-4 pb-2 text-sm font-semibold text-neutral-900">
                    Dooform Apps
                  </h3>
                  <div className="grid grid-cols-3 gap-1 px-2">
                    {APPS_MENU_ITEMS.map((app) => (
                      <Link
                        key={app.name}
                        href={app.href}
                        onClick={() => setIsAppsMenuOpen(false)}
                        className="flex flex-col items-center gap-1.5 p-3 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-lg transition-colors"
                        title={app.description}
                      >
                        <app.icon className="w-6 h-6" />
                        <span className="text-xs font-medium text-center">
                          {app.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Link href="/templates" className="flex items-center">
            <Image
              src="/Vector.svg"
              alt="Dooform"
              width={103}
              height={20}
              className="shrink-0"
            />
          </Link>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {isAdmin && (
          <Link
            href="/forms/new"
            className="flex items-center gap-1.5 px-3 h-8 text-sm font-medium text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </Link>
            )}
          <button
            className="flex items-center gap-1.5 px-3 h-8 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            title="ช่วยเหลือ"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Support</span>
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
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
    </header>
  );
}
