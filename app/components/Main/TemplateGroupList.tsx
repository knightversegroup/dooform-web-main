"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronRight, FileText, ArrowRight, LayoutGrid, List } from "lucide-react";
import LogoLoaderInline from "@/app/components/LogoLoaderInline";
import { apiClient } from "@/lib/api/client";
import { DocumentType, FilterCategory, Template } from "@/lib/api/types";
import TemplateGallery, { TemplateItem, TemplateSection } from "./TemplateGallery";

// ============================================================================
// Types
// ============================================================================

interface Category {
  key: string;
  label: string;
  count: number;
}

interface FilterSection {
  id: string;
  label: string;
  fieldName?: string;
  options: { value: string; label: string; count?: number }[];
}

type SortOption = "popular" | "newest" | "name";
type ViewMode = "grid" | "list";

// ============================================================================
// Sub-components
// ============================================================================

function FilterAccordion({
  section,
  isOpen,
  onToggle,
  selectedValues,
  onSelect,
}: {
  section: FilterSection;
  isOpen: boolean;
  onToggle: () => void;
  selectedValues: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3 px-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900">{section.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-3 space-y-1">
          {section.options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 py-1.5 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => onSelect(option.value)}
                className="w-4 h-4 rounded border-gray-300 text-[#000091] focus:ring-[#000091]"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                {option.label}
              </span>
              {option.count !== undefined && (
                <span className="text-xs text-gray-400">{option.count}</span>
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, categoryLabel }: { template: Template; categoryLabel?: string }) {
  return (
    <Link
      href={`/forms/${template.id}`}
      className="block bg-white border border-gray-200 rounded-sm hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-3 group-hover:text-[#000091] transition-colors line-clamp-2">
          {template.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {template.description || categoryLabel || "แบบฟอร์มเอกสาร"}
        </p>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
            แบบฟอร์ม
          </span>
          <ArrowRight className="w-4 h-4 text-[#000091] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}

function DocumentTypeCard({ doc, categoryLabel }: { doc: DocumentType; categoryLabel: string }) {
  const templateCount = doc.templates?.length || 0;

  return (
    <Link
      href={`/templates/${doc.id}`}
      className="block bg-white border border-gray-200 rounded-sm hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-3 group-hover:text-[#000091] transition-colors line-clamp-2">
          {doc.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {doc.description || `${templateCount} รูปแบบเอกสาร · ${categoryLabel}`}
        </p>
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-[#000091]/10 text-[#000091] rounded">
            {templateCount} รูปแบบ
          </span>
          <ArrowRight className="w-4 h-4 text-[#000091] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  );
}

function DocumentTypeRow({ doc, categoryLabel }: { doc: DocumentType; categoryLabel: string }) {
  const templateCount = doc.templates?.length || 0;

  return (
    <Link
      href={`/templates/${doc.id}`}
      className="flex items-center gap-4 p-4 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors group"
    >
      <div className="w-10 h-10 bg-[#000091]/10 rounded flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-[#000091]" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-gray-900 group-hover:text-[#000091] transition-colors truncate">
          {doc.name}
        </h3>
        <p className="text-sm text-gray-500 truncate">
          {templateCount} รูปแบบเอกสาร · {categoryLabel}
        </p>
      </div>
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-[#000091]/10 text-[#000091] rounded flex-shrink-0">
        {templateCount} รูปแบบ
      </span>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#000091] flex-shrink-0" />
    </Link>
  );
}

function TemplateRow({ template, categoryLabel }: { template: Template; categoryLabel?: string }) {
  return (
    <Link
      href={`/forms/${template.id}`}
      className="flex items-center gap-4 p-4 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors group"
    >
      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-gray-900 group-hover:text-[#000091] transition-colors truncate">
          {template.name}
        </h3>
        <p className="text-sm text-gray-500 truncate">
          {categoryLabel || "แบบฟอร์มเดี่ยว"}
        </p>
      </div>
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded flex-shrink-0">
        แบบฟอร์ม
      </span>
      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#000091] flex-shrink-0" />
    </Link>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LogoLoaderInline size="lg" />
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <p className="text-sm text-red-600 mb-4">{message}</p>
      <button onClick={onRetry} className="text-sm text-[#000091] hover:text-[#000091]/80 font-medium">
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center col-span-full">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-900 font-medium">ไม่พบเอกสาร</p>
      <p className="text-sm text-gray-500 mt-1">ลองปรับตัวกรองหรือคำค้นหา</p>
    </div>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

function useTemplateData() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [orphanTemplates, setOrphanTemplates] = useState<Template[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<Template[]>([]);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [groupedResponse, filtersResponse, popularResponse] = await Promise.all([
          apiClient.getTemplatesGrouped(),
          apiClient.getFilters().catch(() => [] as FilterCategory[]),
          apiClient.getTemplatesFiltered({
            sort: 'popular',
            limit: 10,
            includeDocumentType: true
          }).catch(() => [] as Template[]),
        ]);

        setDocumentTypes(groupedResponse.document_types || []);
        setOrphanTemplates(groupedResponse.orphan_templates || []);
        setPopularTemplates(popularResponse || []);
        setFilterCategories(filtersResponse.filter((f) => f.is_active));
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "Failed to load document types");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { documentTypes, orphanTemplates, popularTemplates, filterCategories, loading, error };
}

// ============================================================================
// Main Component
// ============================================================================

export default function TemplateGroupList() {
  const { documentTypes, orphanTemplates, popularTemplates, filterCategories, loading, error } = useTemplateData();

  // State - selectedFilters is now a map of fieldName -> selected values
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [openFilters, setOpenFilters] = useState<string[]>(["category"]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Derived data - build label maps for all filter categories
  const filterLabels = useMemo(() => {
    const labels: Record<string, Record<string, string>> = {};
    filterCategories.forEach((filter) => {
      labels[filter.field_name] = {};
      filter.options?.forEach((opt) => {
        labels[filter.field_name][opt.value] = opt.label;
      });
    });
    return labels;
  }, [filterCategories]);

  const categoryLabels = useMemo(() => {
    return filterLabels["category"] || {};
  }, [filterLabels]);

  const categorizedDocTypes = useMemo(() => {
    return documentTypes.reduce((acc, docType) => {
      const category = docType.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(docType);
      return acc;
    }, {} as Record<string, DocumentType[]>);
  }, [documentTypes]);

  const categories = useMemo((): Category[] => {
    return Object.keys(categorizedDocTypes).map((key) => ({
      key,
      label: categoryLabels[key] || key,
      count: categorizedDocTypes[key].length,
    }));
  }, [categorizedDocTypes, categoryLabels]);

  // Filter sections for sidebar - dynamically built from backend filterCategories
  const filterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [];

    // Sort by sort_order and filter active only
    const sortedFilters = [...filterCategories]
      .filter((f) => f.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

    sortedFilters.forEach((filter) => {
      // For category filter, add counts from documentTypes
      if (filter.field_name === "category") {
        sections.push({
          id: filter.field_name,
          label: filter.name,
          fieldName: filter.field_name,
          options: (filter.options || [])
            .filter((opt) => opt.is_active)
            .map((opt) => ({
              value: opt.value,
              label: opt.label,
              count: categorizedDocTypes[opt.value]?.length || 0,
            }))
            .filter((opt) => opt.count > 0),
        });
        return;
      }

      // For other filters (type, tier), use options from backend
      sections.push({
        id: filter.field_name,
        label: filter.name,
        fieldName: filter.field_name,
        options: (filter.options || [])
          .filter((opt) => opt.is_active)
          .map((opt) => ({
            value: opt.value,
            label: opt.label,
          })),
      });
    });

    // Always add is_verified and is_ai_available filters (these may not come from backend)
    const hasVerifiedFilter = sortedFilters.some((f) => f.field_name === "is_verified");
    const hasAIFilter = sortedFilters.some((f) => f.field_name === "is_ai_available");

    if (!hasVerifiedFilter) {
      sections.push({
        id: "is_verified",
        label: "สถานะการยืนยัน",
        fieldName: "is_verified",
        options: [{ value: "true", label: "ยืนยันแล้ว" }],
      });
    }

    if (!hasAIFilter) {
      sections.push({
        id: "is_ai_available",
        label: "รองรับ AI",
        fieldName: "is_ai_available",
        options: [{ value: "true", label: "รองรับ AI" }],
      });
    }

    return sections;
  }, [filterCategories, categorizedDocTypes]);

  // Gallery data
  const galleryRecentTemplates: TemplateItem[] = useMemo(() => {
    if (popularTemplates.length > 0) {
      return popularTemplates.slice(0, 7).map((template) => ({
        id: template.id,
        title: template.name,
        style: template.document_type?.name || template.category || '',
        href: `/forms/${template.id}`,
        thumbnailUrl: apiClient.getThumbnailUrl(template.id),
      }));
    }

    const templates: TemplateItem[] = [];
    documentTypes.slice(0, 5).forEach((docType) => {
      docType.templates?.slice(0, 2).forEach((template) => {
        templates.push({
          id: template.id,
          title: template.name,
          style: docType.name,
          href: `/forms/${template.id}`,
          thumbnailUrl: apiClient.getThumbnailUrl(template.id),
        });
      });
    });
    return templates.slice(0, 7);
  }, [popularTemplates, documentTypes]);

  const gallerySections: TemplateSection[] = useMemo(() => {
    return categories.slice(0, 4).map((cat) => ({
      id: cat.key,
      title: cat.label,
      templates: (categorizedDocTypes[cat.key] || []).slice(0, 5).flatMap((docType) => {
        if (docType.templates?.length) {
          return docType.templates.slice(0, 2).map((template) => ({
            id: template.id,
            title: template.name,
            style: docType.name,
            href: `/forms/${template.id}`,
            thumbnailUrl: apiClient.getThumbnailUrl(template.id),
          }));
        }
        return [{ id: docType.id, title: docType.name, href: `/templates/${docType.id}` }];
      }),
    }));
  }, [categories, categorizedDocTypes]);

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
    let results = [...documentTypes];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query)
      );
    }

    // Apply all selected filters
    Object.entries(selectedFilters).forEach(([fieldName, values]) => {
      if (values.length === 0) return;

      results = results.filter((doc) => {
        // Handle category filter
        if (fieldName === "category") {
          return values.includes(doc.category || "other");
        }

        // Handle type filter (check templates)
        if (fieldName === "type") {
          return doc.templates?.some((t) => values.includes(t.type || ""));
        }

        // Handle tier filter (check templates)
        if (fieldName === "tier") {
          return doc.templates?.some((t) => values.includes(t.tier || "free"));
        }

        // Handle is_verified filter (check templates)
        if (fieldName === "is_verified") {
          const wantVerified = values.includes("true");
          return doc.templates?.some((t) => t.is_verified === wantVerified);
        }

        // Handle is_ai_available filter (check templates)
        if (fieldName === "is_ai_available") {
          const wantAI = values.includes("true");
          return doc.templates?.some((t) => t.is_ai_available === wantAI);
        }

        return true;
      });
    });

    // Sort
    switch (sortBy) {
      case "newest":
        results.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
      case "name":
        results.sort((a, b) => a.name.localeCompare(b.name, "th"));
        break;
      case "popular":
      default:
        results.sort((a, b) => (b.templates?.length || 0) - (a.templates?.length || 0));
        break;
    }

    return results;
  }, [documentTypes, searchQuery, selectedFilters, sortBy]);

  // Pagination
  const totalItems = filteredResults.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

  // Handlers
  const toggleFilter = (filterId: string) => {
    setOpenFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((id) => id !== filterId)
        : [...prev, filterId]
    );
  };

  const toggleFilterSelection = (fieldName: string, value: string) => {
    setSelectedFilters((prev) => {
      const currentValues = prev[fieldName] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [fieldName]: newValues,
      };
    });
    setCurrentPage(1);
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(selectedFilters).reduce((sum, values) => sum + values.length, 0);
  }, [selectedFilters]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({});
    setSearchQuery("");
    setCurrentPage(1);
  };

  const getCategoryLabel = (category: string | undefined) =>
    categoryLabels[category || ""] || category || "ทั่วไป";

  // Render states
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Template Gallery */}
      <TemplateGallery recentTemplates={galleryRecentTemplates} sections={gallerySections} />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-60 flex-shrink-0 border-r border-gray-200 min-h-screen">
          <div className="sticky top-0">
            {/* Clear filters button */}
            {activeFilterCount > 0 && (
              <div className="p-3 border-b border-gray-200">
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-[#000091] hover:underline"
                >
                  ล้างตัวกรอง ({activeFilterCount})
                </button>
              </div>
            )}
            {filterSections.map((section) => (
              <FilterAccordion
                key={section.id}
                section={section}
                isOpen={openFilters.includes(section.id)}
                onToggle={() => toggleFilter(section.id)}
                selectedValues={selectedFilters[section.id] || []}
                onSelect={(value) => toggleFilterSelection(section.id, value)}
              />
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Search Bar */}
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหา"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Results Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-600">
              {startIndex + 1} – {endIndex} จาก {totalItems} รายการ
            </span>
            <div className="flex items-center gap-4">
              {/* Items per page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">แสดง:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-sm border border-gray-300 rounded-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#000091]"
                >
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={60}>60</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm border border-gray-300 rounded-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#000091]"
                >
                  <option value="popular">ยอดนิยม</option>
                  <option value="newest">ล่าสุด</option>
                  <option value="name">ชื่อ</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-sm overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 ${viewMode === "grid" ? "bg-[#000091] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  title="มุมมองการ์ด"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 ${viewMode === "list" ? "bg-[#000091] text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  title="มุมมองรายการ"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="p-4">
            {viewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedResults.map((doc) => (
                  <DocumentTypeCard
                    key={doc.id}
                    doc={doc}
                    categoryLabel={getCategoryLabel(doc.category)}
                  />
                ))}
                {orphanTemplates.length > 0 &&
                  activeFilterCount === 0 &&
                  !searchQuery &&
                  orphanTemplates.slice(0, 6).map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      categoryLabel="แบบฟอร์มเดี่ยว"
                    />
                  ))}
                {paginatedResults.length === 0 && orphanTemplates.length === 0 && <EmptyState />}
              </div>
            ) : (
              /* List View */
              <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                {paginatedResults.map((doc) => (
                  <DocumentTypeRow
                    key={doc.id}
                    doc={doc}
                    categoryLabel={getCategoryLabel(doc.category)}
                  />
                ))}
                {orphanTemplates.length > 0 &&
                  activeFilterCount === 0 &&
                  !searchQuery &&
                  orphanTemplates.slice(0, 6).map((template) => (
                    <TemplateRow
                      key={template.id}
                      template={template}
                      categoryLabel="แบบฟอร์มเดี่ยว"
                    />
                  ))}
                {paginatedResults.length === 0 && orphanTemplates.length === 0 && (
                  <div className="p-8">
                    <EmptyState />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ก่อนหน้า
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1.5 text-sm border rounded-sm ${
                      currentPage === pageNum
                        ? "bg-[#000091] text-white border-[#000091]"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ถัดไป
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
