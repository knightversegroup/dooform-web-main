"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  BarChart3,
  Sliders,
  ChevronRight,
  Search,
  Home,
  Book,
  Users,
  FolderOpen,
  LucideIcon,
  GripVertical,
  Settings,
  Shield,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/lib/auth/context";

// ============================================================================
// Types
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  key: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

interface Workspace {
  id: string;
  name: string;
  color: string;
  href: string;
}

// ============================================================================
// Navigation Config
// ============================================================================

const MAIN_NAV: NavItem[] = [
  { label: "หน้าหลัก", href: "/templates", icon: Home },
  { label: "ประวัติเอกสาร", href: "/history", icon: History },
  { label: "พจนานุกรม", href: "/dictionary", icon: Book },
];

const EXPANDABLE_SECTIONS: NavSection[] = [
  {
    key: "analytics",
    label: "ข้อมูลและประวัติ",
    icon: BarChart3,
    items: [
      { label: "ล่าสุด", href: "/history", icon: History },
      { label: "สถิติ", href: "/stats", icon: BarChart3 },
    ],
  },
];

// Settings consolidated into a single Console page
const SETTINGS_NAV: NavItem = {
  label: "Console",
  href: "/console",
  icon: Settings,
};

// Admin navigation (only visible to admins)
const ADMIN_NAV: NavItem[] = [
  { label: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
];

const WORKSPACE_NAV: NavItem[] = [
  { label: "สมาชิก", href: "/workspace/members", icon: Users },
  { label: "โปรเจกต์", href: "/workspace/projects", icon: FolderOpen },
];

// ============================================================================
// Helper Functions
// ============================================================================

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/templates") {
    return pathname === "/templates" || pathname.startsWith("/forms");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ============================================================================
// Components
// ============================================================================

function SearchButton({ isCollapsed }: { isCollapsed: boolean }) {
  if (isCollapsed) {
    return (
      <div className="px-2 py-4 flex justify-center">
        <button
          className="flex items-center justify-center w-10 h-10 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          title="ค้นหา... (⌘K)"
        >
          <Search className="w-4 h-4 opacity-50" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <button className="w-full flex items-center gap-2 px-3 h-8 rounded-lg text-sm text-neutral-500 bg-neutral-100 ring-1 ring-neutral-200 hover:bg-neutral-150 transition-colors">
        <Search className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">ค้นหา...</span>
        <kbd className="text-xs text-neutral-400">
          <span className="opacity-50">⌘</span>K
        </kbd>
      </button>
    </div>
  );
}

function NavLink({
  item,
  isActive,
  isCollapsed,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`group flex items-center rounded-lg text-sm font-medium transition-colors font-sans ${
        isCollapsed ? "justify-center w-10 h-10" : "gap-3 px-3 py-2"
      } ${
        isActive
          ? "bg-neutral-200 text-neutral-900"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
      }`}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon className="w-4 h-4 opacity-50 shrink-0" />
      {!isCollapsed && (
        <span className="truncate leading-none">{item.label}</span>
      )}
    </Link>
  );
}

function SubNavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium font-sans transition-colors ${
        isActive
          ? "text-neutral-900 bg-neutral-100"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
      }`}
    >
      <span className="truncate leading-none">{item.label}</span>
    </Link>
  );
}

function ExpandableSection({
  section,
  isExpanded,
  onToggle,
  pathname,
  isCollapsed,
}: {
  section: NavSection;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  isCollapsed: boolean;
}) {
  const Icon = section.icon;

  // In collapsed mode, just show the icon
  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="group flex items-center justify-center w-10 h-10 rounded-lg text-sm font-sans font-medium transition-colors text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
        title={section.label}
      >
        <Icon className="w-4 h-4 opacity-50 shrink-0" />
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="group w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-4 h-4 opacity-50 shrink-0" />
          <span className="truncate leading-none">{section.label}</span>
        </div>
        <ChevronRight
          className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="relative mt-0.5 ml-7 pl-4">
            <div className="absolute left-0 inset-y-1 w-px bg-neutral-200" />
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <SubNavLink
                  key={item.href}
                  item={item}
                  isActive={isActivePath(pathname, item.href)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Resize Handle Component
// ============================================================================

function ResizeHandle({
  onMouseDown,
  isResizing,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}) {
  return (
    <div
      className={`absolute top-0 bottom-0 right-0 w-1 cursor-col-resize group hover:bg-blue-500/50 transition-colors ${
        isResizing ? "bg-blue-500/50" : ""
      }`}
      onMouseDown={onMouseDown}
    >
      <div
        className={`absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-4 h-8 flex items-center justify-center rounded bg-white border border-neutral-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${
          isResizing ? "opacity-100" : ""
        }`}
      >
        <GripVertical className="w-3 h-3 text-neutral-400" />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const {
    width,
    isCollapsed,
    isResizing,
    setWidth,
    startResizing,
    stopResizing,
  } = useSidebar();

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    analytics: true,
    settings: pathname.startsWith("/settings"),
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle mouse move for resizing
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      setWidth(newWidth);
    },
    [isResizing, setWidth],
  );

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    stopResizing();
  }, [stopResizing]);

  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startResizing();
  };

  return (
    <aside
      className="fixed top-14 bottom-0 left-0 bg-white border-r border-neutral-200 transition-[width] duration-150 ease-out"
      style={{ width: `${width}px` }}
    >
      <div className="flex flex-col h-full bg-white font-sans relative">
        <SearchButton isCollapsed={isCollapsed} />

        <nav
          className={`flex-1 overflow-y-auto pb-4 ${
            isCollapsed ? "px-2" : "px-3.5"
          }`}
        >
          <ul
            className={`flex flex-col gap-0.5 ${
              isCollapsed ? "items-center" : ""
            }`}
          >
            {/* Main Navigation */}
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  isActive={isActivePath(pathname, item.href)}
                  isCollapsed={isCollapsed}
                />
              </li>
            ))}

            {/* Expandable Sections */}
            {EXPANDABLE_SECTIONS.map((section) => (
              <li key={section.key} className="mt-0.5">
                <ExpandableSection
                  section={section}
                  isExpanded={expandedSections[section.key]}
                  onToggle={() => toggleSection(section.key)}
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                />
              </li>
            ))}

            {/* Admin Section - Only visible to admins */}
            {isAdmin && (
              <>
                {!isCollapsed && (
                  <li className="px-3 pt-4 pb-2">
                    <div className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" />
                      <span>ผู้ดูแลระบบ</span>
                    </div>
                  </li>
                )}
                {isCollapsed && (
                  <li className="pt-4 pb-2">
                    <div className="w-6 h-px bg-neutral-200" />
                  </li>
                )}
                {/* Console - Admin settings page */}
                <li>
                  <NavLink
                    item={SETTINGS_NAV}
                    isActive={isActivePath(pathname, SETTINGS_NAV.href)}
                    isCollapsed={isCollapsed}
                  />
                </li>
                {ADMIN_NAV.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      item={item}
                      isActive={isActivePath(pathname, item.href)}
                      isCollapsed={isCollapsed}
                    />
                  </li>
                ))}
              </>
            )}
          </ul>
        </nav>

        {/* Resize Handle - only show when not collapsed */}
        {!isCollapsed && (
          <ResizeHandle
            onMouseDown={handleResizeMouseDown}
            isResizing={isResizing}
          />
        )}
      </div>
    </aside>
  );
}
