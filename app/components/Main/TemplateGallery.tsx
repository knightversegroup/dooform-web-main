"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  MoreVertical,
  FileText,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface TemplateItem {
  id: string;
  title: string;
  style?: string;
  thumbnailUrl?: string; // Image thumbnail URL (auto-generated from PDF)
  href: string;
  isBlank?: boolean;
}

export interface TemplateSection {
  id: string;
  title: string;
  templates: TemplateItem[];
}

interface TemplateGalleryProps {
  recentTemplates?: TemplateItem[];
  sections?: TemplateSection[];
  onCreateBlank?: () => void;
}

// ============================================================================
// Default Blank Template
// ============================================================================

const BLANK_TEMPLATE: TemplateItem = {
  id: "blank",
  title: "Blank document",
  href: "/forms/new",
  isBlank: true,
};

// ============================================================================
// Template Card Component
// ============================================================================

function TemplateCard({
  template,
  variant = "showcase",
}: {
  template: TemplateItem;
  variant?: "showcase" | "default";
}) {
  const isShowcase = variant === "showcase";
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={template.href}
      className={`
        group flex-shrink-0 cursor-pointer
        ${isShowcase ? "w-[140px]" : "w-[160px]"}
      `}
    >
      {/* Preview */}
      <div
        className={`
          relative rounded-md overflow-hidden border border-neutral-200
          transition-all duration-200
          group-hover:shadow-md
          ${isShowcase ? "h-[180px]" : "h-[200px]"}
        `}
      >
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />

        {template.isBlank ? (
          /* Blank document with plus icon */
          <div className="w-full h-full bg-white flex items-center justify-center">
            <div className="relative">
              <Plus className="w-16 h-16 text-[#003087]" strokeWidth={1} />
            </div>
          </div>
        ) : template.thumbnailUrl && !imgError ? (
          /* Image thumbnail */
          <img
            src={template.thumbnailUrl}
            alt={template.title}
            className="w-full h-full object-contain bg-white"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Letter Placeholder */
          <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            <span className="text-2xl font-semibold text-neutral-400">
              {template.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="mt-2 px-0.5">
        <div
          className={`
            text-sm font-medium text-neutral-800 truncate
            group-hover:text-[#003087] transition-colors
          `}
          title={template.title}
        >
          {template.title}
        </div>
        {template.style && (
          <div className="text-xs text-neutral-500 truncate">
            {template.style}
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================================================
// Section Component
// ============================================================================

function TemplateGallerySection({
  section,
  variant = "default",
}: {
  section: TemplateSection;
  variant?: "showcase" | "default";
}) {
  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-700">
          {section.title}
        </h3>
      </div>

      {/* Templates Grid */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {section.templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function TemplateGallery({
  recentTemplates = [],
  sections = [],
  onCreateBlank,
}: TemplateGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Combine blank template with recent templates for showcase
  const showcaseTemplates = [BLANK_TEMPLATE, ...recentTemplates.slice(0, 6)];

  return (
    <div className="border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-normal text-neutral-700">
            Start a new document
          </h2>

          <div className="flex items-center gap-2">
            {/* Template Gallery Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <span>Template gallery</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* More Options */}
            <button className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200 rounded transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Showcase Templates - Always Visible */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {showcaseTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              variant="showcase"
            />
          ))}
        </div>

        {/* Expanded Gallery */}
        {isExpanded && sections.length > 0 && (
          <div className="mt-6 pt-6 border-t border-neutral-200">
            {sections.map((section) => (
              <TemplateGallerySection
                key={section.id}
                section={section}
                variant="default"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
