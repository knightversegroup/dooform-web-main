"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    FileText,
    Loader2,
    Download,
    CheckCircle,
    AlertCircle,
    Scan,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Template, FieldDefinition, Entity } from "@/lib/api/types";
import { Button } from "@/app/components/ui/Button";
import { SmartInput } from "@/app/components/ui/SmartInput";
import { OCRScanner } from "@/app/components/ui/OCRScanner";
import { DocumentPreview } from "@/app/components/ui/DocumentPreview";
import { useAuth } from "@/lib/auth/context";
import {
    groupFieldsByEntity,
    ENTITY_LABELS,
    splitMergedValue,
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
        downloadPdfUrl?: string;  // Only present if PDF was generated successfully
    } | null>(null);

    // Form data state
    const [formData, setFormData] = useState<Record<string, string>>({});

    // Field definitions
    const [fieldDefinitions, setFieldDefinitions] = useState<Record<string, FieldDefinition>>({});
    const [groupedFields, setGroupedFields] = useState<Record<Entity, FieldDefinition[]> | null>(null);

    // HTML Preview state
    const [htmlContent, setHtmlContent] = useState("");
    const [previewHtml, setPreviewHtml] = useState("");
    const [hasPreview, setHasPreview] = useState(false);

    // Active field for highlighting
    const [activeField, setActiveField] = useState<string | null>(null);

    // OCR Scanner state
    const [showOCRScanner, setShowOCRScanner] = useState(false);

    // Redirect to login if not authenticated (use replace to avoid back button loop)
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
                    (t) => t.id === templateId
                );

                if (!foundTemplate) {
                    setError("ไม่พบเทมเพลตที่ต้องการ");
                    return;
                }

                setTemplate(foundTemplate);

                // Initialize form data with empty strings
                const placeholders = parsePlaceholders(
                    foundTemplate.placeholders
                );
                const initialData: Record<string, string> = {};
                placeholders.forEach((p) => {
                    const key = p.replace(/\{\{|\}\}/g, '');
                    initialData[key] = "";
                });
                setFormData(initialData);

                // Fetch field definitions from backend
                try {
                    const definitions = await apiClient.getFieldDefinitions(templateId);
                    setFieldDefinitions(definitions);

                    // Filter out hidden merged fields (fields that are part of a merge but not the main one)
                    const visibleDefinitions: Record<string, FieldDefinition> = {};
                    Object.entries(definitions).forEach(([key, def]) => {
                        // Skip fields that are hidden because they're part of a merged group
                        if (def.group?.startsWith('merged_hidden_')) {
                            return;
                        }
                        visibleDefinitions[key] = def;
                    });

                    // Group fields by entity, preserving original placeholder order
                    const grouped = groupFieldsByEntity(visibleDefinitions, placeholders);
                    setGroupedFields(grouped);
                } catch (err) {
                    console.error("Failed to load field definitions:", err);
                    // If backend doesn't have field definitions, the form will still work
                    // but without smart input types
                    setFieldDefinitions({});
                    setGroupedFields(null);
                }

                // Load HTML preview if available
                if (foundTemplate.gcs_path_html) {
                    try {
                        const html = await apiClient.getHTMLPreview(templateId);
                        setHtmlContent(html);
                        setPreviewHtml(html);
                        setHasPreview(true);
                    } catch (err) {
                        console.error("Failed to load HTML preview:", err);
                        setHasPreview(false);
                    }
                }
            } catch (err) {
                console.error("Failed to load template:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to load template"
                );
            } finally {
                setLoading(false);
            }
        };

        if (templateId) {
            loadTemplate();
        }
    }, [templateId]);

    // Update preview when form values change or active field changes
    useEffect(() => {
        if (htmlContent && hasPreview) {
            let updatedHtml = htmlContent;

            // First, handle merged fields - split their values into individual placeholders
            Object.keys(formData).forEach((key) => {
                const definition = fieldDefinitions[key];
                const value = formData[key] || "";
                const isActive = activeField === key;

                if (definition?.isMerged && definition.mergedFields) {
                    // Split merged value into individual field values
                    const splitValues = splitMergedValue(
                        value,
                        definition.mergedFields,
                        definition.separator || ''
                    );

                    // Replace each individual placeholder
                    definition.mergedFields.forEach((fieldKey) => {
                        const fieldValue = splitValues[fieldKey] || "";
                        const placeholder = `{{${fieldKey}}}`;
                        // Escape special regex characters including $ and {}
                        const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                        const regex = new RegExp(escapedPlaceholder, "g");

                        if (fieldValue) {
                            if (isActive) {
                                updatedHtml = updatedHtml.replace(regex, `<mark class="bg-yellow-300 px-0.5 rounded transition-colors">${fieldValue}</mark>`);
                            } else {
                                updatedHtml = updatedHtml.replace(regex, fieldValue);
                            }
                        } else {
                            if (isActive) {
                                updatedHtml = updatedHtml.replace(regex, `<mark class="bg-yellow-300 text-yellow-800 px-0.5 rounded animate-pulse">${placeholder}</mark>`);
                            } else {
                                updatedHtml = updatedHtml.replace(regex, `<span class="text-gray-400">${placeholder}</span>`);
                            }
                        }
                    });
                } else {
                    // Regular field - replace single placeholder
                    const placeholder = `{{${key}}}`;
                    // Escape special regex characters including $ and {}
                    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    const regex = new RegExp(escapedPlaceholder, "g");

                    if (value) {
                        if (isActive) {
                            updatedHtml = updatedHtml.replace(regex, `<mark class="bg-yellow-300 px-0.5 rounded transition-colors">${value}</mark>`);
                        } else {
                            updatedHtml = updatedHtml.replace(regex, value);
                        }
                    } else {
                        if (isActive) {
                            updatedHtml = updatedHtml.replace(regex, `<mark class="bg-yellow-300 text-yellow-800 px-0.5 rounded animate-pulse">${placeholder}</mark>`);
                        } else {
                            updatedHtml = updatedHtml.replace(regex, `<span class="text-gray-400">${placeholder}</span>`);
                        }
                    }
                }
            });
            setPreviewHtml(updatedHtml);
        }
    }, [formData, htmlContent, hasPreview, activeField, fieldDefinitions]);

    const handleInputChange = (key: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // Handle OCR data extraction - apply mapped fields to form
    const handleOCRDataExtracted = (mappedFields: Record<string, string>) => {
        setFormData((prev) => ({
            ...prev,
            ...mappedFields,
        }));
        setShowOCRScanner(false);
    };

    // Handle address selection - auto-fill related province/district/subdistrict fields
    const handleAddressSelect = (fieldKey: string, address: AddressSelection) => {
        const updates: Record<string, string> = {};

        // Find related fields by dataType and try to auto-fill them
        Object.entries(fieldDefinitions).forEach(([placeholder, def]) => {
            const key = placeholder.replace(/\{\{|\}\}/g, '');
            const lowerPlaceholder = placeholder.toLowerCase();

            // Skip the current field and fields that already have values
            if (key === fieldKey) return;

            // Match province fields
            if (def.dataType === 'province' ||
                lowerPlaceholder.includes('province') ||
                lowerPlaceholder.includes('จังหวัด')) {
                if (!formData[key]) {
                    updates[key] = address.province;
                }
            }
            // Match district fields (อำเภอ)
            else if (lowerPlaceholder.includes('district') ||
                     lowerPlaceholder.includes('amphoe') ||
                     lowerPlaceholder.includes('อำเภอ') ||
                     lowerPlaceholder.includes('เขต')) {
                if (!formData[key]) {
                    updates[key] = address.district;
                }
            }
            // Match sub-district fields (ตำบล)
            else if (lowerPlaceholder.includes('subdistrict') ||
                     lowerPlaceholder.includes('tambon') ||
                     lowerPlaceholder.includes('ตำบล') ||
                     lowerPlaceholder.includes('แขวง')) {
                if (!formData[key]) {
                    updates[key] = address.subDistrict;
                }
            }
        });

        // Apply all updates at once
        if (Object.keys(updates).length > 0) {
            setFormData((prev) => ({
                ...prev,
                ...updates,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            setProcessing(true);

            // Convert keys back to placeholder format for API
            // Also handle merged fields - split them back into individual values
            const apiFormData: Record<string, string> = {};

            Object.keys(formData).forEach((key) => {
                const definition = fieldDefinitions[key];

                // Check if this is a merged field
                if (definition?.isMerged && definition.mergedFields) {
                    // Split the merged value into individual field values
                    const splitValues = splitMergedValue(
                        formData[key],
                        definition.mergedFields,
                        definition.separator || ''
                    );

                    // Add each split value with its placeholder format
                    Object.entries(splitValues).forEach(([fieldKey, fieldValue]) => {
                        apiFormData[`{{${fieldKey}}}`] = fieldValue;
                    });
                } else {
                    // Regular field - just add with placeholder format
                    apiFormData[`{{${key}}}`] = formData[key];
                }
            });

            const response = await apiClient.processDocument(
                templateId,
                apiFormData
            );

            setSuccess({
                documentId: response.document_id,
                downloadUrl: response.download_url,
                downloadPdfUrl: response.download_pdf_url,
            });
        } catch (err) {
            console.error("Failed to process document:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to process document"
            );
        } finally {
            setProcessing(false);
        }
    };

    const handleDownload = async (format: "docx" | "pdf") => {
        if (!success) return;

        try {
            const blob = await apiClient.downloadDocument(
                success.documentId,
                format
            );
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
            setError(
                err instanceof Error ? err.message : "Failed to download"
            );
        }
    };

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container-main section-padding">
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    // Don't render anything if not authenticated (will redirect)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container-main section-padding">
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container-main section-padding">
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    if (error && !template) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container-main section-padding">
                    <div className="text-center py-24">
                        <h1 className="text-h2 text-foreground mb-4">
                            {error || "ไม่พบเทมเพลต"}
                        </h1>
                        <Button href="/forms" variant="secondary">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับไปหน้ารายการ
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const placeholders = template
        ? parsePlaceholders(template.placeholders)
        : [];
    const aliases = template ? parseAliases(template.aliases) : {};

    return (
        <div className="min-h-screen bg-background">
            <div className="container-main section-padding">
                {/* Back button */}
                <div className="mb-6">
                    <Button
                        href={`/forms/${templateId}`}
                        variant="secondary"
                        size="sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับ
                    </Button>
                </div>

                <div className={hasPreview ? "flex gap-6" : ""}>
                    {/* Left Column: Form */}
                    <div className={hasPreview ? "w-[380px] flex-shrink-0" : "max-w-2xl mx-auto w-full"}>
                        {/* Header */}
                        <div className="bg-background border border-border-default rounded-lg p-4 mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-h4 text-foreground">
                                        กรอกแบบฟอร์ม
                                    </h1>
                                    <p className="text-caption text-text-muted truncate">
                                        {template?.display_name ||
                                            template?.name ||
                                            template?.filename}
                                    </p>
                                </div>
                            </div>
                            <Button
                                onClick={() => setShowOCRScanner(!showOCRScanner)}
                                variant={showOCRScanner ? "primary" : "secondary"}
                                size="sm"
                                className="w-full justify-center"
                            >
                                <Scan className="w-4 h-4 mr-2" />
                                สแกนเอกสาร
                            </Button>
                        </div>

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
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                    <h2 className="text-h4 text-green-800">
                                        สร้างเอกสารสำเร็จ!
                                    </h2>
                                </div>
                                <p className="text-body-sm text-green-700 mb-4">
                                    เอกสารของคุณพร้อมให้ดาวน์โหลดแล้ว
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        onClick={() => handleDownload("docx")}
                                        variant="primary"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        ดาวน์โหลด DOCX
                                    </Button>
                                    {success.downloadPdfUrl && (
                                        <Button
                                            onClick={() => handleDownload("pdf")}
                                            variant="secondary"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            ดาวน์โหลด PDF
                                        </Button>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-green-200">
                                    <Button
                                        onClick={() => {
                                            setSuccess(null);
                                            // Reset form
                                            const initialData: Record<
                                                string,
                                                string
                                            > = {};
                                            placeholders.forEach((p) => {
                                                const key = p.replace(/\{\{|\}\}/g, '');
                                                initialData[key] = "";
                                            });
                                            setFormData(initialData);
                                        }}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        สร้างเอกสารใหม่
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && template && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    <p className="text-body-sm text-red-700">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        {!success && (
                            <form onSubmit={handleSubmit}>
                                {groupedFields && Object.keys(fieldDefinitions).length > 0 ? (
                                    <div className="space-y-4">
                                        {/* Render fields grouped by entity */}
                                        {(Object.keys(groupedFields) as Entity[]).map((entity) => {
                                            const fields = groupedFields[entity];
                                            if (fields.length === 0) return null;

                                            return (
                                                <div
                                                    key={entity}
                                                    className="bg-background border border-border-default rounded-lg p-4"
                                                >
                                                    <h2 className="text-body font-semibold text-foreground mb-4 flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                                        {ENTITY_LABELS[entity]} ({fields.length})
                                                    </h2>

                                                    <div className="space-y-3">
                                                        {fields.map((definition) => {
                                                            const key = definition.placeholder.replace(/\{\{|\}\}/g, '');
                                                            return (
                                                                <SmartInput
                                                                    key={key}
                                                                    definition={definition}
                                                                    value={formData[key] || ""}
                                                                    onChange={(value) => handleInputChange(key, value)}
                                                                    onFocus={() => setActiveField(key)}
                                                                    onBlur={() => setActiveField(null)}
                                                                    onAddressSelect={(address) => handleAddressSelect(key, address)}
                                                                    alias={aliases[definition.placeholder]}
                                                                    disabled={processing}
                                                                    compact={hasPreview}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Submit Button */}
                                        <div className="bg-background border border-border-default rounded-lg p-4">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                className="w-full justify-center"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        กำลังสร้างเอกสาร...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FileText className="w-4 h-4 mr-2" />
                                                        สร้างเอกสาร
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-background border border-border-default rounded-lg p-6">
                                        <p className="text-body-sm text-text-muted text-center py-8">
                                            ไม่พบช่องกรอกข้อมูลในเทมเพลตนี้
                                        </p>
                                    </div>
                                )}
                            </form>
                        )}

                        {/* Instructions - hide when preview is shown to save space */}
                        {!hasPreview && (
                            <div className="bg-surface-alt border border-border-default rounded-lg p-4 mt-4">
                                <h4 className="text-body-sm font-semibold text-foreground mb-2">วิธีใช้งาน</h4>
                                <ul className="text-caption text-text-muted space-y-1">
                                    <li>1. กรอกข้อมูลในแต่ละช่องตามที่ต้องการ</li>
                                    <li>2. ดูตัวอย่างเอกสารแบบ Real-time ทางด้านขวา (ถ้ามี)</li>
                                    <li>3. กดปุ่ม &quot;สร้างเอกสาร&quot; เพื่อสร้างไฟล์</li>
                                    <li>4. ดาวน์โหลดเอกสารในรูปแบบ DOCX หรือ PDF</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Live Preview */}
                    {hasPreview && (
                        <div className="flex-1 min-w-0 sticky top-24 h-[calc(100vh-8rem)]">
                            <DocumentPreview
                                htmlContent={previewHtml}
                                title="ตัวอย่างเอกสาร (Live)"
                                showHeader={true}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
