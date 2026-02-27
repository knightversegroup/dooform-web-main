"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowDownAZ,
  ArrowUpRight,
  ArrowUpZA,
  ChevronLeft,
  ChevronRight,
  FileText,
  Search,
  X,
} from "lucide-react";
import { LogoLoaderInline } from "@dooform/shared";
import { apiClient } from "@dooform/shared/api/client";
import { FilterCategory, Template } from "@dooform/shared/api/types";

// ============================================================================
// Constants
// ============================================================================

const THAI_CONSONANTS = [
  "ก", "ข", "ฃ", "ค", "ฅ", "ฆ", "ง", "จ", "ฉ", "ช",
  "ซ", "ฌ", "ญ", "ฎ", "ฏ", "ฐ", "ฑ", "ฒ", "ณ", "ด",
  "ต", "ถ", "ท", "ธ", "น", "บ", "ป", "ผ", "ฝ", "พ",
  "ฟ", "ภ", "ม", "ย", "ร", "ล", "ว", "ศ", "ษ", "ส",
  "ห", "ฬ", "อ", "ฮ",
];

// ============================================================================
// Sub-components
// ============================================================================

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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FileText className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-900 font-medium">ไม่พบเอกสาร</p>
      <p className="text-sm text-gray-500 mt-1">ยังไม่มีเอกสารในระบบ</p>
    </div>
  );
}

