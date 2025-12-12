"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown } from "lucide-react";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav
            className="font-sans"
            role="navigation"
            aria-label="Breadcrumb"
        >
            {/* Mobile toggle button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden flex items-center gap-2 text-body-sm text-text-muted mb-4"
                aria-expanded={isOpen}
            >
                <span>ดูเส้นทาง</span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {/* Breadcrumb list */}
            <ol
                className={`md:flex items-center gap-2 flex-wrap ${
                    isOpen ? "flex" : "hidden md:flex"
                }`}
            >
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-2">
                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className="text-body-sm text-text-muted hover:text-primary transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    className={`text-body-sm ${
                                        isLast
                                            ? "text-foreground font-medium"
                                            : "text-text-muted"
                                    }`}
                                    aria-current={isLast ? "page" : undefined}
                                >
                                    {item.label}
                                </span>
                            )}

                            {!isLast && (
                                <ChevronRight className="w-4 h-4 text-text-muted" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
