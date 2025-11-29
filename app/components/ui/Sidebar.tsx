"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";

export interface SidebarItem {
    label: string;
    href: string;
}

interface SidebarProps {
    title: string;
    items: SidebarItem[];
}

export function Sidebar({ title, items }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <nav
            className="font-sans"
            role="navigation"
            aria-label={title}
        >
            {/* Mobile toggle button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden w-full flex items-center justify-between p-4 bg-surface-alt rounded-lg text-body font-medium text-foreground"
                aria-expanded={isOpen}
            >
                <span className="flex items-center gap-2">
                    <Menu className="w-5 h-5" />
                    {title}
                </span>
                <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Sidebar content */}
            <div
                className={`lg:block ${
                    isOpen ? "block" : "hidden"
                } mt-2 lg:mt-0`}
            >
                <p className="hidden lg:block text-h4 text-foreground mb-4">
                    {title}
                </p>

                <ul className="flex flex-col border-l border-border-default">
                    {items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`block py-3 px-4 text-body-sm transition-colors border-l-2 -ml-px ${
                                        isActive
                                            ? "border-primary text-primary font-medium bg-surface-alt"
                                            : "border-transparent text-text-default hover:text-primary hover:border-primary"
                                    }`}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
