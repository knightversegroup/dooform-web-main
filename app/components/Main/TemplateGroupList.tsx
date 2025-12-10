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
import { DocumentType, FilterCategory } from "@/lib/api/types";

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

// Document Type Card Component
function DocumentTypeCard({ documentType }: { documentType: DocumentType }) {
    const templateCount = documentType.templates?.length || 0;
    const hasVerified = documentType.templates?.some((t) => t.is_verified);
    const hasAI = documentType.templates?.some((t) => t.is_ai_available);
    const bgColor = getHeaderBgColor(documentType.category);

    return (
        <Link
            href={`/templates/${documentType.id}`}
            className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
        >
            {/* Header Banner */}
            <div
                className="h-2"
                style={{ backgroundColor: bgColor }}
            />

            <div className="p-4">
                {/* Category and badges */}
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-600">
                        {documentType.category || "เอกสาร"}
                    </span>
                    {hasVerified && (
                        <span className="inline-flex items-center text-xs text-blue-600">
                            <CheckCircle className="w-3 h-3 mr-0.5" />
                            Verified
                        </span>
                    )}
                    {hasAI && (
                        <span className="inline-flex items-center text-xs text-purple-600">
                            <Sparkles className="w-3 h-3 mr-0.5" />
                            AI
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-[#007398] transition-colors mb-1">
                    {documentType.name}
                </h3>

                {/* English name */}
                {documentType.name_en && (
                    <p className="text-sm text-gray-500 mb-2">
                        {documentType.name_en}
                    </p>
                )}

                {/* Description */}
                {documentType.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {documentType.description}
                    </p>
                )}

                {/* Footer info */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="inline-flex items-center text-sm text-gray-600">
                        <FileText className="w-4 h-4 mr-1" />
                        {templateCount} รูปแบบ
                    </span>
                    <span className="text-sm text-[#007398] group-hover:underline flex items-center gap-1">
                        ดูรายละเอียด
                        <ChevronRight className="w-4 h-4" />
                    </span>
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
    const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

    // Load document types from API
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch document types with templates
                const [docTypesResponse, filtersResponse] = await Promise.all([
                    apiClient.getDocumentTypes({ includeTemplates: true, activeOnly: true }),
                    apiClient.getFilters().catch(() => [] as FilterCategory[]),
                ]);

                setDocumentTypes(docTypesResponse || []);

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

    // Build filter sections for category
    const categoryFilterSection: FilterSection | null = (() => {
        const categorySet = new Map<string, number>();
        documentTypes.forEach((dt) => {
            if (dt.category) {
                categorySet.set(dt.category, (categorySet.get(dt.category) || 0) + 1);
            }
        });

        if (categorySet.size === 0) return null;

        return {
            id: "category",
            fieldName: "category",
            title: "หมวดหมู่",
            options: Array.from(categorySet.entries()).map(([value, count]) => ({
                value,
                label: value,
                count,
            })),
        };
    })();

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

    return (
        <section className="bg-gray-50 min-h-screen font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    {/* Search bar */}
                    <div className="max-w-2xl mx-auto">
                        <label className="block text-sm text-gray-600 mb-2">
                            ค้นหากลุ่มเอกสาร
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="พิมพ์ชื่อกลุ่มเอกสาร..."
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
                                {loading ? "..." : filteredDocumentTypes.length.toLocaleString()} กลุ่มเอกสาร
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

                            {/* Category Filter Section */}
                            {categoryFilterSection && (
                                <FilterSectionComponent
                                    section={categoryFilterSection}
                                    selectedFilters={selectedFilters["category"] || []}
                                    onFilterChange={(value) =>
                                        handleFilterChange("category", value)
                                    }
                                />
                            )}
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
                                {filteredDocumentTypes.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredDocumentTypes.map((docType) => (
                                            <DocumentTypeCard
                                                key={docType.id}
                                                documentType={docType}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white rounded border border-gray-200">
                                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-sm text-gray-500 mb-4">
                                            {hasActiveFilters
                                                ? "ไม่พบกลุ่มเอกสารที่ตรงกับการค้นหา"
                                                : "ยังไม่มีกลุ่มเอกสาร"}
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

                                {/* Browse by form link */}
                                {!loading && filteredDocumentTypes.length > 0 && (
                                    <div className="mt-8 p-4 bg-white border border-gray-200 rounded">
                                        <h4 className="font-medium text-gray-900 mb-1">
                                            ต้องการค้นหาแบบฟอร์มโดยตรง?
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                            ไปที่หน้าเทมเพลตเพื่อค้นหาและใช้งานแบบฟอร์มโดยตรง
                                        </p>
                                        <Link
                                            href="/forms"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white rounded text-sm hover:bg-[#005f7a] transition-colors"
                                        >
                                            ไปยังหน้าเทมเพลต
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
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
