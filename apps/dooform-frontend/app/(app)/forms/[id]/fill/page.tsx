"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle, Eye, Info } from "lucide-react";
import { useAuth } from "@dooform/shared/auth/hooks";
import { apiClient } from "@dooform/shared/api/client";
import { DocumentPreview } from "@/components/ui/DocumentPreview";
import { getHeaderBgColor } from "@dooform/shared/constants/colors";
import { DateFormat } from "@dooform/shared/utils/fieldTypes";
import { AddressSelection } from "@dooform/shared/api/addressService";
import { logger } from "@dooform/shared/utils/logger";

// Hooks
import {
  useFormData,
  useTemplateLoader,
  usePreviewRenderer,
  useStepNavigation,
} from "./hooks";

// Components
import {
  StepIndicator,
  QuotaDisplay,
  FormFields,
  ReviewFields,
  ActionButtons,
  DownloadSection,
} from "./components";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FillFormPage({ params }: PageProps) {
  const { id: templateId } = use(params);
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: authLoading,
    isAdmin,
    canGenerate,
    user,
    refreshQuota,
  } = useAuth();

  // Template and field definitions
  const {
    template,
    fieldDefinitions,
    groupedSections,
    htmlContent,
    hasPreview: templateHasPreview,
    loading,
    error: loadError,
    placeholders,
    aliases,
  } = useTemplateLoader(templateId);

  // Form data management
  const {
    formData,
    setFormData,
    handleInputChange,
    handleOCRDataExtracted,
    handleAddressSelect: baseHandleAddressSelect,
    initializeFormData,
    resetFormData,
  } = useFormData();

  // Step navigation
  const {
    currentStep,
    currentStepIndex,
    currentStepConfig,
    goToFill,
    goToReview,
    goToDownload,
    steps,
  } = useStepNavigation();

  // Local state
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    documentId: string;
    downloadUrl: string;
    downloadPdfUrl?: string;
  } | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<"docx" | "pdf">("pdf");
  const [activeField, setActiveField] = useState<string | null>(null);
  const [showOCRScanner, setShowOCRScanner] = useState(false);
  const [quotaRefreshed, setQuotaRefreshed] = useState(false);
  const [localFieldDefinitions, setLocalFieldDefinitions] = useState(fieldDefinitions);

  // Preview rendering with debouncing
  const { previewHtml, hasPreview } = usePreviewRenderer(
    htmlContent,
    formData,
    localFieldDefinitions,
    groupedSections,
    activeField
  );

  // Sync field definitions from loader
  useEffect(() => {
    setLocalFieldDefinitions(fieldDefinitions);
  }, [fieldDefinitions]);

  // Initialize form data when template loads
  useEffect(() => {
    if (placeholders.length > 0 && Object.keys(formData).length === 0) {
      initializeFormData(placeholders);
    }
  }, [placeholders, formData, initializeFormData]);

  // Initialize form data with field definitions (including child fields)
  useEffect(() => {
    if (Object.keys(fieldDefinitions).length > 0) {
      setFormData((prev) => {
        const updated = { ...prev };
        Object.keys(fieldDefinitions).forEach((key) => {
          const cleanKey = key.replace(/\{\{|\}\}/g, "");
          if (!(cleanKey in updated)) {
            updated[cleanKey] = "";
          }
        });
        return updated;
      });
    }
  }, [fieldDefinitions, setFormData]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=/forms/${templateId}/fill`);
    }
  }, [authLoading, isAuthenticated, router, templateId]);

  // Quota check and redirect
  useEffect(() => {
    if (success || currentStep === "download") return;

    const checkQuotaAndRedirect = async () => {
      if (!authLoading && isAuthenticated && !isAdmin) {
        await refreshQuota();
        setTimeout(() => setQuotaRefreshed(true), 100);
      } else if (!authLoading && isAuthenticated && isAdmin) {
        setQuotaRefreshed(true);
      }
    };
    checkQuotaAndRedirect();
  }, [authLoading, isAuthenticated, isAdmin, refreshQuota, success, currentStep]);

  useEffect(() => {
    if (success || currentStep === "download") return;
    if (quotaRefreshed && !isAdmin && !canGenerate) {
      router.replace(`/forms/${templateId}?error=no_quota`);
    }
  }, [quotaRefreshed, canGenerate, isAdmin, router, templateId, success, currentStep]);

  // Handlers
  const handleAddressSelect = useCallback(
    (fieldKey: string, address: AddressSelection) => {
      baseHandleAddressSelect(fieldKey, address, fieldDefinitions);
    },
    [baseHandleAddressSelect, fieldDefinitions]
  );

  const handleDateFormatChange = useCallback(
    (fieldKey: string, format: DateFormat) => {
      setLocalFieldDefinitions((prev) => ({
        ...prev,
        [fieldKey]: {
          ...prev[fieldKey],
          dateFormat: format,
        },
      }));
    },
    []
  );

  const handleToggleOCRScanner = useCallback(() => {
    setShowOCRScanner((prev) => !prev);
  }, []);

  const handleOCRClose = useCallback(() => {
    setShowOCRScanner(false);
  }, []);

  const handleConfirmAndProcess = useCallback(async () => {
    setError(null);
    setSuccess(null);

    try {
      setProcessing(true);
      const { splitMergedValue, expandRadioGroupValue, formatDateToDisplay } = await import("@dooform/shared/utils/fieldTypes");

      const apiFormData: Record<string, string> = {};

      Object.keys(formData).forEach((key) => {
        const definition = localFieldDefinitions[key];
        let value = formData[key];

        if (definition?.inputType === "date" && value && !definition.isMerged) {
          value = formatDateToDisplay(value, definition.dateFormat || "dd/mm/yyyy");
        }

        if (definition?.isMerged && definition.mergedFields) {
          const splitValues = splitMergedValue(
            formData[key],
            definition.mergedFields,
            definition.separator || ""
          );
          Object.entries(splitValues).forEach(([fieldKey, fieldValue]) => {
            apiFormData[`{{${fieldKey}}}`] = fieldValue;
          });
        } else if (definition?.isRadioGroup && definition.radioOptions) {
          const expandedValues = expandRadioGroupValue(formData[key], definition.radioOptions);
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

      await refreshQuota();
      goToDownload();
    } catch (err) {
      logger.error("FillFormPage", "Failed to process document:", err);
      setError(err instanceof Error ? err.message : "Failed to process document");
    } finally {
      setProcessing(false);
    }
  }, [formData, localFieldDefinitions, templateId, refreshQuota, goToDownload]);

  const handleDownload = useCallback(
    async (format: "docx" | "pdf") => {
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
        logger.error("FillFormPage", "Failed to download:", err);
        setError(err instanceof Error ? err.message : "Failed to download");
      }
    },
    [success, template?.name]
  );

  const handleCreateNew = useCallback(() => {
    setSuccess(null);
    goToFill();
    resetFormData(placeholders);
  }, [goToFill, resetFormData, placeholders]);

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

  if (loadError && !template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-light text-gray-900 mb-4">
            {loadError || "ไม่พบเทมเพลต"}
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
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
          <Link
            href={`/forms/${templateId}`}
            className="text-sm text-gray-600 hover:text-[#0b4db7]"
          >
            ← กลับไปหน้ารายละเอียด
          </Link>

          <QuotaDisplay isAdmin={isAdmin} user={user} />
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
            <StepIndicator
              currentStep={currentStep}
              currentStepIndex={currentStepIndex}
              currentStepConfig={currentStepConfig}
            />

            {/* Step Content */}
            {currentStep === "fill" && (
              <FormFields
                templateId={templateId}
                groupedSections={groupedSections}
                fieldDefinitions={localFieldDefinitions}
                formData={formData}
                aliases={aliases}
                processing={processing}
                showOCRScanner={showOCRScanner}
                onToggleOCRScanner={handleToggleOCRScanner}
                onOCRDataExtracted={handleOCRDataExtracted}
                onInputChange={handleInputChange}
                onFieldFocus={setActiveField}
                onFieldBlur={() => setActiveField(null)}
                onAddressSelect={handleAddressSelect}
                onDateFormatChange={handleDateFormatChange}
              />
            )}

            {currentStep === "review" && (
              <ReviewFields
                groupedSections={groupedSections}
                fieldDefinitions={localFieldDefinitions}
                formData={formData}
                aliases={aliases}
              />
            )}

            {currentStep === "download" && (
              <DownloadSection
                selectedFileType={selectedFileType}
                onFileTypeChange={setSelectedFileType}
                success={success}
              />
            )}

            {/* Error State */}
            {error && (
              <div className="w-full px-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4" role="alert">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
                    <p className="text-red-700 text-sm">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-4">
              <ActionButtons
                currentStep={currentStep}
                processing={processing}
                canGenerate={canGenerate}
                isAdmin={isAdmin}
                success={success}
                selectedFileType={selectedFileType}
                onGoToReview={goToReview}
                onGoToFill={goToFill}
                onConfirmAndProcess={handleConfirmAndProcess}
                onDownload={handleDownload}
              />
            </div>

            {/* Create New Document Link (on download step) */}
            {currentStep === "download" && success && (
              <div className="px-4">
                <button
                  onClick={handleCreateNew}
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
                    <Info className="w-5 h-5 text-[#0b4db7] shrink-0" aria-hidden="true" />
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
                      <Eye className="w-4 h-4 text-gray-400" aria-hidden="true" />
                      ตัวอย่างเอกสาร
                    </h3>
                  </div>
                  <div className="h-[calc(100vh-14rem)] overflow-auto">
                    <DocumentPreview
                      htmlContent={previewHtml}
                      showHeader={false}
                      orientation={template?.page_orientation || "auto"}
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
