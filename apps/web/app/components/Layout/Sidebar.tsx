"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  History,
  BarChart3,
  Sliders,
  Filter,
  FileType,
  Menu,
  X,
  ChevronRight,
  Search,
  Home,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultExpanded?: boolean;
}

const mainNav: NavItem[] = [
  {
    label: "หน้าหลัก",
    href: "/templates",
    icon: <Home className="w-4 h-4" />,
  },
];

const recentNav: NavItem[] = [
  {
    label: "ล่าสุด",
    href: "/history",
    icon: <History className="w-4 h-4" />,
  },
  {
    label: "สถิติ",
    href: "/stats",
    icon: <BarChart3 className="w-4 h-4" />,
  },
];

const settingsNav: NavItem[] = [
  {
    label: "กฎการตรวจจับช่อง",
    href: "/settings/field-rules",
    icon: <Sliders className="w-4 h-4" />,
  },
  {
    label: "ตัวกรอง",
    href: "/settings/filters",
    icon: <Filter className="w-4 h-4" />,
  },
  {
    label: "ประเภทเอกสาร",
    href: "/settings/document-types",
    icon: <FileType className="w-4 h-4" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    analytics: true,
    settings: pathname.startsWith("/settings"),
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (href: string) => {
    if (href === "/templates") {
      return pathname === "/templates" || pathname.startsWith("/forms");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const NavLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      onClick={() => setIsMobileOpen(false)}
      className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors font-sans ${
        isActive(item.href)
          ? "bg-neutral-200 text-neutral-900"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
      }`}
    >
      <span className="opacity-50 flex-shrink-0">{item.icon}</span>
      <span className="truncate leading-none">{item.label}</span>
    </Link>
  );

  const ExpandableSection = ({
    label,
    icon,
    sectionKey,
    children,
  }: {
    label: string;
    icon: React.ReactNode;
    sectionKey: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections[sectionKey];
    return (
      <div>
        <button
          onClick={() => toggleSection(sectionKey)}
          className="group w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-sans font-medium transition-colors text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
        >
          <div className="flex items-center gap-3">
            <span className="opacity-50 flex-shrink-0">{icon}</span>
            <span className="truncate leading-none">{label}</span>
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
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SubNavLink = ({ item }: { item: NavItem }) => (
    <Link
      href={item.href}
      onClick={() => setIsMobileOpen(false)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium font-sans transition-colors ${
        isActive(item.href)
          ? "text-neutral-900 bg-neutral-100"
          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
      }`}
    >
      <span className="truncate leading-none">{item.label}</span>
    </Link>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white font-sans">
      {/* Search button */}
      <div className="px-4 py-4">
        <button className="w-full flex items-center gap-2 px-3 h-8 rounded-lg text-sm text-neutral-500 bg-neutral-100 ring-1 ring-neutral-200 hover:bg-neutral-150 transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">ค้นหา...</span>
          <kbd className="text-xs text-neutral-400">
            <span className="opacity-50">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 overflow-y-auto pb-4">
        <ul className="flex flex-col gap-0.5">
          {/* Main nav items */}
          {mainNav.map((item) => (
            <li key={item.href}>
              <NavLink item={item} />
            </li>
          ))}

          {/* Analytics section */}
          <li className="mt-0.5">
            <ExpandableSection
              label="ข้อมูลและประวัติ"
              icon={<BarChart3 className="w-4 h-4" />}
              sectionKey="analytics"
            >
              <div className="flex flex-col gap-0.5">
                {recentNav.map((item) => (
                  <SubNavLink key={item.href} item={item} />
                ))}
              </div>
            </ExpandableSection>
          </li>

          {/* Section divider */}
          <li className="px-3 pt-4 pb-2">
            <div className="text-sm font-medium text-neutral-400">ตั้งค่า</div>
          </li>

          {/* Settings section */}
          <li>
            <ExpandableSection
              label="การตั้งค่าระบบ"
              icon={<Sliders className="w-4 h-4" />}
              sectionKey="settings"
            >
              <div className="flex flex-col gap-0.5">
                {settingsNav.map((item) => (
                  <SubNavLink key={item.href} item={item} />
                ))}
              </div>
            </ExpandableSection>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-12 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between h-full px-4">
          <Link href="/templates">
            <Image src="/logo.svg" alt="Dooform" width={80} height={16} />
          </Link>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {isMobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-60 bg-white shadow-xl transform transition-transform duration-200 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar - positioned below navbar (h-14 = 56px) */}
      <aside className="hidden lg:block lg:fixed lg:top-14 lg:bottom-0 lg:left-0 lg:w-60 bg-white border-r border-neutral-200">
        <SidebarContent />
      </aside>
    </>
  );
}
