"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Eye, FileText } from "lucide-react";
import LogoLoaderInline from "@/components/feedback/LogoLoaderInline";
import { apiClient } from "@dooform/shared/api/client";
import { FilterCategory, Template } from "@dooform/shared/api/types";

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

  // Group templates alphabetically by first character of name
  const alphabeticalGroups = useMemo(() => {
    const sorted = [...templates].sort((a, b) => a.name.localeCompare(b.name, "th"));
    const groups: Record<string, Template[]> = {};

    sorted.forEach((tmpl) => {
      const firstChar = tmpl.name.charAt(0);
      if (!groups[firstChar]) groups[firstChar] = [];
      groups[firstChar].push(tmpl);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, "th"));
  }, [templates]);

  // Render states
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (templates.length === 0) return <EmptyState />;

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="max-w-[1080px] mx-auto px-2 py-8 flex flex-col gap-[32px]">
        {/* Recent Documents Section */}
        {recentTemplates.length > 0 && (
          <section>
            <h2 className="text-[24px] font-semibold text-black">เอกสารล่าสุด</h2>
            <p className="text-[16px] font-normal text-neutral-600 mt-1">
              เลือกเอกสารล่าสุดที่คุณได้กรอกไปแล้ว
            </p>
            <div className="relative mt-4">
              <div className="flex gap-[12px] overflow-x-auto pb-2 scrollbar-hide">
                {recentTemplates.map((template) => (
                  <RecentDocumentThumbnail key={template.id} template={template} />
                ))}
              </div>
              {/* Right fade gradient */}
              <div className="absolute top-0 right-0 w-[80px] h-full pointer-events-none bg-gradient-to-l from-white to-transparent" />
            </div>
          </section>
        )}

        {/* Table Section */}
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
              <div className="text-[20px] font-semibold text-[#4d4d4d] border-b border-[#e6e6e6] py-[8px] mt-4">
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
                  <div className="w-[163px] flex-shrink-0 text-[14px] text-[#4d4d4d] truncate">
                    {getCategoryLabel(tmpl.category)}
                  </div>

                  {/* Updated At */}
                  <div className="w-[163px] flex-shrink-0 text-[14px] text-[#4d4d4d]">
                    {tmpl.updated_at
                      ? new Date(tmpl.updated_at).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </div>

                  {/* Status */}
                  <div className="w-[164px] flex-shrink-0 flex items-center gap-2 text-[14px]">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#22c55e]" />
                    <span className="text-[#4d4d4d]">พร้อมใช้งาน</span>
                  </div>

                  {/* Action */}
                  <div className="flex-1 flex items-center gap-3">
                    <Link
                      href={`/forms/${tmpl.id}`}
                      className="text-[#4d4d4d] hover:text-[#000091] transition-colors"
                      title="ดูรายละเอียด"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/forms/${tmpl.id}/fill`}
                      className="inline-flex items-center gap-1 text-[14px] text-black underline hover:text-[#000091] transition-colors"
                    >
                      กรอกฟอร์ม
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
