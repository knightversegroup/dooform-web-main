"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    ChevronDown,
    CheckCircle,
    Sparkles,
    Loader2,
    Plus,
    FolderOpen,
    Settings,
    ChevronRight,
    AlertTriangle,
    FileText,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { DocumentType, FilterCategory, Template } from "@/lib/api/types";

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
                    <ChevronDown className="w-4 h-4 text-gray-500 rotate-180" />
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

// Get header background color based on category
function getHeaderBgColor(category: string): string {
    const colors: Record<string, string> = {
        government: "#b91c1c",
        legal: "#1d4ed8",
        finance: "#047857",
        education: "#7c3aed",
        hr: "#c2410c",
        business: "#0f766e",
        identification: "#be185d",
        certificate: "#4338ca",
        contract: "#0369a1",
        application: "#059669",
        financial: "#047857",
        medical: "#dc2626",
        other: "#374151",
    };
    return colors[category] || "#007398";
}

// Document Type Card Component - Horizontal List Style
function DocumentTypeCard({
    documentType,
    categoryLabels
}: {
    documentType: DocumentType;
    categoryLabels: Record<string, string>;
}) {
    const templateCount = documentType.templates?.length || 0;
    const hasVerified = documentType.templates?.some((t) => t.is_verified);
    const hasAI = documentType.templates?.some((t) => t.is_ai_available);
    const bgColor = getHeaderBgColor(documentType.category);
    const categoryLabel = categoryLabels[documentType.category] || documentType.category || "เอกสาร";

    return (
        <Link
            href={`/templates/${documentType.id}`}
            className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
        >
            {/* Left Color Bar */}
            <div
                className="w-1.5 self-stretch flex-shrink-0"
                style={{ backgroundColor: bgColor }}
            />

            <div className="flex-1 flex items-center justify-between p-4 gap-4">
                {/* Left - Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-medium text-gray-900 group-hover:text-[#007398] transition-colors truncate">
                            {documentType.name}
                        </h3>
                        {hasVerified && (
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                        {hasAI && (
                            <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        )}
                    </div>
                    {documentType.original_source && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                            {documentType.original_source}
                        </p>
                    )}
                </div>

                {/* Center - Category Badge */}
                <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {categoryLabel}
                    </span>
                </div>

                {/* Right - Count & Arrow */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="inline-flex items-center text-sm text-gray-600">
                        <FileText className="w-4 h-4 mr-1" />
                        {templateCount} รูปแบบ
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#007398]" />
                </div>
            </div>
        </Link>
    );
}

// Orphan Template Card Component - Horizontal List Style (templates without a document type)
function OrphanTemplateCard({
    template,
    categoryLabels
}: {
    template: Template;
    categoryLabels: Record<string, string>;
}) {
    const bgColor = "#6B7280"; // Gray for orphan templates
    const categoryLabel = categoryLabels[template.category] || template.category || "แบบฟอร์มเดี่ยว";

    return (
        <Link
            href={`/forms/${template.id}`}
            className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
        >
            {/* Left Color Bar */}
            <div
                className="w-1.5 self-stretch flex-shrink-0"
                style={{ backgroundColor: bgColor }}
            />

            <div className="flex-1 flex items-center justify-between p-4 gap-4">
                {/* Left - Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-medium text-gray-900 group-hover:text-[#007398] transition-colors truncate">
                            {template.display_name || template.name}
                        </h3>
                        {template.is_verified && (
                            <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                        {template.is_ai_available && (
                            <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        )}
                    </div>
                    {template.original_source && (
                        <p className="text-sm text-gray-500 line-clamp-1">
                            {template.original_source}
                        </p>
                    )}
                </div>

                {/* Center - Category Badge */}
                <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {categoryLabel}
                    </span>
                </div>

                {/* Right - Arrow */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-sm text-[#007398]">กรอกข้อมูล</span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#007398]" />
                </div>
            </div>
        </Link>
    );
}

// Suggested Topics Sidebar
function SuggestedTopics() {
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
export default function TemplateGroupList() {
    const { isAuthenticated } = useAuth();
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [orphanTemplates, setOrphanTemplates] = useState<Template[]>([]);
    const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

    // Load document types and orphan templates from API
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch grouped templates (includes both document types and orphan templates)
                const [groupedResponse, filtersResponse] = await Promise.all([
                    apiClient.getTemplatesGrouped(),
                    apiClient.getFilters().catch(() => [] as FilterCategory[]),
                ]);

                setDocumentTypes(groupedResponse.document_types || []);
                setOrphanTemplates(groupedResponse.orphan_templates || []);

                // Set filters from API
                const activeFilters = filtersResponse.filter((f) => f.is_active);
                setFilterCategories(activeFilters);

                // Initialize selectedFilters
                const initialFilters: Record<string, string[]> = {};
                activeFilters.forEach((cat) => {
                    initialFilters[cat.field_name] = [];
                });
                setSelectedFilters(initialFilters);
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

    // Build category labels map from API filter (value -> label)
    const apiCategoryLabels: Record<string, string> = {};
    const apiCategoryFilter = filterCategories.find((cat) => cat.field_name === "category");
    if (apiCategoryFilter && apiCategoryFilter.options) {
        apiCategoryFilter.options.forEach((opt) => {
            apiCategoryLabels[opt.value] = opt.label;
        });
    }

    // Build category filter from actual document types and orphan templates
    const categoryCountMap = new Map<string, number>();
    documentTypes.forEach((dt) => {
        if (dt.category) {
            categoryCountMap.set(dt.category, (categoryCountMap.get(dt.category) || 0) + 1);
        }
    });
    orphanTemplates.forEach((t) => {
        if (t.category) {
            categoryCountMap.set(t.category, (categoryCountMap.get(t.category) || 0) + 1);
        }
    });

    // Build filter sections from API filter categories (excluding category - we build it ourselves)
    const filterSections: FilterSection[] = filterCategories
        .filter((cat) => cat.is_active && cat.options && cat.options.length > 0 && cat.field_name !== "category")
        .map((cat) => ({
            id: cat.id,
            fieldName: cat.field_name,
            title: cat.name,
            options: (cat.options || [])
                .filter((opt) => opt.is_active)
                .map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                    count: opt.count || 0,
                })),
        }));

    // Add category filter built from actual data (with API labels if available)
    if (categoryCountMap.size > 0) {
        filterSections.unshift({
            id: "category",
            fieldName: "category",
            title: "หมวดหมู่",
            options: Array.from(categoryCountMap.entries()).map(([value, count]) => ({
                value,
                label: apiCategoryLabels[value] || value,
                count,
            })),
        });
    }

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
        clearedFilters["category"] = [];
        setSelectedFilters(clearedFilters);
        setSearchQuery("");
    };

    const hasActiveFilters =
        Object.values(selectedFilters).some((arr) => arr.length > 0) ||
        searchQuery.length > 0;

    // Filter document types
    const filteredDocumentTypes = documentTypes.filter((docType) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                docType.name.toLowerCase().includes(query) ||
                (docType.name_en || "").toLowerCase().includes(query) ||
                (docType.description || "").toLowerCase().includes(query) ||
                (docType.category || "").toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }

        // Category filter
        const selectedCategories = selectedFilters["category"] || [];
        if (selectedCategories.length > 0) {
            if (!selectedCategories.includes(docType.category)) {
                return false;
            }
        }

        return true;
    });

    // Filter orphan templates
    const filteredOrphanTemplates = orphanTemplates.filter((template) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                (template.display_name || "").toLowerCase().includes(query) ||
                (template.name || "").toLowerCase().includes(query) ||
                (template.description || "").toLowerCase().includes(query) ||
                (template.category || "").toLowerCase().includes(query);
            if (!matchesSearch) return false;
        }

        // Category filter - only show orphan templates that match selected categories
        const selectedCategories = selectedFilters["category"] || [];
        if (selectedCategories.length > 0) {
            // If categories are selected, only show templates that have a matching category
            if (!template.category || !selectedCategories.includes(template.category)) {
                return false;
            }
        }

        return true;
    });

    // Total count
    const totalCount = filteredDocumentTypes.length + filteredOrphanTemplates.length;

    // Use the apiCategoryLabels for card display (already built above)
    const categoryLabels = apiCategoryLabels;

    return (
        <section className="bg-gray-50 min-h-screen font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {/* Search bar */}
                    <div className="max-w-2xl mx-auto">
                        <label className="block text-sm text-gray-600 mb-2">
                            ค้นหาแบบฟอร์ม
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="พิมพ์ชื่อแบบฟอร์ม..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398] focus:ring-1 focus:ring-[#007398]"
                                />
                            </div>
                            <button className="px-4 py-2.5 bg-[#007398] text-white rounded hover:bg-[#005f7a] transition-colors">
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
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
                                {loading ? "..." : totalCount.toLocaleString()} แบบฟอร์ม
                            </h2>
                        </div>

                        {/* Filters */}
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

                            {/* All Filter Sections */}
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
                                    จัดการกลุ่มเอกสาร
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

                    {/* Main Content - Grid of Document Type Cards */}
                    <main className="flex-1 min-w-0">
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

                        {/* Results Grid */}
                        {!loading && !error && (
                            <div>
                                {totalCount > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        {/* Document Type Cards */}
                                        {filteredDocumentTypes.map((docType) => (
                                            <DocumentTypeCard
                                                key={docType.id}
                                                documentType={docType}
                                                categoryLabels={categoryLabels}
                                            />
                                        ))}
                                        {/* Orphan Template Cards */}
                                        {filteredOrphanTemplates.map((template) => (
                                            <OrphanTemplateCard
                                                key={template.id}
                                                template={template}
                                                categoryLabels={categoryLabels}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white rounded border border-gray-200">
                                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-sm text-gray-500 mb-4">
                                            {hasActiveFilters
                                                ? "ไม่พบแบบฟอร์มที่ตรงกับการค้นหา"
                                                : "ยังไม่มีแบบฟอร์ม"}
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

                            </div>
                        )}
                    </main>

                    {/* Right Sidebar */}
                    <aside className="w-48 flex-shrink-0 hidden xl:block">
                        <SuggestedTopics />
                    </aside>
                </div>
            </div>
        </section>
    );
}
