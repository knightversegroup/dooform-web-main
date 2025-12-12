"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  Scan,
  Eye,
  Send,
  ChevronRight,
  Info,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Template, FieldDefinition } from "@/lib/api/types";
import { Button } from "@/app/components/ui/Button";
import { SmartInput } from "@/app/components/ui/SmartInput";
import { OCRScanner } from "@/app/components/ui/OCRScanner";
import { DocumentPreview } from "@/app/components/ui/DocumentPreview";
import { useAuth } from "@/lib/auth/context";
import {
  groupFieldsBySavedGroup,
  type GroupedSection,
  splitMergedValue,
  formatDateToDisplay,
  type DateFormat,
} from "@/lib/utils/fieldTypes";
import { AddressSelection } from "@/lib/api/addressService";

// Helper to parse placeholders
const parsePlaceholders = (placeholdersJson: string): string[] => {
  try {
    return JSON.parse(placeholdersJson || "[]");
  } catch {
    return [];
  }
};

// Helper to parse aliases
const parseAliases = (aliasesJson: string): Record<string, string> => {
  try {
    return JSON.parse(aliasesJson || "{}");
  } catch {
    return {};
  }
};

// Get header background color based on category
function getHeaderBgColor(category: string): string {
  const colors: Record<string, string> = {
    government: "#b91c1c", // red-700
    legal: "#1d4ed8", // blue-700
    finance: "#047857", // emerald-700
    education: "#7c3aed", // violet-600
    hr: "#c2410c", // orange-700
    business: "#0f766e", // teal-700
    identification: "#be185d", // pink-700
    certificate: "#4338ca", // indigo-700
    other: "#374151", // gray-700
  };
  return colors[category] || "#007398"; // default ScienceDirect blue
}

