"use client";

import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDown, Search, X, Menu as MenuIcon, LogOut, Settings, History, Sliders } from "lucide-react";

const DEFAULT_PROFILE_IMAGE = "/profile_default.webp";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { useAuth } from "@/lib/auth/context";

interface MobileDropdownProps {
  item: NavItemWithDropdown;
  onLinkClick: () => void;
}

function MobileDropdown({ item, onLinkClick }: MobileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="border-b border-border-default">
      <button
        type="button"
        className="flex items-center justify-between w-full px-2 py-4 text-sm font-semibold text-text-default"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {item.label}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <ul className="bg-surface-alt rounded-lg mb-2">
          {item.items?.map((subItem, subIndex) => (
            <li key={subIndex}>
              <Link
                href={subItem.href}
                className="block px-4 py-3 text-sm text-text-default hover:bg-border-default hover:text-foreground"
                onClick={onLinkClick}
              >
                {subItem.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

interface SubItem {
  label: string;
  href: string;
}

interface NavItemWithDropdown {
  label: string;
  hasDropdown: true;
  items: SubItem[];
  href?: never;
}

interface NavItemWithoutDropdown {
  label: string;
  hasDropdown: false;
  href: string;
  items?: never;
}

type NavItem = NavItemWithDropdown | NavItemWithoutDropdown;

const navigationItems: NavItem[] = [
  {
    label: "โซลูชั่น",
    hasDropdown: true,
    items: [
      { label: "แปลงเอกสาร", href: "/solutions/convert" },
      { label: "จัดการฟอร์ม", href: "/solutions/manage" },
      { label: "ระบบอัตโนมัติ", href: "/solutions/automation" },
    ],
  },
  {
    label: "บริการแปลพร้อมรับรอง",
    hasDropdown: true,
    items: [
      { label: "แปลเอกสารราชการ", href: "/translation/government" },
      { label: "แปลเอกสารธุรกิจ", href: "/translation/business" },
      { label: "รับรองเอกสาร", href: "/translation/certification" },
    ],
  },
  {
    label: "แบบฟอร์ม",
    href: "/forms",
    hasDropdown: false,
  },
  {
    label: "เอกสารประกอบ",
    href: "/documents",
    hasDropdown: false,
  },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <header role="banner" className="sticky top-0 z-50 bg-background border-b border-border-default font-sans">
      {/* Header Body */}
      <div className="py-4">
        <div className="container-main">
          <div className="flex items-center justify-between">
            {/* Brand */}
            <Link href="/">
              <Image src="/logo.svg" alt="Dooform Logo" width={155} height={24} />
            </Link>

            {/* Mobile navbar buttons */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                className="p-2 text-text-default hover:bg-surface-alt rounded-lg"
                title="ค้นหา"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-expanded={isSearchOpen}
                aria-controls="search-modal"
              >
                <Search className="w-5 h-5" />
                <span className="sr-only">ค้นหา</span>
              </button>

              <button
                type="button"
                className="p-2 text-text-default hover:bg-surface-alt rounded-lg"
                title="เมนู"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-controls="menu-modal"
              >
                <MenuIcon className="w-5 h-5" />
                <span className="sr-only">เมนู</span>
              </button>
            </div>

            {/* Tools - Desktop */}
            <div className="hidden lg:flex items-center gap-4">
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-surface-alt animate-pulse" />
              ) : isAuthenticated && user ? (
                <Menu as="div" className="relative">
                  <MenuButton className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-alt transition-colors">
                    <Image
                        src={user.picture_url || DEFAULT_PROFILE_IMAGE}
                        alt={user.display_name || user.email || "Profile"}
                        width={32}
                        height={32}
                        className="rounded-full object-cover w-8 h-8"
                      />
                    <span className="text-sm font-medium text-text-default">
                      {user.display_name || user.first_name || user.email?.split("@")[0] || "User"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-1 w-56 bg-background border border-border-default rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-border-default">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.display_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email}
                      </p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                    <MenuItem>
                      {({ focus }: { focus: boolean }) => (
                        <Link
                          href="/history"
                          className={`flex items-center gap-2 px-4 py-2 text-sm ${focus ? "bg-surface-alt text-foreground" : "text-text-default"}`}
                        >
                          <History className="w-4 h-4" />
                          ประวัติเอกสาร
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }: { focus: boolean }) => (
                        <Link
                          href="/profile"
                          className={`flex items-center gap-2 px-4 py-2 text-sm ${focus ? "bg-surface-alt text-foreground" : "text-text-default"}`}
                        >
                          <Settings className="w-4 h-4" />
                          ตั้งค่าบัญชี
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }: { focus: boolean }) => (
                        <Link
                          href="/settings/field-rules"
                          className={`flex items-center gap-2 px-4 py-2 text-sm ${focus ? "bg-surface-alt text-foreground" : "text-text-default"}`}
                        >
                          <Sliders className="w-4 h-4" />
                          กฎการตรวจจับช่อง
                        </Link>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }: { focus: boolean }) => (
                        <button
                          onClick={handleLogout}
                          className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-left ${focus ? "bg-surface-alt text-red-600" : "text-red-500"}`}
                        >
                          <LogOut className="w-4 h-4" />
                          ออกจากระบบ
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button href="/register" variant="secondary">
                    ลงทะเบียน
                  </Button>
                  <Button href="/login" variant="primary">
                    เข้าสู่ระบบ
                  </Button>
                </div>
              )}

              {/* Search bar - Desktop */}
              <div className="flex items-center border border-border-default rounded-full px-3 py-1.5">
                <label className="sr-only" htmlFor="search-input">
                  ค้นหา
                </label>
                <input
                  className="text-sm focus:outline-none w-40 bg-transparent"
                  placeholder="ค้นหาแบบฟอร์ม"
                  id="search-input"
                  type="search"
                />
                <button type="submit" title="ค้นหา" className="text-text-muted hover:text-text-default">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal - Mobile */}
      {isSearchOpen && (
        <div className="lg:hidden bg-background border-t border-border-default" id="search-modal">
          <div className="container-main py-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center border border-border-default rounded-full px-3 py-2">
                <input
                  className="flex-1 text-sm focus:outline-none bg-transparent"
                  placeholder="ค้นหาแบบฟอร์ม"
                  id="search-input-mobile"
                  type="search"
                />
                <button type="submit" title="ค้นหา" className="text-text-muted">
                  <Search className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                className="p-2 text-text-muted hover:bg-surface-alt rounded-lg"
                title="ปิด"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation - Desktop */}
      <div className="hidden lg:block border-t border-border-default">
        <div className="container-main">
          <nav role="navigation" aria-label="เมนูหลัก">
            <ul className="flex items-center gap-1">
              {navigationItems.map((item, index) =>
                item.hasDropdown ? (
                  <li key={index} className="relative">
                    <Menu>
                      <MenuButton className="flex items-center gap-1 px-4 py-3 text-sm font-semibold text-text-default hover:bg-surface-alt rounded-lg transition-colors">
                        {item.label}
                        <ChevronDown className="w-4 h-4" />
                      </MenuButton>
                      <MenuItems className="absolute left-0 mt-1 w-56 bg-background border border-border-default rounded-lg shadow-lg py-2 z-50">
                        {item.items?.map((subItem, subIndex) => (
                          <MenuItem key={subIndex}>
                            {({ focus }: { focus: boolean }) => (
                              <Link
                                href={subItem.href}
                                className={`block px-4 py-2 text-sm ${focus ? "bg-surface-alt text-foreground" : "text-text-default"}`}
                              >
                                {subItem.label}
                              </Link>
                            )}
                          </MenuItem>
                        ))}
                      </MenuItems>
                    </Menu>
                  </li>
                ) : (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="block px-4 py-3 text-sm font-semibold text-text-default hover:bg-surface-alt rounded-lg transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Menu Modal */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Menu Panel */}
          <div
            className="lg:hidden fixed inset-0 w-full bg-background z-50 overflow-y-auto"
            id="menu-modal"
            role="dialog"
            aria-modal="true"
            aria-label="เมนูหลัก"
          >
            <div className="container-main py-4">
              <div className="flex w-full items-center justify-between mb-4">
                <Link href="/" onClick={() => setIsMenuOpen(false)}>
                  <Image src="/logo.svg" alt="Dooform Logo" width={155} height={24} />
                </Link>
                <button
                  type="button"
                  className="p-2 text-text-muted hover:bg-surface-alt rounded-lg"
                  title="ปิด"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="w-6 h-6" />
                  <span className="sr-only">ปิดเมนู</span>
                </button>
              </div>

              {isAuthenticated && user ? (
                <div className="mb-6">
                  <div className="flex items-center gap-3 p-4 bg-surface-alt rounded-lg mb-4">
                    <Image
                        src={user.picture_url || DEFAULT_PROFILE_IMAGE}
                        alt={user.display_name || user.email || "Profile"}
                        width={48}
                        height={48}
                        className="rounded-full object-cover w-12 h-12"
                      />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.display_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email}
                      </p>
                      <p className="text-xs text-text-muted truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      href="/history"
                      variant="secondary"
                      className="w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <History className="w-4 h-4 mr-2" />
                      ประวัติเอกสาร
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        href="/profile"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        ตั้งค่าบัญชี
                      </Button>
                      <Button
                        href="/settings/field-rules"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Sliders className="w-4 h-4 mr-2" />
                        กฎตรวจจับช่อง
                      </Button>
                    </div>
                    <Button
                      variant="secondary"
                      className="w-full !text-red-500 !border-red-200 hover:!bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      ออกจากระบบ
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mb-6">
                  <Button
                    href="/register"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ลงทะเบียน
                  </Button>
                  <Button
                    href="/login"
                    variant="primary"
                    className="flex-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    เข้าสู่ระบบ
                  </Button>
                </div>
              )}

              <nav role="navigation" aria-label="เมนูหลัก">
                <ul className="flex flex-col">
                  {navigationItems.map((item, index) =>
                    item.hasDropdown ? (
                      <MobileDropdown
                        key={index}
                        item={item}
                        onLinkClick={() => setIsMenuOpen(false)}
                      />
                    ) : (
                      <li key={index} className="border-b border-border-default">
                        <Link
                          href={item.href}
                          className="block px-2 py-4 text-sm font-semibold text-text-default"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </nav>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
