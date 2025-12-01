"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";

export interface SidebarItem {
    label: string;
    href?: string;
    children?: SidebarItem[];
}

export interface SidebarCategory {
    category: string;
    items: SidebarItem[];
}

interface SidebarProps {
    title?: string;
    categories: SidebarCategory[];
}

function NavItem({ item, pathname, depth = 0 }: { item: SidebarItem; pathname: string; depth?: number }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.href ? pathname === item.href : false;
    const isChildActive = hasChildren && item.children?.some(child =>
        child.href === pathname || child.children?.some(c => c.href === pathname)
    );

    const paddingLeft = depth === 0 ? "pl-4" : depth === 1 ? "pl-8" : "pl-12";

    if (hasChildren) {
        return (
            <li>
                <div className="flex flex-col">
                    {/* Parent item - can be clickable or just a label */}
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`flex items-center justify-between w-full py-2.5 ${paddingLeft} pr-2 text-body-sm transition-colors border-l-2 -ml-px ${
                            isActive || isChildActive
                                ? "border-primary text-primary font-medium"
                                : "border-transparent text-text-default hover:text-primary hover:border-primary"
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            {item.href ? (
                                <Link href={item.href} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                                    {item.label}
                                </Link>
                            ) : (
                                item.label
                            )}
                        </span>
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>

                    {/* Children */}
                    {isExpanded && (
                        <ul className="flex flex-col">
                            {item.children?.map((child) => (
                                <NavItem key={child.href || child.label} item={child} pathname={pathname} depth={depth + 1} />
                            ))}
                        </ul>
                    )}
                </div>
            </li>
        );
    }

    // Leaf item with href
    if (item.href) {
        return (
            <li>
                <Link
                    href={item.href}
                    className={`block py-2.5 ${paddingLeft} pr-4 text-body-sm transition-colors border-l-2 -ml-px ${
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
    }

    return null;
}

export function Sidebar({ title, categories }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const displayTitle = title || "Navigation";

    return (
        <nav
            className="font-sans"
            role="navigation"
            aria-label={displayTitle}
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
                    {displayTitle}
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
                <div className="flex flex-col gap-6">
                    {categories.map((category) => (
                        <div key={category.category}>
                            {/* Category header */}
                            <p className="text-body font-semibold text-foreground mb-3">
                                {category.category}
                            </p>

                            {/* Category items */}
                            <ul className="flex flex-col border-l border-border-default">
                                {category.items.map((item) => (
                                    <NavItem key={item.href || item.label} item={item} pathname={pathname} />
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </nav>
    );
}
