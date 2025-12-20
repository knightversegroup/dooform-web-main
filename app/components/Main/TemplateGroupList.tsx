"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronDown, ChevronRight, FileText, ArrowRight } from "lucide-react";
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
  options: { value: string; label: string; count?: number }[];
}

type SortOption = "popular" | "newest" | "name";

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

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [openFilters, setOpenFilters] = useState<string[]>(["category"]);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);

  // Derived data
  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    const categoryFilter = filterCategories.find((cat) => cat.field_name === "category");
    categoryFilter?.options?.forEach((opt) => {
      labels[opt.value] = opt.label;
    });
    return labels;
  }, [filterCategories]);

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

  // Filter sections for sidebar
  const filterSections: FilterSection[] = useMemo(() => {
    return [
      {
        id: "category",
        label: "หมวดหมู่",
        options: categories.map((cat) => ({
          value: cat.key,
          label: cat.label,
          count: cat.count,
        })),
      },
    ];
  }, [categories]);

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

    // Filter by category
    if (selectedCategories.length > 0) {
      results = results.filter((doc) =>
        selectedCategories.includes(doc.category || "other")
      );
    }

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
  }, [documentTypes, searchQuery, selectedCategories, sortBy]);

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

  const toggleCategorySelection = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
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
            {filterSections.map((section) => (
              <FilterAccordion
                key={section.id}
                section={section}
                isOpen={openFilters.includes(section.id)}
                onToggle={() => toggleFilter(section.id)}
                selectedValues={selectedCategories}
                onSelect={toggleCategorySelection}
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
            </div>
          </div>

          {/* Results Grid */}
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedResults.map((doc) => (
                <DocumentTypeCard
                  key={doc.id}
                  doc={doc}
                  categoryLabel={getCategoryLabel(doc.category)}
                />
              ))}
              {orphanTemplates.length > 0 &&
                selectedCategories.length === 0 &&
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
