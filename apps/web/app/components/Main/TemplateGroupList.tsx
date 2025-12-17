"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Loader2, ChevronDown, Lightbulb, FileText } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { DocumentType, FilterCategory, Template } from "@/lib/api/types";
import TemplateGallery, { TemplateItem, TemplateSection } from "./TemplateGallery";

// ============================================================================
// Types
// ============================================================================

interface Tab {
  key: string;
  label: string;
  badge?: number;
}

// ============================================================================
// Constants
// ============================================================================

const TABS: Tab[] = [
  { key: "recent", label: "ล่าสุด" },
  { key: "all", label: "ทั้งหมด" },
  { key: "favorites", label: "รายการโปรด" },
  { key: "categories", label: "หมวดหมู่" },
];

const WORKSPACE_COLORS = [
  "bg-blue-500",
  "bg-yellow-400",
  "bg-orange-400",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-cyan-500",
];

// ============================================================================
// Workspace Card Component
// ============================================================================

function WorkspaceCard({
  title,
  subtitle,
  color,
  href,
  quickLinks,
  footer,
}: {
  title: string;
  subtitle: string;
  color: string;
  href: string;
  quickLinks?: { label: string; href: string; count?: number }[];
  footer?: string;
}) {
  return (
    <div className="flex-shrink-0 w-[280px] bg-white rounded-lg border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Color bar */}
      <div className={`h-2 ${color}`} />

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <Link href={href} className="block group">
          <h3 className="font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>
        </Link>

        {/* Quick Links */}
        {quickLinks && quickLinks.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Quick links
            </p>
            <div className="space-y-1">
              {quickLinks.map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="flex items-center justify-between text-sm text-neutral-600 hover:text-blue-600 transition-colors"
                >
                  <span>{link.label}</span>
                  {link.count !== undefined && (
                    <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                      {link.count > 99 ? "99+" : link.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-4 py-3 border-t border-neutral-100">
          <button className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
            <span>{footer}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Activity Item Component
// ============================================================================

function ActivityItem({
  icon,
  iconColor,
  title,
  subtitle,
  meta,
  href,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  subtitle: string;
  meta?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 transition-colors rounded-lg group"
    >
      {/* Icon */}
      <div
        className={`w-8 h-8 rounded flex items-center justify-center ${iconColor || "bg-neutral-100 text-neutral-500"}`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
          {title}
        </h4>
        <p className="text-xs text-neutral-500 truncate">{subtitle}</p>
      </div>

      {/* Meta */}
      {meta && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">{meta}</span>
        </div>
      )}
    </Link>
  );
}

// ============================================================================
// Section Header Component
// ============================================================================

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {action && (
        <Link
          href={action.href}
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

// ============================================================================
// Tabs Component
// ============================================================================

function TabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}) {
  return (
    <div className="border-b border-neutral-200">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? "text-blue-600"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge !== undefined && (
                <span className="text-xs bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded">
                  {tab.badge > 99 ? "99+" : tab.badge}
                </span>
              )}
            </span>
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Activity Group Component
// ============================================================================

function ActivityGroup({
  title,
  items,
}: {
  title: string;
  items: {
    icon: React.ReactNode;
    iconColor?: string;
    title: string;
    subtitle: string;
    meta?: string;
    href: string;
  }[];
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide px-4 mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item, i) => (
          <ActivityItem key={i} {...item} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function TemplateGroupList() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [orphanTemplates, setOrphanTemplates] = useState<Template[]>([]);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("recent");

  // Load document types from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [groupedResponse, filtersResponse] = await Promise.all([
          apiClient.getTemplatesGrouped(),
          apiClient.getFilters().catch(() => [] as FilterCategory[]),
        ]);

        setDocumentTypes(groupedResponse.document_types || []);
        setOrphanTemplates(groupedResponse.orphan_templates || []);
        setFilterCategories(filtersResponse.filter((f) => f.is_active));
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load document types"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Build category labels map from API filter
  const apiCategoryLabels: Record<string, string> = {};
  const apiCategoryFilter = filterCategories.find(
    (cat) => cat.field_name === "category"
  );
  if (apiCategoryFilter && apiCategoryFilter.options) {
    apiCategoryFilter.options.forEach((opt) => {
      apiCategoryLabels[opt.value] = opt.label;
    });
  }

  // Group document types by category
  const categorizedDocTypes = documentTypes.reduce(
    (acc, docType) => {
      const category = docType.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(docType);
      return acc;
    },
    {} as Record<string, DocumentType[]>
  );

  // Get categories for workspace cards
  const categories = Object.keys(categorizedDocTypes).map((key, index) => ({
    key,
    label: apiCategoryLabels[key] || key,
    count: categorizedDocTypes[key].length,
    color: WORKSPACE_COLORS[index % WORKSPACE_COLORS.length],
  }));

  // Get recent documents for activity list
  const recentDocuments = documentTypes.slice(0, 10);

  // Transform data for TemplateGallery
  const galleryRecentTemplates: TemplateItem[] = useMemo(() => {
    // Get templates from recent document types
    const templates: TemplateItem[] = [];
    documentTypes.slice(0, 5).forEach((docType) => {
      if (docType.templates && docType.templates.length > 0) {
        docType.templates.slice(0, 2).forEach((template) => {
          templates.push({
            id: template.id,
            title: template.display_name || template.name,
            style: docType.name,
            href: `/forms/${template.id}`,
          });
        });
      }
    });
    return templates.slice(0, 7);
  }, [documentTypes]);

  const gallerySections: TemplateSection[] = useMemo(() => {
    return categories.slice(0, 4).map((cat) => ({
      id: cat.key,
      title: cat.label,
      templates: (categorizedDocTypes[cat.key] || []).slice(0, 5).flatMap((docType) => {
        if (docType.templates && docType.templates.length > 0) {
          return docType.templates.slice(0, 2).map((template) => ({
            id: template.id,
            title: template.display_name || template.name,
            style: docType.name,
            href: `/forms/${template.id}`,
          }));
        }
        return [{
          id: docType.id,
          title: docType.name,
          href: `/templates/${docType.id}`,
        }];
      }),
    }));
  }, [categories, categorizedDocTypes]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:underline"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {/* Template Gallery - Google Docs Style */}
      <TemplateGallery
        recentTemplates={galleryRecentTemplates}
        sections={gallerySections}
      />

      <div className="max-w-6xl mx-auto px-4">
        {/* Page Title */}
        <div className="mb-8 mt-8">
          <h1 className="text-2xl font-bold text-neutral-900">สำหรับคุณ</h1>
        </div>

        {/* Divider */}
        <div className="border-b border-neutral-200 mb-8" />

      {/* Recent Workspaces Section */}
      <section className="mb-10">
        <SectionHeader
          title="หมวดหมู่ล่าสุด"
          action={{ label: "ดูทั้งหมด", href: "/templates?view=categories" }}
        />

        {/* Workspace Cards - Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {categories.slice(0, 4).map((cat) => (
            <WorkspaceCard
              key={cat.key}
              title={cat.label}
              subtitle={`${cat.count} ประเภทเอกสาร`}
              color={cat.color}
              href={`/templates?category=${cat.key}`}
              quickLinks={categorizedDocTypes[cat.key]?.slice(0, 3).map((doc) => ({
                label: doc.name,
                href: `/templates/${doc.id}`,
                count: doc.templates?.length || 0,
              }))}
              footer={`${cat.count} รายการ`}
            />
          ))}
        </div>
      </section>

      {/* Tabs Section */}
      <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Activity List */}
      <div className="py-6">
        {activeTab === "recent" && (
          <>
            {/* Today's Activity */}
            <ActivityGroup
              title="วันนี้"
              items={recentDocuments.slice(0, 5).map((doc) => ({
                icon: <Lightbulb className="w-4 h-4" />,
                iconColor: "bg-yellow-100 text-yellow-600",
                title: doc.name,
                subtitle: `${doc.templates?.length || 0} รูปแบบ · ${apiCategoryLabels[doc.category || ""] || doc.category || "ทั่วไป"}`,
                meta: "เพิ่มใหม่",
                href: `/templates/${doc.id}`,
              }))}
            />

            {/* Earlier Activity */}
            {recentDocuments.length > 5 && (
              <ActivityGroup
                title="ก่อนหน้านี้"
                items={recentDocuments.slice(5, 10).map((doc) => ({
                  icon: <FileText className="w-4 h-4" />,
                  iconColor: "bg-blue-100 text-blue-600",
                  title: doc.name,
                  subtitle: `${doc.templates?.length || 0} รูปแบบ · ${apiCategoryLabels[doc.category || ""] || doc.category || "ทั่วไป"}`,
                  meta: "เพิ่มใหม่",
                  href: `/templates/${doc.id}`,
                }))}
              />
            )}

            {/* Orphan Templates */}
            {orphanTemplates.length > 0 && (
              <ActivityGroup
                title="แบบฟอร์มเดี่ยว"
                items={orphanTemplates.slice(0, 5).map((template) => ({
                  icon: <FileText className="w-4 h-4" />,
                  iconColor: "bg-neutral-100 text-neutral-500",
                  title: template.display_name || template.name,
                  subtitle: template.original_source || "แบบฟอร์มทั่วไป",
                  meta: "เพิ่มใหม่",
                  href: `/forms/${template.id}`,
                }))}
              />
            )}
          </>
        )}

        {activeTab === "all" && (
          <ActivityGroup
            title="เอกสารทั้งหมด"
            items={documentTypes.map((doc) => ({
              icon: <FileText className="w-4 h-4" />,
              iconColor: "bg-blue-100 text-blue-600",
              title: doc.name,
              subtitle: `${doc.templates?.length || 0} รูปแบบ · ${apiCategoryLabels[doc.category || ""] || doc.category || "ทั่วไป"}`,
              href: `/templates/${doc.id}`,
            }))}
          />
        )}

        {activeTab === "favorites" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500">ยังไม่มีรายการโปรด</p>
            <p className="text-xs text-neutral-400 mt-1">
              กดที่ไอคอนดาวเพื่อเพิ่มรายการโปรด
            </p>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                href={`/templates?category=${cat.key}`}
                className="flex items-center gap-4 p-4 bg-white border border-neutral-200 rounded-lg hover:shadow-md transition-shadow group"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center text-white font-semibold`}
                >
                  {cat.label.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                    {cat.label}
                  </h4>
                  <p className="text-sm text-neutral-500">
                    {cat.count} ประเภทเอกสาร
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
