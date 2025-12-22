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
  ChevronDown,
  Info,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Template, FieldDefinition, PageOrientation, ConfigurableDataType } from "@/lib/api/types";
import { Button } from "@/app/components/ui/Button";
import { SmartInput } from "@/app/components/ui/SmartInput";
import { OCRScanner } from "@/app/components/ui/OCRScanner";
import { DocumentPreview } from "@/app/components/ui/DocumentPreview";
import { useAuth } from "@/lib/auth/context";
import {
  groupFieldsBySavedGroup,
  type GroupedSection,
  splitMergedValue,
  expandRadioGroupValue,
  formatDateToDisplay,
  type DateFormat,
} from "@/lib/utils/fieldTypes";
import { AddressSelection } from "@/lib/api/addressService";

// Step definitions
type FormStep = "fill" | "review" | "download";

interface StepConfig {
  id: FormStep;
  number: number;
  label: string;
  title: string;
}

const FORM_STEPS: StepConfig[] = [
  { id: "fill", number: 1, label: "ส่วนที่ 1", title: "กรอกข้อมูล" },
  { id: "review", number: 2, label: "ส่วนที่ 2", title: "ตรวจสอบข้อมูล" },
  { id: "download", number: 3, label: "ส่วนที่ 3", title: "ดาวน์โหลดไฟล์" },
];

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
  const { isAuthenticated, isLoading: authLoading, isAdmin, canGenerate, user, refreshQuota } = useAuth();

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

  // Step state
  const [currentStep, setCurrentStep] = useState<FormStep>("fill");
  const [selectedFileType, setSelectedFileType] = useState<"docx" | "pdf">(
    "pdf",
  );

  // Field definitions
  const [fieldDefinitions, setFieldDefinitions] = useState<
    Record<string, FieldDefinition>
  >({});
  const [groupedSections, setGroupedSections] = useState<GroupedSection[]>([]);

  // Preview state
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

  // Get current step index
  const currentStepIndex = useMemo(() => {
    return FORM_STEPS.findIndex((step) => step.id === currentStep);
  }, [currentStep]);

  const currentStepConfig = FORM_STEPS[currentStepIndex];

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/forms/${templateId}/fill`);
    }
  }, [authLoading, isAuthenticated, router, templateId]);

  // Refresh quota and redirect to template page if user has no quota (and is not admin)
  // Skip this check if user already has a successful document (they've already used quota)
  const [quotaRefreshed, setQuotaRefreshed] = useState(false);

  useEffect(() => {
    // Don't check quota if we already have a successful document or on download step
    if (success || currentStep === "download") {
      return;
    }

    const checkQuotaAndRedirect = async () => {
      if (!authLoading && isAuthenticated && !isAdmin) {
        // Refresh quota from server first
        await refreshQuota();
        // Small delay to ensure state is updated
        setTimeout(() => {
          setQuotaRefreshed(true);
        }, 100);
      } else if (!authLoading && isAuthenticated && isAdmin) {
        // Admin users don't need quota check
        setQuotaRefreshed(true);
      }
    };
    checkQuotaAndRedirect();
  }, [authLoading, isAuthenticated, isAdmin, refreshQuota, success, currentStep]);

  // After quota is refreshed, check if user can generate
  // Skip if user already has a successful document
  useEffect(() => {
    if (success || currentStep === "download") {
      return;
    }
    if (quotaRefreshed && !isAdmin && !canGenerate) {
      router.replace(`/forms/${templateId}?error=no_quota`);
    }
  }, [quotaRefreshed, canGenerate, isAdmin, router, templateId, success, currentStep]);

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
        const placeholders = foundTemplate.placeholders || [];
        const initialData: Record<string, string> = {};
        placeholders.forEach((p) => {
          const key = p.replace(/\{\{|\}\}/g, "");
          initialData[key] = "";
        });
        setFormData(initialData);

        // Fetch field definitions and configurable data types
        try {
          // Field definitions now include radio groups configured via the Canvas page
          // Radio groups have isRadioGroup: true and radioOptions array
          const [definitions, dataTypes] = await Promise.all([
            apiClient.getFieldDefinitions(templateId),
            apiClient.getConfigurableDataTypes(true).catch(() => [] as ConfigurableDataType[]),
          ]);

          // Enhance field definitions with digitFormat/locationOutputFormat/options from configurable data types
          const enhancedDefinitions: Record<string, FieldDefinition> = {};
          Object.entries(definitions).forEach(([key, def]) => {
            const enhanced = { ...def };
            const dataTypeConfig = dataTypes.find(dt => dt.code === enhanced.dataType);

            // If inputType is 'digit' and no digitFormat, look it up from configurable data type
            if (enhanced.inputType === 'digit' && !enhanced.digitFormat) {
              if (dataTypeConfig?.default_value) {
                enhanced.digitFormat = dataTypeConfig.default_value;
              }
            }

            // If inputType is 'location' and no locationOutputFormat, look it up from configurable data type
            if (enhanced.inputType === 'location' && !enhanced.locationOutputFormat) {
              if (dataTypeConfig?.default_value) {
                enhanced.locationOutputFormat = dataTypeConfig.default_value as FieldDefinition['locationOutputFormat'];
              }
            }

            // If inputType is 'select', always prefer options from configurable data type over hardcoded ones
            if (enhanced.inputType === 'select' && dataTypeConfig?.options) {
              try {
                const parsedOptions = JSON.parse(dataTypeConfig.options);
                if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
                  enhanced.validation = {
                    ...enhanced.validation,
                    options: parsedOptions,
                  };
                }
              } catch (e) {
                console.error('Failed to parse options for data type:', dataTypeConfig.code, e);
              }
            }

            // Load validation rules (pattern, minLength, maxLength, etc.) from configurable data type
            if (dataTypeConfig?.validation) {
              try {
                const parsedValidation = JSON.parse(dataTypeConfig.validation);
                if (parsedValidation && typeof parsedValidation === 'object') {
                  enhanced.validation = {
                    ...enhanced.validation,
                    ...parsedValidation,
                  };
                }
              } catch (e) {
                console.error('Failed to parse validation for data type:', dataTypeConfig.code, e);
              }
            }

            // Load data type label from configurable data type
            if (dataTypeConfig?.name) {
              enhanced.dataTypeLabel = dataTypeConfig.name;
            }

            enhancedDefinitions[key] = enhanced;
          });

          setFieldDefinitions(enhancedDefinitions);

          // Filter out hidden merged fields, radio group hidden fields, and radio child fields
          // Radio child fields (radio_child_*) will be shown conditionally based on selection
          const visibleDefinitions: Record<string, FieldDefinition> = {};
          Object.entries(enhancedDefinitions).forEach(([key, def]) => {
            if (def.group?.startsWith("merged_hidden_") ||
                def.group?.startsWith("radio_hidden_") ||
                def.group?.startsWith("radio_child_")) {
              return;
            }
            visibleDefinitions[key] = def;
          });

          setFormData((prev) => {
            const updated = { ...prev };
            // Initialize all field definitions including child fields (they may be shown conditionally)
            Object.keys(enhancedDefinitions).forEach((key) => {
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

        // Try to load HTML preview
        try {
          const html = await apiClient.getHTMLPreview(templateId);
          setHtmlContent(html);
          const initialPreview = html.replace(/\{\{([^}]+)\}\}/g, "");
          setPreviewHtml(initialPreview);
          setHasPreview(true);
        } catch (err) {
          console.error("Failed to load HTML preview:", err);
          // Preview not available, continue without it
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
        } else if (definition?.isRadioGroup && definition.radioOptions) {
          // Radio group: expand selected value to all placeholders for preview
          const expandedValues = expandRadioGroupValue(
            rawValue,
            definition.radioOptions,
          );

          definition.radioOptions.forEach((option) => {
            const fieldValue = expandedValues[option.placeholder] || "";
            const placeholder = `{{${option.placeholder}}}`;
            const escapedPlaceholder = placeholder.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&",
            );
            const regex = new RegExp(escapedPlaceholder, "gi");
            const fieldColor = fieldColorMap[option.placeholder] || sectionColor;

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
          updates[key] = address.provinceEn;
        }
      } else if (
        lowerPlaceholder.includes("district") ||
        lowerPlaceholder.includes("amphoe") ||
        lowerPlaceholder.includes("อำเภอ") ||
        lowerPlaceholder.includes("เขต")
      ) {
        if (!formData[key]) {
          updates[key] = address.districtEn;
        }
      } else if (
        lowerPlaceholder.includes("subdistrict") ||
        lowerPlaceholder.includes("tambon") ||
        lowerPlaceholder.includes("ตำบล") ||
        lowerPlaceholder.includes("แขวง")
      ) {
        if (!formData[key]) {
          updates[key] = address.subDistrictEn;
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

  // Handle navigation to review step
  const handleGoToReview = () => {
    setCurrentStep("review");
  };

  // Handle going back to fill step
  const handleGoToFill = () => {
    setCurrentStep("fill");
  };

  // Handle confirmation and document processing
  const handleConfirmAndProcess = async () => {
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
        } else if (definition?.isRadioGroup && definition.radioOptions) {
          // Radio group: expand selected value to all placeholders
          // The formData[key] contains the selected placeholder (e.g., "$1")
          const expandedValues = expandRadioGroupValue(
            formData[key],
            definition.radioOptions,
          );

          Object.entries(expandedValues).forEach(([fieldKey, fieldValue]) => {
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

      // Refresh quota after successful generation
      await refreshQuota();

      // Move to download step
      setCurrentStep("download");
    } catch (err) {
      console.error("Failed to process document:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process document",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === "fill") {
      handleGoToReview();
    } else if (currentStep === "review") {
      handleConfirmAndProcess();
    }
  };

  const handleDownload = async (format: "docx" | "pdf") => {
    if (!success) return;

    try {
      const blob = await apiClient.downloadDocument(success.documentId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template?.name || "document"}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download:", err);
      setError(err instanceof Error ? err.message : "Failed to download");
    }
  };

  const placeholders = template?.placeholders || [];
  const aliases = template?.aliases || {};
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

  // Render step-based progress indicator
  const renderProgressIndicator = () => (
    <div className="border-b border-[#d9d9d9] flex flex-col gap-[10px] items-start justify-center p-4 w-full">
      <div className="flex flex-col gap-[2px] items-start w-full">
        <p className="font-['IBM_Plex_Sans_Thai',sans-serif] text-[#171717] text-sm">
          {currentStepConfig?.label}
        </p>
        <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-xl text-black">
          {currentStepConfig?.title}
        </p>
      </div>
      <div className="flex gap-1 items-center w-full">
        {FORM_STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`flex-1 h-1 transition-colors duration-300 ${
              idx <= currentStepIndex ? "bg-[#0b4db7]" : "bg-[#fafafa]"
            }`}
          />
        ))}
      </div>
    </div>
  );

  // Get child fields for a selected radio option
  const getChildFieldsForRadioOption = (definition: FieldDefinition, selectedOption: string) => {
    if (!definition.isRadioGroup || !definition.radioOptions) return [];

    const option = definition.radioOptions.find(opt => opt.placeholder === selectedOption);
    if (!option?.childFields) return [];

    // Return the child field definitions
    return option.childFields
      .map(childKey => fieldDefinitions[childKey])
      .filter(Boolean);
  };

  // Render form field with Figma styling
  const renderFormField = (
    definition: FieldDefinition,
    disabled: boolean = false,
  ) => {
    const key = definition.placeholder.replace(/\{\{|\}\}/g, "");
    const value = formData[key] || "";
    // Check both with and without braces since aliases can be stored either way
    const displayLabel = aliases[key] || aliases[definition.placeholder] || definition.label || key;
    const description = definition.description;

    // Get child fields if this is a radio group with a selected option
    const childFields = definition.isRadioGroup ? getChildFieldsForRadioOption(definition, value) : [];

    return (
      <div key={key} className="flex flex-col gap-2 items-start w-full">
        <div className="flex flex-col gap-[2px] items-start w-full">
          <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-[#171717] text-base">
            {displayLabel}
          </p>
          {description && (
            <p className="font-['IBM_Plex_Sans_Thai',sans-serif] text-[#797979] text-sm">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-start w-full">
          <SmartInput
            definition={definition}
            value={value}
            onChange={(val) => !disabled && handleInputChange(key, val)}
            onFocus={() => setActiveField(key)}
            onBlur={() => setActiveField(null)}
            onAddressSelect={(address) => handleAddressSelect(key, address)}
            onDateFormatChange={(format) => handleDateFormatChange(key, format)}
            alias={aliases[definition.placeholder]}
            disabled={disabled || processing}
            showPlaceholderKey={false}
            compact={false}
            hideLabel={true}
          />
        </div>

        {/* Render child fields when radio option is selected */}
        {childFields.length > 0 && (
          <div className="ml-6 pl-4 border-l-2 border-blue-200 w-full space-y-3 mt-2">
            {childFields.map((childDef) => {
              const childKey = childDef.placeholder.replace(/\{\{|\}\}/g, "");
              const childValue = formData[childKey] || "";
              const childLabel = aliases[childKey] || aliases[childDef.placeholder] || childDef.label || childKey;

              return (
                <div key={childKey} className="flex flex-col gap-2 items-start w-full">
                  <div className="flex flex-col gap-[2px] items-start w-full">
                    <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-medium text-[#171717] text-sm">
                      {childLabel}
                    </p>
                    {childDef.description && (
                      <p className="font-['IBM_Plex_Sans_Thai',sans-serif] text-[#797979] text-xs">
                        {childDef.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start w-full">
                    <SmartInput
                      definition={childDef}
                      value={childValue}
                      onChange={(val) => !disabled && handleInputChange(childKey, val)}
                      onFocus={() => setActiveField(childKey)}
                      onBlur={() => setActiveField(null)}
                      onAddressSelect={(address) => handleAddressSelect(childKey, address)}
                      onDateFormatChange={(format) => handleDateFormatChange(childKey, format)}
                      alias={aliases[childDef.placeholder]}
                      disabled={disabled || processing}
                      showPlaceholderKey={false}
                      compact={true}
                      hideLabel={true}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render review field (disabled with filled value)
  const renderReviewField = (definition: FieldDefinition) => {
    const key = definition.placeholder.replace(/\{\{|\}\}/g, "");
    const value = formData[key] || "";
    // Check both with and without braces since aliases can be stored either way
    const displayLabel = aliases[key] || aliases[definition.placeholder] || definition.label || key;
    const description = definition.description;

    // Get display value for radio groups
    let displayValue = value;
    if (definition.isRadioGroup && definition.radioOptions) {
      const selectedOption = definition.radioOptions.find(opt => opt.placeholder === value);
      displayValue = selectedOption?.label || value || "-";
    }

    // Get child fields if this is a radio group with a selected option
    const childFields = definition.isRadioGroup ? getChildFieldsForRadioOption(definition, value) : [];

    return (
      <div key={key} className="flex flex-col gap-2 items-start w-full">
        <div className="flex flex-col gap-[2px] items-start w-full">
          <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-[#171717] text-base">
            {displayLabel}
          </p>
          {description && (
            <p className="font-['IBM_Plex_Sans_Thai',sans-serif] text-[#797979] text-sm">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-start w-full opacity-50">
          <div
            className="
              font-['IBM_Plex_Sans_Thai',sans-serif]
              bg-[#f0f0f0]
              border-b-2 border-[#5b5b5b] border-l-0 border-r-0 border-t-0
              px-4 py-[13px]
              text-base
              text-[#5b5b5b]
              w-full
              min-h-[48px]
            "
          >
            {displayValue || "-"}
          </div>
        </div>

        {/* Render child fields in review mode */}
        {childFields.length > 0 && (
          <div className="ml-6 pl-4 border-l-2 border-blue-200 w-full space-y-3 mt-2">
            {childFields.map((childDef) => {
              const childKey = childDef.placeholder.replace(/\{\{|\}\}/g, "");
              const childValue = formData[childKey] || "";
              const childLabel = aliases[childKey] || aliases[childDef.placeholder] || childDef.label || childKey;

              return (
                <div key={childKey} className="flex flex-col gap-2 items-start w-full">
                  <div className="flex flex-col gap-[2px] items-start w-full">
                    <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-medium text-[#171717] text-sm">
                      {childLabel}
                    </p>
                  </div>
                  <div className="flex items-start w-full opacity-50">
                    <div
                      className="
                        font-['IBM_Plex_Sans_Thai',sans-serif]
                        bg-[#f0f0f0]
                        border-b-2 border-[#5b5b5b] border-l-0 border-r-0 border-t-0
                        px-4 py-[10px]
                        text-sm
                        text-[#5b5b5b]
                        w-full
                        min-h-[40px]
                      "
                    >
                      {childValue || "-"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render fill step content
  const renderFillStep = () => (
    <div className="flex flex-col items-start w-full">
      <div className="flex flex-col items-start justify-center px-4 py-2 w-full">
        {/* OCR Scanner Button */}
        {currentStep === "fill" && (
          <div className="mb-4 w-full">
            <button
              onClick={() => setShowOCRScanner(!showOCRScanner)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
                showOCRScanner
                  ? "bg-[#000091] text-white"
                  : "bg-[#f0f0f0] text-[#5b5b5b] hover:bg-[#e0e0e0]"
              }`}
            >
              <Scan className="w-4 h-4" />
              สแกนเอกสาร
            </button>
          </div>
        )}

        {/* OCR Scanner */}
        {showOCRScanner && (
          <div className="mb-6 w-full">
            <OCRScanner
              templateId={templateId}
              onDataExtracted={handleOCRDataExtracted}
              onClose={() => setShowOCRScanner(false)}
            />
          </div>
        )}

        <div className="flex flex-col gap-4 items-start w-full">
          {groupedSections.length > 0 ? (
            groupedSections.map((section) => (
              <div key={section.name} className="w-full">
                {/* Section Label */}
                <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-[#171717] text-sm mb-3 mt-4 first:mt-0">
                  {section.name}
                </p>
                <div className="flex flex-col gap-4">
                  {section.fields.map((definition) =>
                    renderFormField(definition, false),
                  )}
                </div>
              </div>
            ))
          ) : (
            // Fallback for templates without grouped sections
            Object.entries(fieldDefinitions).map(([placeholder, definition]) =>
              renderFormField(definition, false),
            )
          )}
        </div>
      </div>
    </div>
  );

  // Render review step content
  const renderReviewStep = () => (
    <div className="flex flex-col items-start w-full">
      <div className="flex flex-col items-start justify-center px-4 py-2 w-full">
        <div className="flex flex-col gap-4 items-start w-full">
          {groupedSections.length > 0 ? (
            groupedSections.map((section) => (
              <div key={section.name} className="w-full">
                <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-[#171717] text-sm mb-3 mt-4 first:mt-0">
                  {section.name}
                </p>
                <div className="flex flex-col gap-4">
                  {section.fields.map((definition) =>
                    renderReviewField(definition),
                  )}
                </div>
              </div>
            ))
          ) : (
            Object.entries(fieldDefinitions).map(([placeholder, definition]) =>
              renderReviewField(definition),
            )
          )}
        </div>
      </div>
    </div>
  );

  // Render download step content
  const renderDownloadStep = () => (
    <div className="flex flex-col items-start w-full">
      <div className="flex flex-col items-start justify-center px-4 py-2 w-full">
        <div className="flex flex-col gap-4 items-start w-full">
          {/* File Type Selection */}
          <div className="flex flex-col gap-2 items-start w-full">
            <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-[#171717] text-base">
              เลือกประเภทไฟล์
            </p>
            <div className="relative">
              <select
                value={selectedFileType}
                onChange={(e) =>
                  setSelectedFileType(e.target.value as "docx" | "pdf")
                }
                className="
                  font-['IBM_Plex_Sans_Thai',sans-serif]
                  bg-[#f0f0f0]
                  border-b-2 border-[#5b5b5b] border-l-0 border-r-0 border-t-0
                  px-4 py-[13px] pr-10
                  text-base
                  text-[#5b5b5b]
                  outline-none
                  appearance-none
                  min-w-[140px]
                  cursor-pointer
                "
              >
                <option value="pdf">ไฟล์ PDF</option>
                <option value="docx">ไฟล์ DOCX</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5b5b5b] pointer-events-none" />
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="w-full p-4 bg-green-50 border-l-4 border-green-500 mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="font-['IBM_Plex_Sans_Thai',sans-serif] text-green-700">
                  เอกสารพร้อมให้ดาวน์โหลดแล้ว
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render action buttons based on current step
  const renderActionButtons = () => {
    if (currentStep === "fill") {
      return (
        <button
          onClick={handleGoToReview}
          className="
            font-['IBM_Plex_Sans_Thai',sans-serif]
            bg-[#000091]
            text-white
            px-[13px] py-[10px]
            text-base
            hover:bg-[#000070]
            transition-colors
          "
        >
          ตรวจสอบฟอร์ม
        </button>
      );
    }

    if (currentStep === "review") {
      return (
        <div className="flex flex-col gap-2 items-start">
          {/* Quota warning for non-admins */}
          {!canGenerate && !isAdmin && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>คุณไม่มีโควต้าเหลือ กรุณาติดต่อผู้ดูแลระบบ</span>
            </div>
          )}
          <div className="flex gap-2 items-start">
            <button
              onClick={handleGoToFill}
              className="
                font-['IBM_Plex_Sans_Thai',sans-serif]
                bg-[#f0f0f0]
                text-[#5b5b5b]
                px-[13px] py-[10px]
                text-base
                hover:bg-[#e0e0e0]
                transition-colors
              "
            >
              แก้ไขข้อมูล
            </button>
            <button
              onClick={handleConfirmAndProcess}
              disabled={processing || !canGenerate}
              className="
                font-['IBM_Plex_Sans_Thai',sans-serif]
                bg-[#000091]
                text-white
                px-[13px] py-[10px]
                text-base
                hover:bg-[#000070]
                transition-colors
                disabled:opacity-50
                disabled:cursor-not-allowed
                inline-flex items-center gap-2
              "
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                "ยืนยันข้อมูล"
              )}
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === "download") {
      return (
        <button
          onClick={() => handleDownload(selectedFileType)}
          disabled={!success}
          className="
            font-['IBM_Plex_Sans_Thai',sans-serif]
            bg-[#000091]
            text-white
            px-[13px] py-[10px]
            text-base
            hover:bg-[#000070]
            transition-colors
            disabled:opacity-50
            disabled:cursor-not-allowed
            inline-flex items-center gap-2
          "
        >
          <Download className="w-4 h-4" />
          ดาวน์โหลด
        </button>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white font-['IBM_Plex_Sans_Thai',sans-serif]">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <Link
            href={`/forms/${templateId}`}
            className="text-sm text-gray-600 hover:text-[#0b4db7]"
          >
            ← กลับไปหน้ารายละเอียด
          </Link>

          {/* Quota Display */}
          {!isAdmin && user?.quota && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">โควต้าคงเหลือ:</span>
              <span className={`font-medium ${user.quota.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {user.quota.remaining} / {user.quota.total}
              </span>
              {user.quota.remaining === 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-4 h-4" />
                  หมดโควต้า
                </span>
              )}
              {user.quota.remaining > 0 && user.quota.remaining <= 3 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  ใกล้หมด
                </span>
              )}
            </div>
          )}
          {isAdmin && (
            <span className="text-sm text-purple-600 font-medium flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              ผู้ดูแลระบบ (ไม่จำกัดโควต้า)
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={hasPreview ? "flex gap-6" : ""}>
          {/* Form Card */}
          <div
            className={`bg-[#f6f6f6] flex flex-col gap-8 items-start p-8 rounded-lg ${
              hasPreview ? "w-1/3 flex-shrink-0" : "w-full max-w-xl mx-auto"
            }`}
          >
            {/* Progress Indicator */}
            {renderProgressIndicator()}

            {/* Step Content */}
            {currentStep === "fill" && renderFillStep()}
            {currentStep === "review" && renderReviewStep()}
            {currentStep === "download" && renderDownloadStep()}

            {/* Error State */}
            {error && (
              <div className="w-full px-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="font-['IBM_Plex_Sans_Thai',sans-serif] text-red-700 text-sm">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-4">{renderActionButtons()}</div>

            {/* Create New Document Link (on download step) */}
            {currentStep === "download" && success && (
              <div className="px-4">
                <button
                  onClick={() => {
                    setSuccess(null);
                    setCurrentStep("fill");
                    const initialData: Record<string, string> = {};
                    placeholders.forEach((p) => {
                      const key = p.replace(/\{\{|\}\}/g, "");
                      initialData[key] = "";
                    });
                    setFormData(initialData);
                  }}
                  className="text-sm text-[#0b4db7] hover:underline"
                >
                  สร้างเอกสารใหม่ →
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Live Preview */}
          {hasPreview && (
            <div className="w-2/3 hidden lg:block">
              <div className="sticky top-4">
                <div className="p-4 bg-[#0b4db7]/5 mb-4 border-l-4 border-[#0b4db7]">
                  <div className="flex gap-2 items-center">
                    <Info className="w-5 h-5 text-[#0b4db7] shrink-0" />
                    <span className="flex gap-1 lg:flex-row flex-col text-sm">
                      <p className="font-semibold">หมายเหตุ</p>
                      <p>
                        เอกสารในตัวอย่างอาจมีตำแหน่งบางที่ไม่ตรง แต่ฉบับจริงจะตรงตามที่กำหนดไว้
                      </p>
                    </span>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      ตัวอย่างเอกสาร
                    </h3>
                  </div>
                  <div className="h-[calc(100vh-14rem)] overflow-auto">
                    <DocumentPreview
                      htmlContent={previewHtml}
                      showHeader={false}
                      orientation={template?.page_orientation || 'auto'}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
