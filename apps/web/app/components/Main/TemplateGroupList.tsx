"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2, Plus, CirclePlus, FileText } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { DocumentType, FilterCategory, Template } from "@/lib/api/types";

// Document Preview Card Component
function DocumentCard({ documentType }: { documentType: DocumentType }) {
  const templateCount = documentType.templates?.length || 0;

  return (
    <Link
      href={`/templates/${documentType.id}`}
      className="flex flex-col gap-3 items-center group flex-shrink-0"
    >
      {/* A4 Preview */}
      <div className="bg-white w-[140px] h-[198px] rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow flex items-center justify-center">
        <FileText className="w-12 h-12 text-gray-300" />
      </div>
      {/* Label */}
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
          {documentType.name}
        </p>
        <p className="text-xs text-gray-500">{templateCount} รูปแบบ</p>
      </div>
    </Link>
  );
}

// Category Card Component
function CategoryCard({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl p-6 flex items-end justify-between h-[140px] hover:shadow-md transition-shadow group flex-shrink-0 w-full sm:w-[280px]"
    >
      <div>
        <p className="text-base font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
      <CirclePlus className="w-7 h-7 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
    </Link>
  );
}

// Section Component
function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`px-8 py-8 ${className}`}>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">{title}</h2>
      {children}
    </section>
  );
}

// Main Component
export default function TemplateGroupList() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [orphanTemplates, setOrphanTemplates] = useState<Template[]>([]);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
          err instanceof Error ? err.message : "Failed to load document types",
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
    (cat) => cat.field_name === "category",
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
    {} as Record<string, DocumentType[]>,
  );

  // Filter document types by search
  const filteredDocumentTypes = searchQuery
    ? documentTypes.filter((docType) => {
        const query = searchQuery.toLowerCase();
        return (
          docType.name.toLowerCase().includes(query) ||
          (docType.name_en || "").toLowerCase().includes(query) ||
          (docType.description || "").toLowerCase().includes(query)
        );
      })
    : documentTypes;

  // Get recent documents (first 7)
  const recentDocuments = filteredDocumentTypes.slice(0, 7);

  // Get unique categories for category cards
  const categories = Object.keys(categorizedDocTypes).map((key) => ({
    key,
    label: apiCategoryLabels[key] || key,
    count: categorizedDocTypes[key].length,
  }));

  return (
    <div className="min-h-screen bg-[#f1f1f1] rounded-3xl overflow-hidden font-sans">
      {/* Hero Section - Recent Documents */}
      <section className="bg-[#d5d5d5] rounded-t-3xl px-8 pt-10 pb-8">
        {/* Header with search */}
        <div className="flex items-center justify-between gap-6 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            เอกสารที่แปลล่าสุด
          </h1>
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="ค้นหาแบบฟอร์มทั้งหมด"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Document Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-gray-700 hover:underline text-sm"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <div className="flex gap-8 overflow-x-auto pb-4 scrollbar-hide">
            {recentDocuments.map((docType) => (
              <DocumentCard key={docType.id} documentType={docType} />
            ))}
            {recentDocuments.length === 0 && (
              <div className="flex-1 text-center py-8">
                <p className="text-gray-500">ไม่พบเอกสาร</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Category Sections */}
      {categories.length > 0 && (
        <Section title="เลือกตามหมวดหมู่" className="bg-[#c5c5c5]">
          <div className="flex flex-wrap gap-6">
            {categories.slice(0, 4).map((cat) => (
              <CategoryCard
                key={cat.key}
                title={cat.label}
                subtitle={`${cat.count} ประเภทเอกสาร`}
                href={`/templates?category=${cat.key}`}
              />
            ))}
          </div>
        </Section>
      )}

      {/* More Categories */}
      {categories.length > 4 && (
        <Section title="หมวดหมู่เพิ่มเติม" className="bg-[#e4e1e1]">
          <div className="flex flex-wrap gap-6">
            {categories.slice(4, 8).map((cat) => (
              <CategoryCard
                key={cat.key}
                title={cat.label}
                subtitle={`${cat.count} ประเภทเอกสาร`}
                href={`/templates?category=${cat.key}`}
              />
            ))}
          </div>
        </Section>
      )}

      {/* All Document Types Section */}
      {!loading && !error && documentTypes.length > 0 && (
        <Section title="เอกสารทั้งหมด" className="bg-[#f1f1f1]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocumentTypes.map((docType) => (
              <Link
                key={docType.id}
                href={`/templates/${docType.id}`}
                className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 truncate group-hover:text-gray-700">
                      {docType.name}
                    </h3>
                    {docType.original_source && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {docType.original_source}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {docType.templates?.length || 0} รูปแบบ
                    </p>
                  </div>
                  <CirclePlus className="w-6 h-6 text-gray-300 group-hover:text-gray-500 flex-shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Orphan Templates Section */}
      {!loading && !error && orphanTemplates.length > 0 && (
        <Section title="แบบฟอร์มเดี่ยว" className="bg-[#e8e8e8]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orphanTemplates.map((template) => (
              <Link
                key={template.id}
                href={`/forms/${template.id}`}
                className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-gray-900 truncate group-hover:text-gray-700">
                      {template.display_name || template.name}
                    </h3>
                    {template.original_source && (
                      <p className="text-sm text-gray-500 mt-1 truncate">
                        {template.original_source}
                      </p>
                    )}
                  </div>
                  <CirclePlus className="w-6 h-6 text-gray-300 group-hover:text-gray-500 flex-shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* Quick Action FAB */}
      <Link
        href="/forms/new"
        className="fixed bottom-6 right-6 w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