// Section color palette for preview highlighting
const SECTION_COLORS = [
  { bg: "#FEF3C7", text: "#92400E" }, // 0: yellow
  { bg: "#DBEAFE", text: "#1E40AF" }, // 1: blue
  { bg: "#FCE7F3", text: "#9D174D" }, // 2: pink
  { bg: "#D1FAE5", text: "#065F46" }, // 3: green
  { bg: "#E0E7FF", text: "#3730A3" }, // 4: purple
  { bg: "#FEE2E2", text: "#991B1B" }, // 5: red
  { bg: "#F3F4F6", text: "#374151" }, // 6: gray
  { bg: "#CFFAFE", text: "#155E75" }, // 7: cyan
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FillFormPage({ params }: PageProps) {
  const { id: templateId } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    documentId: string;
    downloadUrl: string;
    downloadPdfUrl?: string;
  } | null>(null);

  // Form data state
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Field definitions
  const [fieldDefinitions, setFieldDefinitions] = useState<
    Record<string, FieldDefinition>
  >({});
  const [groupedSections, setGroupedSections] = useState<GroupedSection[]>([]);

  // HTML Preview state
  const [htmlContent, setHtmlContent] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [hasPreview, setHasPreview] = useState(false);

  // Active field for highlighting
  const [activeField, setActiveField] = useState<string | null>(null);

  // OCR Scanner state
  const [showOCRScanner, setShowOCRScanner] = useState(false);

  // Calculate progress
  const filledFieldsCount = useMemo(() => {
    return Object.values(formData).filter((v) => v.trim() !== "").length;
  }, [formData]);

  const totalFieldsCount = useMemo(() => {
    return Object.keys(formData).length;
  }, [formData]);

  const progressPercentage = useMemo(() => {
    if (totalFieldsCount === 0) return 0;
    return Math.round((filledFieldsCount / totalFieldsCount) * 100);
  }, [filledFieldsCount, totalFieldsCount]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/forms/${templateId}/fill`);
    }
  }, [authLoading, isAuthenticated, router, templateId]);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.getAllTemplates();
        const foundTemplate = response.templates?.find(
          (t) => t.id === templateId,
        );

        if (!foundTemplate) {
          setError("ไม่พบเทมเพลตที่ต้องการ");
          return;
        }

        setTemplate(foundTemplate);

        // Initialize form data
        const placeholders = parsePlaceholders(foundTemplate.placeholders);
        const initialData: Record<string, string> = {};
        placeholders.forEach((p) => {
          const key = p.replace(/\{\{|\}\}/g, "");
          initialData[key] = "";
        });
        setFormData(initialData);

        // Fetch field definitions
        try {
          const definitions = await apiClient.getFieldDefinitions(templateId);
          setFieldDefinitions(definitions);

          // Filter out hidden merged fields
          const visibleDefinitions: Record<string, FieldDefinition> = {};
          Object.entries(definitions).forEach(([key, def]) => {
            if (def.group?.startsWith("merged_hidden_")) {
              return;
            }
            visibleDefinitions[key] = def;
          });

          setFormData((prev) => {
            const updated = { ...prev };
            Object.keys(visibleDefinitions).forEach((key) => {
              const cleanKey = key.replace(/\{\{|\}\}/g, "");
              if (!(cleanKey in updated)) {
                updated[cleanKey] = "";
              }
            });
            return updated;
          });

          const sections = groupFieldsBySavedGroup(visibleDefinitions);
          setGroupedSections(sections);
        } catch (err) {
          console.error("Failed to load field definitions:", err);
          setFieldDefinitions({});
          setGroupedSections([]);
        }

        // Load HTML preview
        if (foundTemplate.gcs_path_html) {
          try {
            const html = await apiClient.getHTMLPreview(templateId);
            setHtmlContent(html);
            const initialPreview = html.replace(/\{\{([^}]+)\}\}/g, "");
            setPreviewHtml(initialPreview);
            setHasPreview(true);
          } catch (err) {
            console.error("Failed to load HTML preview:", err);
            setHasPreview(false);
          }
        }
      } catch (err) {
        console.error("Failed to load template:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load template",
        );
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  // Build field to color map
  const fieldColorMap = useMemo(() => {
    const map: Record<string, { bg: string; text: string }> = {};
    groupedSections.forEach((section) => {
      const color = SECTION_COLORS[section.colorIndex % SECTION_COLORS.length];
      section.fields.forEach((def) => {
        const key = def.placeholder.replace(/\{\{|\}\}/g, "");
        map[key] = color;
      });
    });
    return map;
  }, [groupedSections]);

  // Update preview when form values change
  useEffect(() => {
    if (htmlContent && hasPreview) {
      let updatedHtml = htmlContent;
      updatedHtml = updatedHtml.replace(/&#123;/g, "{").replace(/&#125;/g, "}");

      Object.keys(formData).forEach((key) => {
        const definition = fieldDefinitions[key];
        const rawValue = formData[key] || "";
        const isActive = activeField === key;
        const sectionColor = fieldColorMap[key] || {
          bg: "#F3F4F6",
          text: "#374151",
        };

        // Format date values for display (only for non-merged fields)
        let displayValue = rawValue;
        if (
          definition?.inputType === "date" &&
          rawValue &&
          !definition.isMerged
        ) {
          displayValue = formatDateToDisplay(
            rawValue,
            definition.dateFormat || "dd/mm/yyyy",
          );
        }

        if (definition?.isMerged && definition.mergedFields) {
          const splitValues = splitMergedValue(
            rawValue,
            definition.mergedFields,
            definition.separator || "",
          );

          definition.mergedFields.forEach((fieldKey) => {
            const fieldValue = splitValues[fieldKey] || "";
            const placeholder = `{{${fieldKey}}}`;
            const escapedPlaceholder = placeholder.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&",
            );
            const regex = new RegExp(escapedPlaceholder, "gi");
            const fieldColor = fieldColorMap[fieldKey] || sectionColor;

            if (fieldValue) {
              if (isActive) {
                updatedHtml = updatedHtml.replace(
                  regex,
                  `<mark style="background-color: ${fieldColor.bg}; color: ${fieldColor.text}; padding: 2px 6px; border-radius: 4px; font-weight: 500;">${fieldValue}</mark>`,
                );
              } else {
                updatedHtml = updatedHtml.replace(regex, fieldValue);
              }
            } else {
              if (isActive) {
                updatedHtml = updatedHtml.replace(
                  regex,
                  `<mark style="background-color: ${fieldColor.bg}; color: ${fieldColor.text}; padding: 2px 6px; border-radius: 4px; opacity: 0.7;">___</mark>`,
                );
              } else {
                updatedHtml = updatedHtml.replace(regex, "");
              }
            }
          });
        } else {
          const placeholder = `{{${key}}}`;
          const escapedPlaceholder = placeholder.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );
          const regex = new RegExp(escapedPlaceholder, "gi");

          if (displayValue) {
            if (isActive) {
              updatedHtml = updatedHtml.replace(
                regex,
                `<mark style="background-color: ${sectionColor.bg}; color: ${sectionColor.text}; padding: 2px 6px; border-radius: 4px; font-weight: 500;">${displayValue}</mark>`,
              );
            } else {
              updatedHtml = updatedHtml.replace(regex, displayValue);
            }
          } else {
            if (isActive) {
              updatedHtml = updatedHtml.replace(
                regex,
                `<mark style="background-color: ${sectionColor.bg}; color: ${sectionColor.text}; padding: 2px 6px; border-radius: 4px; opacity: 0.7;">___</mark>`,
              );
            } else {
              updatedHtml = updatedHtml.replace(regex, "");
            }
          }
        }
      });

      updatedHtml = updatedHtml.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const formDataKey = Object.keys(formData).find(
          (k) => k.toLowerCase() === key.toLowerCase(),
        );
        if (formDataKey && formData[formDataKey]) {
          let fallbackValue = formData[formDataKey];
          // Format date values in fallback replacement
          const fallbackDef = fieldDefinitions[formDataKey];
          if (fallbackDef?.inputType === "date" && fallbackValue) {
            fallbackValue = formatDateToDisplay(
              fallbackValue,
              fallbackDef.dateFormat || "dd/mm/yyyy",
            );
          }
          return fallbackValue;
        }
        return "";
      });

      setPreviewHtml(updatedHtml);
    }
  }, [
    formData,
    htmlContent,
    hasPreview,
    activeField,
    fieldDefinitions,
    fieldColorMap,
  ]);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleOCRDataExtracted = (mappedFields: Record<string, string>) => {
    setFormData((prev) => ({
      ...prev,
      ...mappedFields,
    }));
    setShowOCRScanner(false);
  };

  const handleAddressSelect = (fieldKey: string, address: AddressSelection) => {
    const updates: Record<string, string> = {};

    Object.entries(fieldDefinitions).forEach(([placeholder, def]) => {
      const key = placeholder.replace(/\{\{|\}\}/g, "");
      const lowerPlaceholder = placeholder.toLowerCase();

      if (key === fieldKey) return;

      if (
        def.dataType === "province" ||
        lowerPlaceholder.includes("province") ||
        lowerPlaceholder.includes("จังหวัด")
      ) {
        if (!formData[key]) {
          updates[key] = address.province;
        }
      } else if (
        lowerPlaceholder.includes("district") ||
        lowerPlaceholder.includes("amphoe") ||
        lowerPlaceholder.includes("อำเภอ") ||
        lowerPlaceholder.includes("เขต")
      ) {
        if (!formData[key]) {
          updates[key] = address.district;
        }
      } else if (
        lowerPlaceholder.includes("subdistrict") ||
        lowerPlaceholder.includes("tambon") ||
        lowerPlaceholder.includes("ตำบล") ||
        lowerPlaceholder.includes("แขวง")
      ) {
        if (!formData[key]) {
          updates[key] = address.subDistrict;
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...updates,
      }));
    }
  };

  const handleDateFormatChange = (fieldKey: string, format: DateFormat) => {
    // Update the field definition with the new date format
    setFieldDefinitions((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        dateFormat: format,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setProcessing(true);

      const apiFormData: Record<string, string> = {};

      Object.keys(formData).forEach((key) => {
        const definition = fieldDefinitions[key];
        let value = formData[key];

        // Format date values according to the field's dateFormat setting
        if (
          definition?.inputType === "date" &&
          value &&
          !definition.isMerged
        ) {
          value = formatDateToDisplay(
            value,
            definition.dateFormat || "dd/mm/yyyy",
          );
        }

        if (definition?.isMerged && definition.mergedFields) {
          const splitValues = splitMergedValue(
            formData[key],
            definition.mergedFields,
            definition.separator || "",
          );

          Object.entries(splitValues).forEach(([fieldKey, fieldValue]) => {
            apiFormData[`{{${fieldKey}}}`] = fieldValue;
          });
        } else {
          apiFormData[`{{${key}}}`] = value;
        }
      });

      const response = await apiClient.processDocument(templateId, apiFormData);

      setSuccess({
        documentId: response.document_id,
        downloadUrl: response.download_url,
        downloadPdfUrl: response.download_pdf_url,
      });
    } catch (err) {
      console.error("Failed to process document:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process document",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async (format: "docx" | "pdf") => {
    if (!success) return;

    try {
      const blob = await apiClient.downloadDocument(success.documentId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template?.display_name || "document"}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download:", err);
      setError(err instanceof Error ? err.message : "Failed to download");
    }
  };

  const placeholders = template ? parsePlaceholders(template.placeholders) : [];
  const aliases = template ? parseAliases(template.aliases) : {};
  const headerBgColor = getHeaderBgColor(
    template?.category || template?.document_type?.category || "other",
  );

  // Loading states
  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#007398] animate-spin" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#007398] animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-light text-gray-900 mb-4">
            {error || "ไม่พบเทมเพลต"}
          </h1>
          <Link
            href="/forms"
            className="inline-flex items-center text-[#007398] hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปหน้ารายการ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <Link
            href={`/forms/${templateId}`}
            className="text-sm text-gray-600 hover:text-[#007398]"
          >
            ← กลับไปหน้ารายละเอียด
          </Link>
        </div>
      </div>

      {/* Header Banner */}
      <div className="relative" style={{ backgroundColor: headerBgColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            {/* Template Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/70 text-sm">กรอกแบบฟอร์ม</span>
                <ChevronRight className="w-4 h-4 text-white/50" />
              </div>
              <h1 className="text-xl md:text-2xl font-light text-white leading-tight">
                {template?.display_name || template?.name || template?.filename}
              </h1>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {template?.is_ai_available && (
                  <span className="inline-flex items-center gap-1 text-white/90 text-xs bg-white/20 px-2 py-0.5 rounded">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </span>
                )}
                {template?.tier === "free" ? (
                  <span className="inline-flex items-center gap-1 text-white/90 text-xs bg-white/20 px-2 py-0.5 rounded">
                    <Unlock className="w-3 h-3" />
                    Free
                  </span>
                ) : (
                  template?.tier && (
                    <span className="inline-flex items-center gap-1 text-white/90 text-xs bg-white/20 px-2 py-0.5 rounded">
                      <Lock className="w-3 h-3" />
                      {template.tier}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Progress Stats */}
            <div className="hidden lg:flex items-center gap-6 text-white">
              <div className="text-center">
                <div className="text-2xl font-light">
                  {filledFieldsCount}/{totalFieldsCount}
                </div>
                <div className="text-xs text-white/70">ช่องที่กรอก</div>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div className="text-center">
                <div className="text-2xl font-light">{progressPercentage}%</div>
                <div className="text-xs text-white/70">ความคืบหน้า</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left - Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOCRScanner(!showOCRScanner)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
                  showOCRScanner
                    ? "bg-[#007398] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Scan className="w-4 h-4" />
                สแกนเอกสาร
              </button>
              {template?.gcs_path_html && (
                <Link
                  href={`/forms/${templateId}/preview`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  ดูตัวอย่างเทมเพลต
                </Link>
              )}
            </div>

            {/* Right - Submit */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">
                {filledFieldsCount} จาก {totalFieldsCount} ช่อง
              </span>
              <button
                onClick={handleSubmit}
                disabled={processing || success !== null}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white text-sm font-medium rounded hover:bg-[#005f7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังสร้าง...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    สร้างเอกสาร
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* OCR Scanner */}
        {showOCRScanner && (
          <div className="mb-6">
            <OCRScanner
              templateId={templateId}
              onDataExtracted={handleOCRDataExtracted}
              onClose={() => setShowOCRScanner(false)}
            />
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="bg-white border border-green-200 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-medium text-gray-900 mb-1">
                  สร้างเอกสารสำเร็จ!
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  เอกสารของคุณพร้อมให้ดาวน์โหลดแล้ว
                  เลือกรูปแบบที่ต้องการด้านล่าง
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleDownload("docx")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white text-sm font-medium rounded hover:bg-[#005f7a] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    ดาวน์โหลด DOCX
                  </button>
                  {success.downloadPdfUrl && (
                    <button
                      onClick={() => handleDownload("pdf")}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด PDF
                    </button>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSuccess(null);
                      const initialData: Record<string, string> = {};
                      placeholders.forEach((p) => {
                        const key = p.replace(/\{\{|\}\}/g, "");
                        initialData[key] = "";
                      });
                      setFormData(initialData);
                    }}
                    className="text-sm text-[#007398] hover:underline"
                  >
                    สร้างเอกสารใหม่ →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && template && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form Layout */}
        {!success && (
          <div className={hasPreview ? "flex gap-6" : ""}>
            {/* Left Column: Form */}
            <div
              className={
                hasPreview
                  ? "w-[420px] flex-shrink-0"
                  : "max-w-2xl mx-auto w-full"
              }
            >
              <form onSubmit={handleSubmit}>
                {groupedSections.length > 0 ? (
                  <div className="space-y-4">
                    {groupedSections.map((section, sectionIdx) => (
                      <div
                        key={section.name}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                      >
                        {/* Section Header */}
                        <div
                          className="px-4 py-3 border-b border-gray-100"
                          style={{
                            backgroundColor:
                              SECTION_COLORS[
                                section.colorIndex % SECTION_COLORS.length
                              ].bg + "20",
                            borderLeftWidth: "4px",
                            borderLeftColor:
                              SECTION_COLORS[
                                section.colorIndex % SECTION_COLORS.length
                              ].text,
                          }}
                        >
                          <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center text-xs text-white"
                              style={{
                                backgroundColor:
                                  SECTION_COLORS[
                                    section.colorIndex % SECTION_COLORS.length
                                  ].text,
                              }}
                            >
                              {sectionIdx + 1}
                            </span>
                            {section.name}
                            <span className="text-gray-400 font-normal">
                              ({section.fields.length} ช่อง)
                            </span>
                          </h2>
                        </div>

                        {/* Section Fields */}
                        <div className="p-4 space-y-3">
                          {section.fields.map((definition) => {
                            const key = definition.placeholder.replace(
                              /\{\{|\}\}/g,
                              "",
                            );
                            return (
                              <SmartInput
                                key={key}
                                definition={definition}
                                value={formData[key] || ""}
                                onChange={(value) =>
                                  handleInputChange(key, value)
                                }
                                onFocus={() => setActiveField(key)}
                                onBlur={() => setActiveField(null)}
                                onAddressSelect={(address) =>
                                  handleAddressSelect(key, address)
                                }
                                onDateFormatChange={(format) =>
                                  handleDateFormatChange(key, format)
                                }
                                alias={aliases[definition.placeholder]}
                                disabled={processing}
                                compact={hasPreview}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Mobile Submit Button */}
                    <div className="lg:hidden bg-white border border-gray-200 rounded-lg p-4">
                      <button
                        type="submit"
                        disabled={processing}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#007398] text-white font-medium rounded hover:bg-[#005f7a] transition-colors disabled:opacity-50"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            กำลังสร้างเอกสาร...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            สร้างเอกสาร
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      ไม่พบช่องกรอกข้อมูลในเทมเพลตนี้
                    </p>
                  </div>
                )}
              </form>

              {/* Instructions */}
              {!hasPreview && groupedSections.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    วิธีใช้งาน
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>1. กรอกข้อมูลในแต่ละช่องตามที่ต้องการ</li>
                    <li>
                      2. สามารถใช้ &quot;สแกนเอกสาร&quot;
                      เพื่อกรอกข้อมูลอัตโนมัติ
                    </li>
                    <li>3. กดปุ่ม &quot;สร้างเอกสาร&quot; เพื่อสร้างไฟล์</li>
                    <li>4. ดาวน์โหลดเอกสารในรูปแบบ DOCX หรือ PDF</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column: Live Preview */}
            {hasPreview && (
              <div className="flex-1 min-w-0">
                <div className="sticky top-36">
                  <div className="p-4 bg-[#007398]/5 mb-4 border-l-4 border-[#007398]">
                    <div className="flex gap-2 items-center">
                      <Info className="w-5 h-5 text-[#007398] shrink-0" />
                      <span className="flex gap-1 lg:flex-row flex-col">
                        <p className="font-semibold">หมายเหตุ</p>
                        <p className="">
                          เอกสารในตัวอย่างอาจมีตำแหน่งบางที่ไม่ตรง
                          <b> แต่ฉบับจริงจะตรงตามที่กำหนดไว้</b>
                        </p>
                      </span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        ตัวอย่างเอกสาร
                      </h3>
                    </div>
                    <div className="h-[calc(100vh-12rem)] overflow-auto">
                      <DocumentPreview
                        htmlContent={previewHtml}
                        showHeader={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