function RecentDocumentThumbnail({ template }: { template: Template }) {
  const [imgError, setImgError] = useState(false);
  const thumbnailUrl = apiClient.getThumbnailUrl(template.id);

  return (
    <Link
      href={`/forms/${template.id}`}
      className="flex-shrink-0 block"
    >
      <div className="w-[180px] h-[256px] border border-[#cdcdcd] rounded overflow-hidden bg-white hover:shadow-md transition-shadow">
        {thumbnailUrl && !imgError ? (
          <img
            src={thumbnailUrl}
            alt={template.name}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
            <span className="text-3xl font-semibold text-neutral-300">
              {template.name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <p className="mt-2 text-sm text-neutral-700 truncate w-[180px]">{template.name}</p>
    </Link>
  );
}

// ============================================================================
// Custom Hooks
// ============================================================================

function useTemplateData() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<Template[]>([]);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [allTemplates, filtersResponse, popularResponse] = await Promise.all([
          apiClient.getTemplatesFiltered({ includeDocumentType: true }),
          apiClient.getFilters().catch(() => [] as FilterCategory[]),
          apiClient.getTemplatesFiltered({
            sort: 'popular',
            limit: 10,
            includeDocumentType: true
          }).catch(() => [] as Template[]),
        ]);

        setTemplates(allTemplates || []);
        setPopularTemplates(popularResponse || []);
        setFilterCategories(filtersResponse.filter((f) => f.is_active));
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "Failed to load templates");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { templates, popularTemplates, filterCategories, loading, error };
}

// ============================================================================
// Main Component
// ============================================================================

export default function TemplateGroupList() {
  const { templates, popularTemplates, filterCategories, loading, error } = useTemplateData();

  // New state
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Refs
  const alphabetNavRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Category labels from filter data
  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    filterCategories.forEach((filter) => {
      if (filter.field_name === "category") {
        filter.options?.forEach((opt) => {
          labels[opt.value] = opt.label;
        });
      }
    });
    return labels;
  }, [filterCategories]);

  const getCategoryLabel = (category: string | undefined) =>
    categoryLabels[category || ""] || category || "ทั่วไป";

  // Recent templates for the top section
  const recentTemplates = useMemo(() => {
    if (popularTemplates.length > 0) {
      return popularTemplates.slice(0, 7);
    }
    return templates.slice(0, 7);
  }, [popularTemplates, templates]);

  // Filter templates by search term
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    const term = searchTerm.trim().toLowerCase();
    return templates.filter(
      (tmpl) =>
        tmpl.name.toLowerCase().includes(term) ||
        (tmpl.description && tmpl.description.toLowerCase().includes(term)) ||
        (tmpl.document_type?.name && tmpl.document_type.name.toLowerCase().includes(term))
    );
  }, [templates, searchTerm]);

  // Group filtered templates alphabetically, respecting sort direction
  const alphabeticalGroups = useMemo(() => {
    const sorted = [...filteredTemplates].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, "th");
      return sortDirection === "asc" ? cmp : -cmp;
    });
    const groups: Record<string, Template[]> = {};

    sorted.forEach((tmpl) => {
      const firstChar = tmpl.name.charAt(0);
      if (!groups[firstChar]) groups[firstChar] = [];
      groups[firstChar].push(tmpl);
    });

    return Object.entries(groups).sort(([a], [b]) => {
      const cmp = a.localeCompare(b, "th");
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredTemplates, sortDirection]);

  // Set of letters that have templates (for enabling/disabling alphabet buttons)
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    filteredTemplates.forEach((tmpl) => letters.add(tmpl.name.charAt(0)));
    return letters;
  }, [filteredTemplates]);

  // Scroll the alphabet nav strip
  const scrollAlphabetNav = useCallback((direction: "left" | "right") => {
    if (!alphabetNavRef.current) return;
    const scrollAmount = direction === "left" ? -200 : 200;
    alphabetNavRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }, []);

  // Click a letter in the alphabet nav
  const handleLetterClick = useCallback((letter: string) => {
    setActiveLetter(letter);
    const el = letterRefs.current[letter];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Render states
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (templates.length === 0) return <EmptyState />;

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-[1080px] mx-auto px-[8px] py-8 flex flex-col gap-[32px]">
        {/* Recent Documents Section */}
        {recentTemplates.length > 0 && (
          <section className="flex flex-col gap-[20px]">
            <div>
              <h2 className="text-[24px] font-semibold text-black">เอกสารล่าสุด</h2>
              <p className="text-[16px] font-normal text-black mt-[2px]">
                เลือกเอกสารล่าสุดที่คุณได้กรอกไปแล้ว
              </p>
            </div>
            <div className="relative">
              <div className="flex gap-[12px] overflow-x-auto pb-2 scrollbar-hide">
                {recentTemplates.map((template) => (
                  <RecentDocumentThumbnail key={template.id} template={template} />
                ))}
              </div>
              {/* Right fade gradient */}
              <div className="absolute top-0 right-0 w-[180px] h-full pointer-events-none bg-gradient-to-l from-white to-transparent" />
            </div>
          </section>
        )}

        {/* Template Selection Section */}
        <section className="sticky top-[112px] z-10 bg-white flex flex-col gap-[20px] pt-[20px] pb-[12px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[24px] font-semibold text-black">เลือกเทมเพลต</h2>
              <p className="text-[16px] font-normal text-black mt-[2px]">
                เลือกเทมเพลตเอกสารที่ต้องการสร้าง
              </p>
            </div>
            <Link
              href="/forms/new"
              className="inline-flex items-center justify-center px-[8px] py-[4px] bg-[#013087] border-[0.5px] border-[#013087] text-white text-[14px] font-medium rounded hover:bg-[#013087]/90 transition-colors"
            >
              สร้างเอกสารใหม่
            </Link>
          </div>

          {/* Search + Sort + Alphabet Navigation (single row per Figma) */}
          <div className="flex items-center gap-[20px]">
            {/* Search + Sort group */}
            <div className="flex items-center gap-[4px] shrink-0">
              {/* Search Input */}
              <div className="relative w-[567px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setActiveLetter(null);
                  }}
                  placeholder="ค้นหาเอกสาร..."
                  className="w-full h-[31px] pl-3 pr-8 border-[0.5px] border-[#b3b3b3] rounded text-[14px] font-medium text-black placeholder:text-[#b3b3b3] focus:outline-none focus:border-[#013087] transition-colors"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#b3b3b3]" />
              </div>

              {/* Sort Toggle */}
              <button
                onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                className="w-[31px] h-[31px] flex items-center justify-center border-[0.5px] border-[#b3b3b3] rounded hover:bg-gray-50 transition-colors"
                title={sortDirection === "asc" ? "เรียง ก-ฮ" : "เรียง ฮ-ก"}
              >
                {sortDirection === "asc" ? (
                  <ArrowDownAZ className="w-[18px] h-[18px] text-[#4d4d4d]" />
                ) : (
                  <ArrowUpZA className="w-[18px] h-[18px] text-[#4d4d4d]" />
                )}
              </button>
            </div>

            {/* Alphabet Navigation group */}
            <div className="flex items-center gap-[2px] min-w-0">
              <button
                onClick={() => scrollAlphabetNav("left")}
                className="w-[31px] h-[31px] flex-shrink-0 flex items-center justify-center border-[0.5px] border-[#b3b3b3] rounded hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-[18px] h-[18px] text-[#4d4d4d]" />
              </button>

              <div
                ref={alphabetNavRef}
                className="flex items-center gap-[2px] overflow-hidden min-w-0"
              >
                {THAI_CONSONANTS.filter((letter) => availableLetters.has(letter)).map((letter) => {
                  const isActive = activeLetter === letter;
                  return (
                    <button
                      key={letter}
                      onClick={() => handleLetterClick(letter)}
                      className={`w-[31px] h-[31px] flex-shrink-0 flex items-center justify-center rounded text-[14px] font-medium transition-colors ${
                        isActive
                          ? "bg-[#013087] text-white"
                          : "border-[0.5px] border-[#b3b3b3] text-black hover:bg-gray-50"
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => scrollAlphabetNav("right")}
                className="w-[31px] h-[31px] flex-shrink-0 flex items-center justify-center border-[0.5px] border-[#b3b3b3] rounded hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-[18px] h-[18px] text-[#4d4d4d]" />
              </button>
            </div>
          </div>
        </section>

        {/* Empty Search State */}
        {searchTerm.trim() && filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-900 font-medium">
              ไม่พบเอกสารที่ตรงกับ &ldquo;{searchTerm}&rdquo;
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveLetter(null);
              }}
              className="mt-3 inline-flex items-center gap-1 text-sm text-[#013087] hover:text-[#013087]/80 font-medium"
            >
              <X className="w-4 h-4" />
              ล้างการค้นหา
            </button>
          </div>
        ) : (
          /* Table Section */
          <section>
            {/* Table Header */}
            <div className="flex items-center gap-[20px] border-b border-[#e6e6e6] py-[10px] text-[14px] font-medium text-[#4d4d4d]">
              <div className="w-[347px] flex-shrink-0">ชื่อเอกสาร</div>
              <div className="w-[163px] flex-shrink-0">หมวดหมู่</div>
              <div className="w-[163px] flex-shrink-0">ปรับปรุงล่าสุด</div>
              <div className="w-[164px] flex-shrink-0">สถานะ</div>
              <div className="flex-1"></div>
            </div>

            {/* Alphabetical Groups */}
            {alphabeticalGroups.map(([letter, tmplGroup]) => (
              <div key={letter}>
                {/* Letter Header */}
                <div
                  ref={(el) => { letterRefs.current[letter] = el; }}
                  className="sticky top-[240px] z-[5] bg-white scroll-mt-[240px] text-[20px] font-semibold text-[#4d4d4d] border-b border-[#e6e6e6] py-[8px] mt-4"
                >
                  {letter}
                </div>

                {/* Template Rows */}
                {tmplGroup.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="flex items-center gap-[20px] py-[16px] border-b border-[#e6e6e6]"
                  >
                    {/* Name */}
                    <div className="w-[347px] flex-shrink-0 min-w-0">
                      <p className="font-medium text-black truncate">{tmpl.name}</p>
                      {tmpl.document_type?.name && (
                        <p className="text-[14px] text-[#666] truncate">
                          {tmpl.document_type.name}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="w-[163px] flex-shrink-0 text-[14px] font-medium text-black truncate">
                      {getCategoryLabel(tmpl.category)}
                    </div>

                    {/* Updated At */}
                    <div className="w-[163px] flex-shrink-0 text-[14px] font-medium text-black">
                      {tmpl.updated_at
                        ? new Date(tmpl.updated_at).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "-"}
                    </div>

                    {/* Status */}
                    <div className="w-[164px] flex-shrink-0 flex items-center gap-1 text-[14px] font-medium text-black">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#22c55e]" />
                      <span>พร้อมใช้งาน</span>
                    </div>

                    {/* Action */}
                    <div className="w-[164px] flex-shrink-0 flex items-center gap-1">
                      <Link
                        href={`/forms/${tmpl.id}/fill`}
                        className="inline-flex items-center gap-1 text-[14px] text-black underline hover:text-[#000091] transition-colors"
                      >
                        กรอกฟอร์ม
                        <ArrowUpRight className="w-[18px] h-[18px]" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
