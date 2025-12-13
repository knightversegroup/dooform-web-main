"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    FileText,
    Loader2,
    Save,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Layers,
    ChevronDown,
    ChevronUp,
    X,
    Workflow,
    Upload,
    File,
    FileCode,
    FolderOpen,
    Link as LinkIcon,
    Unlink,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Template, TemplateType, Tier, TemplateUpdateData, FieldDefinition, MergeableGroup, DocumentType, FilterCategory } from "@/lib/api/types";
import { detectMergeableGroups, createMergedFieldDefinition } from "@/lib/utils/fieldTypes";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { SectionList } from "@/app/components/ui/SectionList";
import { useAuth } from "@/lib/auth/context";
import { useTemplate } from "../TemplateContext";

// Helper to parse aliases
const parseAliases = (aliasesJson: string): Record<string, string> => {
    try {
        return JSON.parse(aliasesJson || "{}");
    } catch {
        return {};
    }
};

// Helper to parse placeholders
const parsePlaceholders = (placeholdersJson: string): string[] => {
    try {
        return JSON.parse(placeholdersJson || "[]");
    } catch {
        return [];
    }
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditFormPage({ params }: PageProps) {
    const { id: templateId } = use(params);
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { refetchTemplate } = useTemplate();

    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Field definitions state
    const [fieldDefinitions, setFieldDefinitions] = useState<Record<string, FieldDefinition> | null>(null);
    const [regenerating, setRegenerating] = useState(false);
    const [fieldDefSuccess, setFieldDefSuccess] = useState(false);

    // Merge suggestions state
    const [mergeableGroups, setMergeableGroups] = useState<MergeableGroup[]>([]);
    const [showMergeSuggestions, setShowMergeSuggestions] = useState(true);
    const [mergedGroups, setMergedGroups] = useState<Set<string>>(new Set()); // Patterns that user has merged
    const [pendingMerges, setPendingMerges] = useState<Map<string, { label: string; separator: string }>>(new Map());


    // File replacement state
    const [docxFile, setDocxFile] = useState<File | null>(null);
    const [htmlFile, setHtmlFile] = useState<File | null>(null);
    const [uploadingFiles, setUploadingFiles] = useState(false);
    const [fileUploadSuccess, setFileUploadSuccess] = useState(false);
    const [regenerateFieldsOnUpload, setRegenerateFieldsOnUpload] = useState(true);

    // Document type state
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [selectedDocTypeId, setSelectedDocTypeId] = useState<string>('');
    const [variantName, setVariantName] = useState<string>('');
    const [variantOrder, setVariantOrder] = useState<number>(0);
    const [docTypeAssigning, setDocTypeAssigning] = useState(false);
    const [docTypeSuccess, setDocTypeSuccess] = useState(false);

    // Category options state
    const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Form state
    const [formData, setFormData] = useState({
        displayName: "",
        name: "",
        description: "",
        author: "",
        category: "",
        originalSource: "",
        remarks: "",
        isVerified: false,
        isAIAvailable: false,
        type: "official" as TemplateType,
        tier: "free" as Tier,
        group: "",
    });
    const [aliases, setAliases] = useState<Record<string, string>>({});

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace(`/login?redirect=/forms/${templateId}/edit`);
        }
    }, [authLoading, isAuthenticated, router, templateId]);

    // Load template data
    useEffect(() => {
        const loadTemplate = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load document types and category options
                try {
                    const [docTypes, filtersData] = await Promise.all([
                        apiClient.getDocumentTypes({ activeOnly: true }),
                        apiClient.getFilters().catch(() => [] as FilterCategory[]),
                    ]);
                    setDocumentTypes(docTypes);

                    // Extract category options from filters
                    const categoryFilter = filtersData.find((f: FilterCategory) => f.field_name === "category");
                    if (categoryFilter && categoryFilter.options) {
                        const options = categoryFilter.options
                            .filter((opt) => opt.is_active)
                            .map((opt) => ({ value: opt.value, label: opt.label }));
                        setCategoryOptions(options);
                    }
                } catch (err) {
                    console.error("Failed to load document types:", err);
                }

                const response = await apiClient.getAllTemplates();
                const foundTemplate = response.templates?.find(
                    (t) => t.id === templateId
                );

                if (!foundTemplate) {
                    setError("ไม่พบเทมเพลตที่ต้องการ");
                    return;
                }

                setTemplate(foundTemplate);

                // Set document type values if assigned
                if (foundTemplate.document_type_id) {
                    setSelectedDocTypeId(foundTemplate.document_type_id);
                    setVariantName(foundTemplate.variant_name || '');
                    setVariantOrder(foundTemplate.variant_order || 0);
                }

                // Populate form with template data
                setFormData({
                    displayName: foundTemplate.display_name || "",
                    name: foundTemplate.name || "",
                    description: foundTemplate.description || "",
                    author: foundTemplate.author || "",
                    category: foundTemplate.category || "",
                    originalSource: foundTemplate.original_source || "",
                    remarks: foundTemplate.remarks || "",
                    isVerified: foundTemplate.is_verified || false,
                    isAIAvailable: foundTemplate.is_ai_available || false,
                    type: foundTemplate.type || "official",
                    tier: foundTemplate.tier || "free",
                    group: foundTemplate.group || "",
                });

                setAliases(parseAliases(foundTemplate.aliases));

                // Load field definitions
                try {
                    const definitions = await apiClient.getFieldDefinitions(templateId);
                    setFieldDefinitions(definitions);

                    // Check for already merged fields
                    const alreadyMerged = new Set<string>();
                    Object.values(definitions).forEach(def => {
                        if (def.isMerged && def.mergePattern) {
                            alreadyMerged.add(def.mergePattern);
                        }
                    });
                    setMergedGroups(alreadyMerged);
                } catch (err) {
                    console.error("Failed to load field definitions:", err);
                    // Field definitions might not exist for older templates
                    setFieldDefinitions(null);
                }

                // Detect mergeable groups from placeholders
                const placeholdersList = parsePlaceholders(foundTemplate.placeholders);
                const groups = detectMergeableGroups(placeholdersList);
                setMergeableGroups(groups);
            } catch (err) {
                console.error("Failed to load template:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to load template"
                );
            } finally {
                setLoading(false);
            }
        };

        if (templateId && isAuthenticated) {
            loadTemplate();
        }
    }, [templateId, isAuthenticated]);

    // Handle applying a merge
    const handleApplyMerge = async (group: MergeableGroup) => {
        const mergeConfig = pendingMerges.get(group.pattern) || {
            label: group.suggestedLabel,
            separator: group.suggestedSeparator
        };

        // Create merged field definition
        const mergedDef = createMergedFieldDefinition(group, mergeConfig.label, mergeConfig.separator);

        // Update field definitions
        const newDefinitions = { ...fieldDefinitions };

        // Add the merged field (using first field key as the main one)
        const mainKey = group.fields[0];
        newDefinitions[mainKey] = mergedDef;

        // Mark other fields as hidden (they'll be handled by the merged field)
        group.fields.slice(1).forEach(key => {
            if (newDefinitions[key]) {
                newDefinitions[key] = {
                    ...newDefinitions[key],
                    group: `merged_hidden_${group.pattern}`,
                };
            }
        });

        try {
            // Save to backend
            await apiClient.updateFieldDefinitions(templateId, newDefinitions);
            setFieldDefinitions(newDefinitions);

            // Mark this group as merged
            setMergedGroups(prev => new Set([...prev, group.pattern]));
            setFieldDefSuccess(true);
            setTimeout(() => setFieldDefSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save merged field:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกการรวมช่องได้");
        }
    };

    // Handle undoing a merge
    const handleUndoMerge = async (group: MergeableGroup) => {
        try {
            // Regenerate to get original field definitions
            const definitions = await apiClient.regenerateFieldDefinitions(templateId);
            setFieldDefinitions(definitions);

            // Remove from merged groups
            setMergedGroups(prev => {
                const newSet = new Set(prev);
                newSet.delete(group.pattern);
                return newSet;
            });

            setFieldDefSuccess(true);
            setTimeout(() => setFieldDefSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to undo merge:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถยกเลิกการรวมช่องได้");
        }
    };

    // Handle updating pending merge config
    const handleUpdateMergeConfig = (pattern: string, field: 'label' | 'separator', value: string) => {
        setPendingMerges(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(pattern) || { label: '', separator: '' };
            newMap.set(pattern, { ...current, [field]: value });
            return newMap;
        });
    };

    // Handle regenerate field definitions
    const handleRegenerateFieldDefinitions = async () => {
        try {
            setRegenerating(true);
            setError(null);
            setFieldDefSuccess(false);

            const definitions = await apiClient.regenerateFieldDefinitions(templateId);
            setFieldDefinitions(definitions);
            setFieldDefSuccess(true);

            // Sync TemplateContext so canvas page gets updated sections
            await refetchTemplate();

            // Clear success message after 3 seconds
            setTimeout(() => setFieldDefSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to regenerate field definitions:", err);
            setError(
                err instanceof Error ? err.message : "ไม่สามารถสร้าง Field Definitions ใหม่ได้"
            );
        } finally {
            setRegenerating(false);
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setSuccess(false);
    };

    const handleAliasChange = (placeholder: string, alias: string) => {
        setAliases((prev) => ({
            ...prev,
            [placeholder]: alias,
        }));
        setSuccess(false);
    };

    // Add new category
    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            const categoryValue = newCategoryName.trim().toLowerCase().replace(/\s+/g, "_");
            const categoryLabel = newCategoryName.trim();
            setFormData({ ...formData, category: categoryValue });
            setCategoryOptions(prev => [...prev, { value: categoryValue, label: categoryLabel }]);
            setIsAddingCategory(false);
            setNewCategoryName("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            setSaving(true);

            const updateData: TemplateUpdateData = {
                displayName: formData.displayName,
                name: formData.name,
                description: formData.description,
                author: formData.author,
                category: formData.category,
                originalSource: formData.originalSource,
                remarks: formData.remarks,
                isVerified: formData.isVerified,
                isAIAvailable: formData.isAIAvailable,
                type: formData.type,
                tier: formData.tier,
                group: formData.group,
                aliases: aliases,
            };

            await apiClient.updateTemplate(templateId, updateData);
            setSuccess(true);
        } catch (err) {
            console.error("Failed to update template:", err);
            setError(
                err instanceof Error ? err.message : "ไม่สามารถอัปเดตเทมเพลตได้"
            );
        } finally {
            setSaving(false);
        }
    };

    // Handle file replacement
    const handleFileUpload = async () => {
        if (!docxFile && !htmlFile) {
            setError("กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์");
            return;
        }

        try {
            setUploadingFiles(true);
            setError(null);
            setFileUploadSuccess(false);

            const result = await apiClient.replaceTemplateFiles(templateId, {
                docxFile: docxFile || undefined,
                htmlFile: htmlFile || undefined,
                regenerateFields: regenerateFieldsOnUpload,
            });

            // Update template state with new data
            if (result.template) {
                setTemplate(result.template);
            }

            // Reload field definitions if regenerated
            if (regenerateFieldsOnUpload && docxFile) {
                try {
                    const definitions = await apiClient.getFieldDefinitions(templateId);
                    setFieldDefinitions(definitions);
                } catch (err) {
                    console.error("Failed to reload field definitions:", err);
                }
            }

            // Clear file inputs
            setDocxFile(null);
            setHtmlFile(null);
            setFileUploadSuccess(true);
            setTimeout(() => setFileUploadSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to upload files:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถอัปโหลดไฟล์ได้");
        } finally {
            setUploadingFiles(false);
        }
    };

    // Handle document type assignment
    const handleAssignDocumentType = async () => {
        if (!selectedDocTypeId) {
            setError("กรุณาเลือกประเภทเอกสาร");
            return;
        }

        try {
            setDocTypeAssigning(true);
            setError(null);
            setDocTypeSuccess(false);

            await apiClient.assignTemplateToDocumentType(
                selectedDocTypeId,
                templateId,
                variantName,
                variantOrder
            );

            // Update template state
            if (template) {
                setTemplate({
                    ...template,
                    document_type_id: selectedDocTypeId,
                    variant_name: variantName,
                    variant_order: variantOrder,
                });
            }

            setDocTypeSuccess(true);
            setTimeout(() => setDocTypeSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to assign document type:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถกำหนดประเภทเอกสารได้");
        } finally {
            setDocTypeAssigning(false);
        }
    };

    // Handle document type unassignment
    const handleUnassignDocumentType = async () => {
        if (!template?.document_type_id) return;

        try {
            setDocTypeAssigning(true);
            setError(null);

            await apiClient.unassignTemplateFromDocumentType(
                template.document_type_id,
                templateId
            );

            // Update template state
            setTemplate({
                ...template,
                document_type_id: '',
                variant_name: '',
                variant_order: 0,
            });
            setSelectedDocTypeId('');
            setVariantName('');
            setVariantOrder(0);

            setDocTypeSuccess(true);
            setTimeout(() => setDocTypeSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to unassign document type:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถยกเลิกการกำหนดประเภทเอกสารได้");
        } finally {
            setDocTypeAssigning(false);
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

    // Don't render if not authenticated
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

    const placeholders = template ? parsePlaceholders(template.placeholders) : [];

    return (
        <div className="min-h-screen bg-background font-sans">
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

                {/* Header */}
                <div className="bg-background border border-border-default rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-h3 text-foreground">
                                แก้ไขรายละเอียดเทมเพลต
                            </h1>
                            <p className="text-body-sm text-text-muted">
                                {template?.display_name || template?.name || template?.filename}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Basic Info */}
                        <div className="space-y-6">
                            <div className="bg-background border border-border-default rounded-lg p-6">
                                <h2 className="text-h4 text-foreground mb-6">ข้อมูลพื้นฐาน</h2>

                                <div className="space-y-4">
                                    <Input
                                        label="ชื่อที่แสดง"
                                        name="displayName"
                                        type="text"
                                        placeholder="ชื่อที่แสดงให้ผู้ใช้เห็น"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        disabled={saving}
                                        required
                                    />

                                    <Input
                                        label="ชื่อเทมเพลต"
                                        name="name"
                                        type="text"
                                        placeholder="ชื่อเทมเพลต (ภายใน)"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={saving}
                                    />

                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-foreground">
                                            คำอธิบาย
                                        </label>
                                        <textarea
                                            name="description"
                                            placeholder="คำอธิบายเทมเพลต"
                                            value={formData.description}
                                            onChange={handleChange}
                                            disabled={saving}
                                            rows={3}
                                            className="w-full p-2.5 text-sm text-foreground bg-background border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:bg-surface-alt resize-none"
                                        />
                                    </div>

                                    <Input
                                        label="ผู้สร้าง"
                                        name="author"
                                        type="text"
                                        placeholder="ชื่อผู้สร้างเทมเพลต"
                                        value={formData.author}
                                        onChange={handleChange}
                                        disabled={saving}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            หมวดหมู่
                                        </label>
                                        {isAddingCategory ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="ชื่อหมวดหมู่ใหม่"
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            handleAddCategory();
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddCategory}
                                                    className="px-3 py-2 bg-[#007398] text-white text-sm rounded-lg hover:bg-[#005f7a]"
                                                >
                                                    เพิ่ม
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsAddingCategory(false);
                                                        setNewCategoryName("");
                                                    }}
                                                    className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                                                >
                                                    ยกเลิก
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                    disabled={saving}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">เลือกหมวดหมู่</option>
                                                    {categoryOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingCategory(true)}
                                                    className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                                                    title="เพิ่มหมวดหมู่ใหม่"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    ใหม่
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <Input
                                        label="กลุ่ม"
                                        name="group"
                                        type="text"
                                        placeholder="กลุ่มของเทมเพลต"
                                        value={formData.group}
                                        onChange={handleChange}
                                        disabled={saving}
                                    />
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="bg-background border border-border-default rounded-lg p-6">
                                <h2 className="text-h4 text-foreground mb-6">ข้อมูลเพิ่มเติม</h2>

                                <div className="space-y-4">
                                    <Input
                                        label="แหล่งที่มา"
                                        name="originalSource"
                                        type="text"
                                        placeholder="แหล่งที่มาของเทมเพลต"
                                        value={formData.originalSource}
                                        onChange={handleChange}
                                        disabled={saving}
                                    />

                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-foreground">
                                            หมายเหตุ
                                        </label>
                                        <textarea
                                            name="remarks"
                                            placeholder="หมายเหตุเพิ่มเติม"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                            disabled={saving}
                                            rows={3}
                                            className="w-full p-2.5 text-sm text-foreground bg-background border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:bg-surface-alt resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* File Replacement Section */}
                            <div className="bg-background border border-border-default rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Upload className="w-5 h-5 text-primary" />
                                    <h2 className="text-h4 text-foreground">อัปโหลดไฟล์ใหม่</h2>
                                </div>
                                <p className="text-body-sm text-text-muted mb-4">
                                    แทนที่ไฟล์เทมเพลต DOCX หรือไฟล์ตัวอย่าง HTML
                                </p>

                                <div className="space-y-4">
                                    {/* DOCX File Upload */}
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-2 block">
                                            ไฟล์เทมเพลต (.docx)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".docx"
                                                onChange={(e) => setDocxFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="docx-upload"
                                                disabled={uploadingFiles}
                                            />
                                            <label
                                                htmlFor="docx-upload"
                                                className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                                    docxFile
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border-default hover:border-primary/50 hover:bg-surface-alt'
                                                } ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    docxFile ? 'bg-primary/10' : 'bg-surface-alt'
                                                }`}>
                                                    <File className={`w-5 h-5 ${docxFile ? 'text-primary' : 'text-text-muted'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {docxFile ? (
                                                        <>
                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                {docxFile.name}
                                                            </p>
                                                            <p className="text-xs text-text-muted">
                                                                {(docxFile.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-text-muted">
                                                                คลิกเพื่อเลือกไฟล์ DOCX
                                                            </p>
                                                            <p className="text-xs text-text-muted">
                                                                ไฟล์ปัจจุบัน: {template?.filename || '-'}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                                {docxFile && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setDocxFile(null);
                                                        }}
                                                        className="p-1 hover:bg-red-100 rounded text-red-500"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* HTML File Upload */}
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-2 block">
                                            ไฟล์ตัวอย่าง (.html)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".html,.htm"
                                                onChange={(e) => setHtmlFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="html-upload"
                                                disabled={uploadingFiles}
                                            />
                                            <label
                                                htmlFor="html-upload"
                                                className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                                    htmlFile
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border-default hover:border-primary/50 hover:bg-surface-alt'
                                                } ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    htmlFile ? 'bg-primary/10' : 'bg-surface-alt'
                                                }`}>
                                                    <FileCode className={`w-5 h-5 ${htmlFile ? 'text-primary' : 'text-text-muted'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    {htmlFile ? (
                                                        <>
                                                            <p className="text-sm font-medium text-foreground truncate">
                                                                {htmlFile.name}
                                                            </p>
                                                            <p className="text-xs text-text-muted">
                                                                {(htmlFile.size / 1024).toFixed(1)} KB
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-text-muted">
                                                                คลิกเพื่อเลือกไฟล์ HTML
                                                            </p>
                                                            <p className="text-xs text-text-muted">
                                                                สำหรับแสดงตัวอย่าง
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                                {htmlFile && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setHtmlFile(null);
                                                        }}
                                                        className="p-1 hover:bg-red-100 rounded text-red-500"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Regenerate Fields Checkbox */}
                                    {docxFile && (
                                        <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg">
                                            <input
                                                type="checkbox"
                                                id="regenerateFields"
                                                checked={regenerateFieldsOnUpload}
                                                onChange={(e) => setRegenerateFieldsOnUpload(e.target.checked)}
                                                disabled={uploadingFiles}
                                                className="w-4 h-4 text-primary bg-background border-border-default rounded focus:ring-primary"
                                            />
                                            <label htmlFor="regenerateFields" className="text-sm text-foreground">
                                                สร้าง Field Definitions ใหม่จาก placeholders
                                            </label>
                                        </div>
                                    )}

                                    {/* Upload Success Message */}
                                    {fileUploadSuccess && (
                                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                            <p className="text-body-sm text-green-700">
                                                อัปโหลดไฟล์สำเร็จ!
                                            </p>
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="w-full justify-center"
                                        onClick={handleFileUpload}
                                        disabled={uploadingFiles || (!docxFile && !htmlFile)}
                                    >
                                        {uploadingFiles ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                กำลังอัปโหลด...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                อัปโหลดไฟล์
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Settings & Aliases */}
                        <div className="space-y-6">
                            {/* Settings */}
                            <div className="bg-background border border-border-default rounded-lg p-6">
                                <h2 className="text-h4 text-foreground mb-6">การตั้งค่า</h2>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-foreground">
                                            ประเภท
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            disabled={saving}
                                            className="w-full p-2.5 text-sm text-foreground bg-background border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:bg-surface-alt"
                                        >
                                            <option value="official">Official</option>
                                            <option value="private">Private</option>
                                            <option value="community">Community</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1 w-full">
                                        <label className="text-sm font-medium text-foreground">
                                            ระดับ
                                        </label>
                                        <select
                                            name="tier"
                                            value={formData.tier}
                                            onChange={handleChange}
                                            disabled={saving}
                                            className="w-full p-2.5 text-sm text-foreground bg-background border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:bg-surface-alt"
                                        >
                                            <option value="free">Free</option>
                                            <option value="basic">Basic</option>
                                            <option value="premium">Premium</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isVerified"
                                            name="isVerified"
                                            checked={formData.isVerified}
                                            onChange={handleChange}
                                            disabled={saving}
                                            className="w-4 h-4 text-primary bg-background border-border-default rounded focus:ring-primary"
                                        />
                                        <label htmlFor="isVerified" className="text-sm text-foreground">
                                            ยืนยันแล้ว (Verified)
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isAIAvailable"
                                            name="isAIAvailable"
                                            checked={formData.isAIAvailable}
                                            onChange={handleChange}
                                            disabled={saving}
                                            className="w-4 h-4 text-primary bg-background border-border-default rounded focus:ring-primary"
                                        />
                                        <label htmlFor="isAIAvailable" className="text-sm text-foreground">
                                            รองรับ AI
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Document Type Assignment */}
                            <div className="bg-background border border-border-default rounded-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FolderOpen className="w-5 h-5 text-primary" />
                                    <h2 className="text-h4 text-foreground">ประเภทเอกสาร</h2>
                                </div>
                                <p className="text-body-sm text-text-muted mb-4">
                                    จัดกลุ่มเทมเพลตนี้เข้ากับประเภทเอกสารที่เกี่ยวข้อง
                                </p>

                                {template?.document_type_id ? (
                                    // Already assigned - show current assignment
                                    <div className="space-y-4">
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{
                                                            backgroundColor: documentTypes.find(dt => dt.id === template.document_type_id)?.color || '#6B7280'
                                                        }}
                                                    />
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {documentTypes.find(dt => dt.id === template.document_type_id)?.name || 'Unknown'}
                                                        </p>
                                                        {template.variant_name && (
                                                            <p className="text-sm text-text-muted">
                                                                รูปแบบ: {template.variant_name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleUnassignDocumentType}
                                                    disabled={docTypeAssigning}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {docTypeAssigning ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Unlink className="w-4 h-4" />
                                                    )}
                                                    ยกเลิก
                                                </button>
                                            </div>
                                        </div>

                                        {/* Update assignment form */}
                                        <div className="space-y-3 pt-3 border-t border-border-default">
                                            <p className="text-sm text-text-muted">อัปเดตการกำหนด:</p>
                                            <div>
                                                <label className="text-sm font-medium text-foreground mb-1 block">
                                                    ชื่อรูปแบบ (Variant)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={variantName}
                                                    onChange={(e) => setVariantName(e.target.value)}
                                                    placeholder="เช่น ด้านหน้า, ด้านหลัง, สำเนา"
                                                    className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-foreground mb-1 block">
                                                    ลำดับการแสดง
                                                </label>
                                                <input
                                                    type="number"
                                                    value={variantOrder}
                                                    onChange={(e) => setVariantOrder(parseInt(e.target.value) || 0)}
                                                    min={0}
                                                    className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={handleAssignDocumentType}
                                                disabled={docTypeAssigning}
                                                className="w-full justify-center"
                                            >
                                                {docTypeAssigning ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4 mr-2" />
                                                )}
                                                อัปเดต
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    // Not assigned - show assignment form
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-foreground mb-1 block">
                                                เลือกประเภทเอกสาร
                                            </label>
                                            <select
                                                value={selectedDocTypeId}
                                                onChange={(e) => setSelectedDocTypeId(e.target.value)}
                                                className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            >
                                                <option value="">-- เลือกประเภทเอกสาร --</option>
                                                {documentTypes.map((docType) => (
                                                    <option key={docType.id} value={docType.id}>
                                                        {docType.name}
                                                        {docType.name_en ? ` (${docType.name_en})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedDocTypeId && (
                                            <>
                                                <div>
                                                    <label className="text-sm font-medium text-foreground mb-1 block">
                                                        ชื่อรูปแบบ (Variant)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={variantName}
                                                        onChange={(e) => setVariantName(e.target.value)}
                                                        placeholder="เช่น ด้านหน้า, ด้านหลัง, สำเนา"
                                                        className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-foreground mb-1 block">
                                                        ลำดับการแสดง
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={variantOrder}
                                                        onChange={(e) => setVariantOrder(parseInt(e.target.value) || 0)}
                                                        min={0}
                                                        className="w-full px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {docTypeSuccess && (
                                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                <p className="text-body-sm text-green-700">
                                                    กำหนดประเภทเอกสารสำเร็จ!
                                                </p>
                                            </div>
                                        )}

                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleAssignDocumentType}
                                            disabled={docTypeAssigning || !selectedDocTypeId}
                                            className="w-full justify-center"
                                        >
                                            {docTypeAssigning ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    กำลังบันทึก...
                                                </>
                                            ) : (
                                                <>
                                                    <LinkIcon className="w-4 h-4 mr-2" />
                                                    กำหนดประเภทเอกสาร
                                                </>
                                            )}
                                        </Button>

                                        {documentTypes.length === 0 && (
                                            <p className="text-sm text-text-muted text-center">
                                                ยังไม่มีประเภทเอกสาร{' '}
                                                <a href="/settings/document-types" className="text-primary hover:underline">
                                                    สร้างประเภทเอกสาร
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Field Definitions - Section List */}
                            <div className="bg-background border border-border-default rounded-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Workflow className="w-5 h-5 text-primary" />
                                        <h2 className="text-h4 text-foreground">
                                            ส่วนของฟอร์ม
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => router.push(`/forms/${templateId}/canvas`)}
                                        >
                                            <Workflow className="w-4 h-4 mr-2" />
                                            จัดการฟอร์ม
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleRegenerateFieldDefinitions}
                                            disabled={regenerating}
                                        >
                                            {regenerating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    กำลังสร้าง...
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2" />
                                                    สร้างใหม่
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {fieldDefSuccess && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-4">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        <p className="text-body-sm text-green-700">
                                            อัปเดต Field Definitions สำเร็จ!
                                        </p>
                                    </div>
                                )}

                                {fieldDefinitions && Object.keys(fieldDefinitions).length > 0 ? (
                                    <SectionList
                                        fieldDefinitions={fieldDefinitions}
                                        aliases={aliases}
                                    />
                                ) : (
                                    <div className="text-center py-6 bg-surface-alt rounded-lg">
                                        <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
                                        <p className="text-body-sm text-text-muted">
                                            ยังไม่มีการตรวจจับประเภทช่อง
                                        </p>
                                        <p className="text-caption text-text-muted mt-1">
                                            กด &quot;สร้างใหม่&quot; เพื่อตรวจจับประเภทอัตโนมัติ
                                        </p>
                                    </div>
                                )}
                            </div>


                            {/* Merge Suggestions */}
                            {mergeableGroups.length > 0 && (
                                <div className="bg-background border border-amber-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Layers className="w-5 h-5 text-amber-500" />
                                            <h2 className="text-h4 text-foreground">
                                                แนะนำรวมช่อง
                                            </h2>
                                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                                {mergeableGroups.length} กลุ่ม
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowMergeSuggestions(!showMergeSuggestions)}
                                            className="p-1 hover:bg-surface-alt rounded"
                                        >
                                            {showMergeSuggestions ? (
                                                <ChevronUp className="w-5 h-5 text-text-muted" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-text-muted" />
                                            )}
                                        </button>
                                    </div>

                                    {showMergeSuggestions && (
                                        <div className="space-y-4">
                                            <p className="text-body-sm text-text-muted">
                                                พบช่องที่มีลำดับเลขต่อเนื่อง สามารถรวมเป็นช่องเดียวได้
                                            </p>

                                            {mergeableGroups.map((group) => {
                                                const isMerged = mergedGroups.has(group.pattern);
                                                const config = pendingMerges.get(group.pattern) || {
                                                    label: group.suggestedLabel,
                                                    separator: group.suggestedSeparator
                                                };

                                                return (
                                                    <div
                                                        key={group.pattern}
                                                        className={`p-4 rounded-lg border ${isMerged
                                                                ? 'bg-green-50 border-green-200'
                                                                : 'bg-amber-50 border-amber-200'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="font-medium text-foreground">
                                                                        {group.pattern}
                                                                    </span>
                                                                    <span className="text-xs px-2 py-0.5 bg-white/50 text-text-muted rounded">
                                                                        {group.fields.length} ช่อง
                                                                    </span>
                                                                    {isMerged && (
                                                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                                                            รวมแล้ว
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <p className="text-xs text-text-muted mb-3">
                                                                    {group.fields.slice(0, 5).join(', ')}
                                                                    {group.fields.length > 5 && `, ... +${group.fields.length - 5}`}
                                                                </p>

                                                                {!isMerged && (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        <div>
                                                                            <label className="text-xs text-text-muted mb-1 block">
                                                                                ชื่อที่แสดง
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={config.label}
                                                                                onChange={(e) => handleUpdateMergeConfig(group.pattern, 'label', e.target.value)}
                                                                                placeholder={group.suggestedLabel}
                                                                                className="w-full px-3 py-1.5 text-sm border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-xs text-text-muted mb-1 block">
                                                                                ตัวคั่น (เว้นว่างถ้าไม่มี)
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={config.separator}
                                                                                onChange={(e) => handleUpdateMergeConfig(group.pattern, 'separator', e.target.value)}
                                                                                placeholder="เช่น - หรือ /"
                                                                                className="w-full px-3 py-1.5 text-sm border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex-shrink-0">
                                                                {isMerged ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUndoMerge(group)}
                                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                        ยกเลิก
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleApplyMerge(group)}
                                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-colors"
                                                                    >
                                                                        <Layers className="w-4 h-4" />
                                                                        รวมช่อง
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Aliases */}
                            {placeholders.length > 0 && (
                                <div className="bg-background border border-border-default rounded-lg p-6">
                                    <h2 className="text-h4 text-foreground mb-4">
                                        ชื่อช่องกรอกข้อมูล ({placeholders.length} รายการ)
                                    </h2>
                                    <p className="text-body-sm text-text-muted mb-4">
                                        กำหนดชื่อที่แสดงสำหรับแต่ละช่องกรอกข้อมูล
                                    </p>

                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {placeholders.map((placeholder, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary text-body-sm font-semibold flex-shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Input
                                                        type="text"
                                                        placeholder={placeholder}
                                                        value={aliases[placeholder] || ""}
                                                        onChange={(e) =>
                                                            handleAliasChange(placeholder, e.target.value)
                                                        }
                                                        disabled={saving}
                                                    />
                                                    <p className="text-caption text-text-muted font-mono mt-1 truncate">
                                                        {placeholder}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && template && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-body-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <p className="text-body-sm text-green-700">
                                        บันทึกข้อมูลสำเร็จ
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        บันทึกข้อมูล
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
