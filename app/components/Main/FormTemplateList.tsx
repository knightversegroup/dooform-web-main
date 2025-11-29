"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, X, ChevronDown, ChevronUp } from "lucide-react";

// Types
interface FormTemplate {
    id: string;
    title: string;
    category: string;
    department: string;
    type: string;
    tags: string[];
}

interface FilterSection {
    id: string;
    title: string;
    options: string[];
    expanded?: boolean;
}

// Sample data
const formTemplates: FormTemplate[] = [
    {
        id: "1",
        title: "แบบฟอร์มขอลางาน (Leave Request Form)",
        category: "ทรัพยากรบุคคล",
        department: "HR",
        type: "ราชการ",
        tags: ["ลางาน", "HR", "บุคคล"],
    },
    {
        id: "2",
        title: "แบบฟอร์มเบิกค่าใช้จ่าย (Expense Claim Form)",
        category: "การเงิน",
        department: "Finance",
        type: "ราชการ",
        tags: ["การเงิน", "เบิกจ่าย"],
    },
    {
        id: "3",
        title: "แบบฟอร์มขออนุมัติโครงการ (Project Approval Form)",
        category: "บริหารโครงการ",
        department: "Management",
        type: "ราชการ",
        tags: ["โครงการ", "อนุมัติ"],
    },
    {
        id: "4",
        title: "แบบฟอร์มประเมินผลงาน (Performance Evaluation Form)",
        category: "ทรัพยากรบุคคล",
        department: "HR",
        type: "เอกชน",
        tags: ["ประเมิน", "HR"],
    },
    {
        id: "5",
        title: "แบบฟอร์มขอใช้ห้องประชุม (Meeting Room Request)",
        category: "สำนักงาน",
        department: "Admin",
        type: "เอกชน",
        tags: ["ห้องประชุม", "จอง"],
    },
    {
        id: "6",
        title: "แบบฟอร์มรายงานปัญหา (Issue Report Form)",
        category: "IT Support",
        department: "IT",
        type: "ทั่วไป",
        tags: ["IT", "รายงาน", "ปัญหา"],
    },
    {
        id: "7",
        title: "แบบฟอร์มสมัครงาน (Job Application Form)",
        category: "ทรัพยากรบุคคล",
        department: "HR",
        type: "ทั่วไป",
        tags: ["สมัครงาน", "HR"],
    },
    {
        id: "8",
        title: "แบบฟอร์มขอสวัสดิการ (Welfare Request Form)",
        category: "ทรัพยากรบุคคล",
        department: "HR",
        type: "ราชการ",
        tags: ["สวัสดิการ", "HR"],
    },
];

const filterSections: FilterSection[] = [
    {
        id: "category",
        title: "หมวดหมู่",
        options: ["ทรัพยากรบุคคล", "การเงิน", "บริหารโครงการ", "สำนักงาน", "IT Support"],
    },
    {
        id: "department",
        title: "แผนก",
        options: ["HR", "Finance", "Management", "Admin", "IT"],
    },
    {
        id: "type",
        title: "ประเภทเอกสาร",
        options: ["ราชการ", "เอกชน", "ทั่วไป"],
    },
];

