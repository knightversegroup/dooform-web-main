"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Sparkles,
  FileText,
  Loader2,
  Plus,
  FolderOpen,
  Settings,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@dooform/shared/api/client";
import { useAuth } from "@dooform/shared/auth/hooks";
import {
  Template,
  TemplateType,
  Tier,
  DocumentType,
  FilterCategory,
} from "@dooform/shared/api/types";

// Types
interface FilterSection {
  id: string;
  fieldName: string;
  title: string;
  options: { value: string; label: string; count: number }[];
  expanded?: boolean;
}


// Filter Checkbox Component
function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
  color,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-gray-300 text-[#007398] focus:ring-[#007398]"
      />
      <span className="text-sm text-gray-700 group-hover:text-[#007398] flex items-center gap-1">
        {color && (
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: color }}
          />
        )}
        {label}
        {count !== undefined && (
          <span className="text-gray-500 ml-1">({count})</span>
        )}
      </span>
    </label>
  );
}

// Filter Section Component
function FilterSectionComponent({
  section,
  selectedFilters,
  onFilterChange,
}: {
  section: FilterSection;
  selectedFilters: string[];
  onFilterChange: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const initialShow = 4;
  const [showAll, setShowAll] = useState(false);

  const visibleOptions = showAll
    ? section.options
    : section.options.slice(0, initialShow);
  const hasMore = section.options.length > initialShow;

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-2"
      >
        <span className="text-sm font-semibold text-gray-900">
          {section.title}
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="space-y-1">
          {visibleOptions.map((option) => (
            <FilterCheckbox
              key={option.value}
              label={option.label}
              count={option.count}
              checked={selectedFilters.includes(option.value)}
              onChange={() => onFilterChange(option.value)}
            />
          ))}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-[#007398] hover:underline flex items-center gap-1 mt-2"
            >
              {showAll ? "แสดงน้อยลง" : `แสดงเพิ่มเติม`}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showAll ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Template Result Item Component (ScienceDirect style)
function TemplateResultItem({ template }: { template: Template }) {
  const [showAbstract, setShowAbstract] = useState(false);
  const placeholders = template.placeholders || [];

  return (
    <div className="py-4 border-b border-gray-200">
      {/* Type badges */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-gray-600">
          {template.category || "เทมเพลต"}
        </span>
        {template.type === "official" && (
          <span className="inline-flex items-center text-xs text-green-700">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            Official
          </span>
        )}
        {template.is_verified && (
          <span className="inline-flex items-center text-xs text-blue-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </span>
        )}
      </div>

      {/* Title */}
      <Link href={`/forms/${template.id}`} className="block group">
        <h3 className="text-base font-medium text-[#007398] group-hover:underline leading-snug mb-1">
          {template.name}
          {template.is_ai_available && (
            <Sparkles className="inline-block ml-2 h-4 w-4 text-purple-500" />
          )}
        </h3>
      </Link>

      {/* Meta info */}
      <div className="text-sm text-gray-600 mb-2">
        <span>
          {template.tier
            ? template.tier.charAt(0).toUpperCase() + template.tier.slice(1)
            : "Free"}
        </span>
        {template.created_at && (
          <span>
            ,{" "}
            {new Date(template.created_at).toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Author */}
      {template.author && (
        <div className="text-sm text-gray-700 mb-2">{template.author}</div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <Link
          href={`/forms/${template.id}`}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#007398] hover:bg-gray-100 rounded"
        >
          <FileText className="w-3 h-3" />
          ใช้งาน
        </Link>
        <button
          onClick={() => setShowAbstract(!showAbstract)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-[#007398] hover:bg-gray-100 rounded"
        >
          รายละเอียด
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showAbstract ? "rotate-180" : ""}`}
          />
        </button>
        {placeholders.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500">
            {placeholders.length} ช่องกรอก
          </span>
        )}
      </div>

      {/* Abstract/Description expandable */}
      {showAbstract && template.description && (
        <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
          {template.description}
        </div>
      )}
    </div>
  );
}

// Document Type Result Item (for grouped templates)
function DocumentTypeResultItem({
  documentType,
  templates,
}: {
  documentType: DocumentType;
  templates: Template[];
}) {
  const [expanded, setExpanded] = useState(false);
  const isVerified =
    templates.length > 0 && templates.every((t) => t.is_verified);
  const hasAI = templates.some((t) => t.is_ai_available);
  const firstTemplate = templates[0];

  // If only one template, render as single item
  if (templates.length === 1 && firstTemplate) {
    return <TemplateResultItem template={firstTemplate} />;
  }

  return (
    <div className="py-4 border-b border-gray-200">
      {/* Type badges */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-gray-600">
          {documentType.category || firstTemplate?.category || "กลุ่มเอกสาร"}
        </span>
        {isVerified && (
          <span className="inline-flex items-center text-xs text-blue-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </span>
        )}
        <span className="inline-flex items-center text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
          {templates.length} รูปแบบ
        </span>
      </div>

      {/* Title */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="block group text-left w-full"
      >
        <h3 className="text-base font-medium text-[#007398] group-hover:underline leading-snug mb-1">
          {documentType.name}
          {hasAI && (
            <Sparkles className="inline-block ml-2 h-4 w-4 text-purple-500" />
          )}
          <ChevronDown
            className={`inline-block ml-2 h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </h3>
      </button>

      {/* Meta info */}
      <div className="text-sm text-gray-600 mb-2">
        <span>
          {firstTemplate?.tier
            ? firstTemplate.tier.charAt(0).toUpperCase() +
              firstTemplate.tier.slice(1)
            : "Free"}
        </span>
      </div>

      {/* Description */}
      {documentType.description && (
        <div className="text-sm text-gray-700 mb-2">
          {documentType.description}
        </div>
      )}

      {/* Expanded template list */}
      {expanded && (
        <div className="mt-3 ml-4 border-l-2 border-gray-200 pl-4 space-y-3">
          {templates.map((template, idx) => (
            <div key={template.id}>
              <Link
                href={`/forms/${template.id}`}
                className="text-sm text-[#007398] hover:underline"
              >
                {template.variant_name ||
                  template.name ||
                  `รูปแบบ ${idx + 1}`}
              </Link>
              {template.is_verified && (
                <CheckCircle className="inline-block ml-1 w-3 h-3 text-blue-500" />
              )}
              <div className="flex items-center gap-2 mt-1">
                <Link
                  href={`/forms/${template.id}`}
                  className="inline-flex items-center gap-1 text-xs text-[#007398] hover:bg-gray-100 px-2 py-1 rounded"
                >
                  <FileText className="w-3 h-3" />
                  ใช้งาน
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Suggested Topics Sidebar
function SuggestedTopics({ categories }: { categories: string[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 gap-2 flex items-center">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        คำแนะนำ
      </h3>
      <div className="space-y-2">
        <p className="text-sm">
          แอปนี้ยังอยู่ในขั้นตอนการพัฒนา หากเกิดข้อผิดพลาดโปรดแจ้งที่นี่
        </p>
        <Link
          href="https://github.com/dhanavadh/dooform-web-main/issues"
          className="hover:underline text-sm font-semibold"
        >
          แจ้งปัญหา
        </Link>
      </div>
    </div>
  );
}

// Main Component
export default function FormTemplateList() {
  const { isAuthenticated } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [orphanTemplates, setOrphanTemplates] = useState<Template[]>([]);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "date">("relevance");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});

  // Load templates and filters from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch templates and filters in parallel
        const [templatesResponse, filtersResponse] = await Promise.all([
          apiClient.getTemplatesGrouped(),
          apiClient.getFilters().catch(() => [] as FilterCategory[]),
        ]);

        setDocumentTypes(templatesResponse.document_types || []);
        setOrphanTemplates(templatesResponse.orphan_templates || []);

        // Also set all templates for filtering
        const allTemplates = [
          ...(templatesResponse.document_types || []).flatMap(
            (dt) => dt.templates || [],
          ),
          ...(templatesResponse.orphan_templates || []),
        ];
        setTemplates(allTemplates);

        // Set filters from API
        const activeFilters = filtersResponse.filter((f) => f.is_active);
        setFilterCategories(activeFilters);

        // Initialize selectedFilters with empty arrays for each category
        const initialFilters: Record<string, string[]> = {};
        activeFilters.forEach((cat) => {
          initialFilters[cat.field_name] = [];
        });
        setSelectedFilters(initialFilters);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load templates",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Build filter sections from API data
  const filterSections: FilterSection[] = filterCategories
    .filter((cat) => cat.options && cat.options.length > 0)
    .map((cat) => ({
      id: cat.id,
      fieldName: cat.field_name,
      title: cat.name,
      options: (cat.options || [])
        .filter((opt) => opt.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((opt) => ({
          value: opt.value,
          label: opt.label,
          count: opt.count || 0,
        })),
    }))
    .filter((section) => section.options.length > 0);

  // Get unique categories for suggested topics
  const uniqueCategories = Array.from(
    new Set(templates.map((t) => t.category).filter(Boolean)),
  );

  const handleFilterChange = (fieldName: string, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[fieldName] || [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [fieldName]: updated };
    });
  };

  const clearFilters = () => {
    const clearedFilters: Record<string, string[]> = {};
    filterCategories.forEach((cat) => {
      clearedFilters[cat.field_name] = [];
    });
    setSelectedFilters(clearedFilters);
    setSearchQuery("");
  };

  const hasActiveFilters =
    Object.values(selectedFilters).some((arr) => arr.length > 0) ||
    searchQuery.length > 0;

  // Helper function to check if template matches search/filter
  const templateMatchesFilter = (template: Template) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (template.name || "").toLowerCase().includes(query) ||
        (template.description || "").toLowerCase().includes(query) ||
        (template.category || "").toLowerCase().includes(query) ||
        (template.author || "").toLowerCase().includes(query) ||
        (template.variant_name || "").toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Dynamic filter matching based on field_name
    for (const category of filterCategories) {
      const fieldName = category.field_name;
      const selectedValues = selectedFilters[fieldName] || [];

      if (selectedValues.length === 0) continue;

      // Get the template value for this field
      const templateValue = (template as unknown as Record<string, unknown>)[
        fieldName
      ];

      // Check if template value matches any selected filter value
      const matchesFilter = selectedValues.some((value) => {
        if (typeof templateValue === "string") {
          return templateValue.toLowerCase() === value.toLowerCase();
        }
        return templateValue === value;
      });

      if (!matchesFilter) return false;
    }

    return true;
  };

  // Check if any filter is active (not just search)
  const hasFilterSelection = Object.values(selectedFilters).some(
    (arr) => arr.length > 0,
  );

  // Filter document types and their templates for grouped view
  const filteredDocumentTypes = documentTypes
    .map((docType) => {
      // Filter templates within this document type
      const filteredTemplatesInGroup = (docType.templates || []).filter(
        templateMatchesFilter,
      );

      // If we have filter selections, only show filtered templates
      if (hasFilterSelection) {
        if (filteredTemplatesInGroup.length > 0) {
          return {
            ...docType,
            templates: filteredTemplatesInGroup,
          };
        }
        return null;
      }

      // If only search query (no filter checkboxes), check if doc type name matches
      if (searchQuery) {
        const docTypeMatchesSearch =
          docType.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (docType.name_en || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        if (docTypeMatchesSearch) {
          return {
            ...docType,
            templates: docType.templates || [],
          };
        }
        if (filteredTemplatesInGroup.length > 0) {
          return {
            ...docType,
            templates: filteredTemplatesInGroup,
          };
        }
        return null;
      }

      // No filters at all - return as is
      return docType;
    })
    .filter(
      (dt): dt is DocumentType & { templates: Template[] } =>
        dt !== null && (dt.templates?.length || 0) > 0,
    );

  // Filter orphan templates
  const filteredOrphanTemplates = orphanTemplates.filter(templateMatchesFilter);

  // Sort results
  const sortedDocumentTypes = [...filteredDocumentTypes].sort((a, b) => {
    if (sortBy === "date") {
      const aDate = a.templates?.[0]?.created_at || "";
      const bDate = b.templates?.[0]?.created_at || "";
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    }
    return 0;
  });

  const sortedOrphanTemplates = [...filteredOrphanTemplates].sort((a, b) => {
    if (sortBy === "date") {
      return (
        new Date(b.created_at || "").getTime() -
        new Date(a.created_at || "").getTime()
      );
    }
    return 0;
  });

  // Calculate total results
  const totalResults =
    filteredDocumentTypes.reduce(
      (sum, dt) => sum + (dt.templates?.length || 0),
      0,
    ) + filteredOrphanTemplates.length;

  return (
    <section className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <label className="block text-sm text-gray-600 mb-2">
              ค้นหาเทมเพลตเอกสาร
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="พิมพ์คำค้นหา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398] focus:ring-1 focus:ring-[#007398]"
                />
              </div>
              <button className="px-4 py-2.5 bg-[#007398] text-white rounded hover:bg-[#005f7a] transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
            <button className="text-sm text-[#007398] hover:underline mt-2 flex items-center gap-1">
              <ChevronDown className="w-4 h-4" />
              ค้นหาขั้นสูง
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-56 flex-shrink-0">
            {/* Results count */}
            <div className="mb-4">
              <h2 className="text-xl font-light text-gray-900">
                {loading ? "..." : totalResults.toLocaleString()} ผลลัพธ์
              </h2>
              <button className="text-sm text-[#007398] hover:underline flex items-center gap-1 mt-1">
                <span className="w-4 h-4 border border-current rounded-full text-xs flex items-center justify-center">
                  !
                </span>
                ตั้งการแจ้งเตือน
              </button>
            </div>

            {/* Refine by */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  กรองตาม:
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[#007398] hover:underline"
                  >
                    ล้าง
                  </button>
                )}
              </div>

              {/* Filter Sections */}
              {filterSections.map((section) => (
                <FilterSectionComponent
                  key={section.id}
                  section={section}
                  selectedFilters={selectedFilters[section.fieldName] || []}
                  onFilterChange={(value) =>
                    handleFilterChange(section.fieldName, value)
                  }
                />
              ))}
            </div>

            {/* Action buttons - only show for logged in users */}
            {isAuthenticated && (
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <Link
                  href="/forms/new"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#007398] text-white rounded text-sm font-medium hover:bg-[#005f7a] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มเทมเพลต
                </Link>
                <Link
                  href="/settings/document-types"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  จัดการประเภทเอกสาร
                </Link>
                <Link
                  href="/settings/filters"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  จัดการตัวกรอง
                </Link>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Actions bar */}
            <div className="flex items-center justify-end mb-4 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>เรียงตาม</span>
                <button
                  onClick={() => setSortBy("relevance")}
                  className={
                    sortBy === "relevance"
                      ? "text-[#007398] font-medium"
                      : "hover:text-[#007398]"
                  }
                >
                  ความเกี่ยวข้อง
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setSortBy("date")}
                  className={
                    sortBy === "date"
                      ? "text-[#007398] font-medium"
                      : "hover:text-[#007398]"
                  }
                >
                  วันที่
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#007398] animate-spin" />
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12 bg-red-50 rounded border border-red-200">
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-[#007398] hover:underline text-sm"
                >
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            )}

            {/* Results */}
            {!loading && !error && (
              <div>
                {/* Document Types */}
                {sortedDocumentTypes.map((docType) => (
                  <DocumentTypeResultItem
                    key={docType.id}
                    documentType={docType}
                    templates={docType.templates || []}
                  />
                ))}

                {/* Orphan Templates */}
                {sortedOrphanTemplates.map((template) => (
                  <TemplateResultItem key={template.id} template={template} />
                ))}

                {/* Empty State */}
                {sortedDocumentTypes.length === 0 &&
                  sortedOrphanTemplates.length === 0 && (
                    <div className="text-center py-12 bg-white rounded border border-gray-200">
                      <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 mb-4">
                        {hasActiveFilters
                          ? "ไม่พบเทมเพลตที่ตรงกับการค้นหา"
                          : "ยังไม่มีเทมเพลต"}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-[#007398] hover:underline text-sm"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                    </div>
                  )}

                {/* Personalize CTA */}
                {!loading && totalResults > 0 && (
                  <div className="mt-8 p-4 bg-white border border-gray-200 rounded">
                    <h4 className="font-medium text-gray-900 mb-1">
                      รับประสบการณ์การค้นหาที่เหมาะกับคุณ
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      คำแนะนำ, ประวัติการใช้งาน, การแจ้งเตือน และสิทธิพิเศษอื่นๆ
                    </p>
                    <Link
                      href="/forms/new"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white rounded text-sm hover:bg-[#005f7a] transition-colors"
                    >
                      เพิ่มเทมเพลตใหม่
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* Right Sidebar - Suggested Topics */}
          <aside className="w-48 flex-shrink-0 hidden xl:block">
            <SuggestedTopics categories={uniqueCategories} />
          </aside>
        </div>
      </div>
    </section>
  );
}
