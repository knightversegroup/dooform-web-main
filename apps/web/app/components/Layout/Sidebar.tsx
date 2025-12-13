"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  BarChart3,
  Sliders,
  Filter,
  FileType,
  ChevronRight,
  Search,
  Home,
  Book,
  Users,
  FolderOpen,
  LucideIcon,
} from "lucide-react";

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

const SETTINGS_SECTION: NavSection = {
  key: "settings",
  label: "การตั้งค่าระบบ",
  icon: Sliders,
  items: [
    { label: "กฎการตรวจจับช่อง", href: "/settings/field-rules", icon: Sliders },
    { label: "ตัวกรอง", href: "/settings/filters", icon: Filter },
    { label: "ประเภทเอกสาร", href: "/settings/document-types", icon: FileType },
  ],
};

// Workspace Mock Data
const WORKSPACES: Workspace[] = [
  { id: "1", name: "Knight Consultant", color: "bg-blue-500", href: "/workspace/knight" },
  { id: "2", name: "Dooform Team", color: "bg-emerald-500", href: "/workspace/dooform" },
  { id: "3", name: "Personal", color: "bg-violet-500", href: "/workspace/personal" },
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

function SearchButton() {
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

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors font-sans ${
        isActive
          ? "bg-neutral-200 text-neutral-900"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
      }`}
    >
      <Icon className="w-4 h-4 opacity-50 shrink-0" />
      <span className="truncate leading-none">{item.label}</span>
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

function WorkspaceLink({
  workspace,
  isActive,
}: {
  workspace: Workspace;
  isActive: boolean;
}) {
  return (
    <Link
      href={workspace.href}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors font-sans ${
        isActive
          ? "bg-neutral-200 text-neutral-900"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
      }`}
    >
      <span
        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${workspace.color}`}
      >
        {workspace.name.charAt(0).toUpperCase()}
      </span>
      <span className="truncate leading-none">{workspace.name}</span>
    </Link>
  );
}

function ExpandableSection({
  section,
  isExpanded,
  onToggle,
  pathname,
}: {
  section: NavSection;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  const Icon = section.icon;

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
// Main Component
// ============================================================================

export default function Sidebar() {
  const pathname = usePathname();

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    analytics: true,
    settings: pathname.startsWith("/settings"),
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="fixed top-14 bottom-0 left-0 w-60 bg-white border-r border-neutral-200">
      <div className="flex flex-col h-full bg-white font-sans">
        <SearchButton />

        <nav className="flex-1 px-3.5 overflow-y-auto pb-4">
          <ul className="flex flex-col gap-0.5">
            {/* Main Navigation */}
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  isActive={isActivePath(pathname, item.href)}
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
                />
              </li>
            ))}

            {/* Workspace Divider */}
            <li className="px-3 pt-4 pb-2">
              <div className="text-sm font-medium text-neutral-400">
                Workspace
              </div>
            </li>

            {/* Workspace List */}
            {WORKSPACES.map((workspace) => (
              <li key={workspace.id}>
                <WorkspaceLink
                  workspace={workspace}
                  isActive={isActivePath(pathname, workspace.href)}
                />
              </li>
            ))}

            {/* Workspace Navigation */}
            {WORKSPACE_NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  isActive={isActivePath(pathname, item.href)}
                />
              </li>
            ))}

            {/* Settings Divider */}
            <li className="px-3 pt-4 pb-2">
              <div className="text-sm font-medium text-neutral-400">
                ตั้งค่า
              </div>
            </li>

            {/* Settings Section */}
            <li>
              <ExpandableSection
                section={SETTINGS_SECTION}
                isExpanded={expandedSections[SETTINGS_SECTION.key]}
                onToggle={() => toggleSection(SETTINGS_SECTION.key)}
                pathname={pathname}
              />
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