// Filter Checkbox Component
function FilterCheckbox({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    checked
                        ? "bg-primary border-primary"
                        : "border-border-default group-hover:border-primary"
                }`}
            >
                {checked && (
                    <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                )}
            </div>
            <span className="text-body-sm text-text-default">{label}</span>
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
    onFilterChange: (option: string) => void;
}) {
    const [expanded, setExpanded] = useState(true);
    const initialShow = 4;
    const [showAll, setShowAll] = useState(false);

    const visibleOptions = showAll
        ? section.options
        : section.options.slice(0, initialShow);
    const hasMore = section.options.length > initialShow;

    return (
        <div className="border-b border-border-default pb-4 mb-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full mb-3"
            >
                <span className="text-body font-semibold text-foreground">
                    {section.title}
                </span>
                {expanded ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                )}
            </button>

            {expanded && (
                <div className="space-y-3 pl-1">
                    {visibleOptions.map((option) => (
                        <FilterCheckbox
                            key={option}
                            label={option}
                            checked={selectedFilters.includes(option)}
                            onChange={() => onFilterChange(option)}
                        />
                    ))}
                    {hasMore && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="text-body-sm text-primary hover:underline"
                        >
                            {showAll
                                ? "แสดงน้อยลง"
                                : `ดูเพิ่มเติม (${section.options.length - initialShow})`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// Template Card Component
function TemplateCard({ template }: { template: FormTemplate }) {
    return (
        <Link
            href={`/forms/${template.id}`}
            className="block bg-background border border-border-default rounded-lg p-5 hover:shadow-md hover:border-primary/30 transition-all"
        >
            <div className="space-y-3">
                {/* Title */}
                <h3 className="text-h4 text-foreground font-semibold leading-snug">
                    {template.title}
                </h3>

                {/* Tags/Badges */}
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-caption font-medium bg-primary/10 text-primary">
                        {template.category}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-caption font-medium bg-surface-alt text-text-muted border border-border-default">
                        {template.department}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-caption font-medium bg-surface-alt text-text-muted border border-border-default">
                        {template.type}
                    </span>
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-2 text-body-sm text-text-muted">
                    <MapPin className="w-4 h-4" />
                    <span>{template.department}</span>
                    <span>|</span>
                    <span>{template.type}</span>
                    <span>|</span>
                    <span>{template.category}</span>
                </div>
            </div>
        </Link>
    );
}

// Main Component
export default function FormTemplateList() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
        category: [],
        department: [],
        type: [],
    });

    const handleFilterChange = (sectionId: string, option: string) => {
        setSelectedFilters((prev) => {
            const current = prev[sectionId] || [];
            const updated = current.includes(option)
                ? current.filter((item) => item !== option)
                : [...current, option];
            return { ...prev, [sectionId]: updated };
        });
    };

    const clearFilters = () => {
        setSelectedFilters({
            category: [],
            department: [],
            type: [],
        });
        setSearchQuery("");
    };

    const hasActiveFilters =
        Object.values(selectedFilters).some((arr) => arr.length > 0) ||
        searchQuery.length > 0;

    // Filter templates
    const filteredTemplates = formTemplates.filter((template) => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                template.title.toLowerCase().includes(query) ||
                template.category.toLowerCase().includes(query) ||
                template.tags.some((tag) => tag.toLowerCase().includes(query));
            if (!matchesSearch) return false;
        }

        // Category filter
        if (
            selectedFilters.category.length > 0 &&
            !selectedFilters.category.includes(template.category)
        ) {
            return false;
        }

        // Department filter
        if (
            selectedFilters.department.length > 0 &&
            !selectedFilters.department.includes(template.department)
        ) {
            return false;
        }

        // Type filter
        if (
            selectedFilters.type.length > 0 &&
            !selectedFilters.type.includes(template.type)
        ) {
            return false;
        }

        return true;
    });

    return (
        <section className="bg-background font-sans min-h-screen">
            <div className="container-main section-padding">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Sidebar - Filters */}
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        {/* Search */}
                        <div className="mb-6">
                            <h2 className="text-h3 text-foreground mb-4">ค้นหา</h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="ค้นหาเทมเพลต..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 pl-11 border border-border-default rounded-lg text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        <X className="w-4 h-4 text-text-muted hover:text-foreground" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Header */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-h4 text-foreground">ตัวกรอง</span>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-body-sm text-text-muted hover:text-primary"
                                >
                                    ล้างตัวกรอง
                                </button>
                            )}
                        </div>

                        {/* Filter Sections */}
                        <div className="bg-surface-alt rounded-lg p-4">
                            {filterSections.map((section) => (
                                <FilterSectionComponent
                                    key={section.id}
                                    section={section}
                                    selectedFilters={selectedFilters[section.id] || []}
                                    onFilterChange={(option) =>
                                        handleFilterChange(section.id, option)
                                    }
                                />
                            ))}
                        </div>
                    </aside>

                    {/* Right Content - Template List */}
                    <main className="flex-1">
                        {/* Results Header */}
                        <div className="mb-6">
                            <h1 className="text-h2 text-foreground mb-2">
                                เทมเพลตเอกสาร
                            </h1>
                            <p className="text-body text-text-muted">
                                พบ {filteredTemplates.length} รายการ
                            </p>
                        </div>

                        {/* Template Cards */}
                        <div className="space-y-4">
                            {filteredTemplates.length > 0 ? (
                                filteredTemplates.map((template) => (
                                    <TemplateCard key={template.id} template={template} />
                                ))
                            ) : (
                                <div className="text-center py-12 bg-surface-alt rounded-lg">
                                    <p className="text-body text-text-muted">
                                        ไม่พบเทมเพลตที่ตรงกับการค้นหา
                                    </p>
                                    <button
                                        onClick={clearFilters}
                                        className="mt-4 text-primary hover:underline"
                                    >
                                        ล้างตัวกรองทั้งหมด
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </section>
    );
}
