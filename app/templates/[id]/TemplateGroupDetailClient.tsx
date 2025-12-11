"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Sparkles,
    Loader2,
    Play,
    LogIn,
    Eye,
    Info,
    Lock,
    Unlock,
    FileText,
    ChevronRight,
    FolderOpen,
    Pencil,
    X,
    Save,
    Plus,
    Trash2,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { DocumentType, Template, DocumentTypeUpdateRequest } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/context";

// Helper to parse placeholders
const parsePlaceholders = (placeholdersJson: string): string[] => {
    try {
        return JSON.parse(placeholdersJson || "[]");
    } catch {
        return [];
    }
};

// Format date
const formatDate = (dateString: string): string => {
    if (!dateString) return "-";
    try {
        return new Date(dateString).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return dateString;
    }
};

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

// Template Variant Item Component
function TemplateVariantItem({
    template,
    index,
    isAuthenticated,
    authLoading,
    onDelete,
    deleting,
}: {
    template: Template;
    index: number;
    isAuthenticated: boolean;
    authLoading: boolean;
    onDelete?: (templateId: string) => void;
    deleting?: boolean;
}) {
    const placeholders = parsePlaceholders(template.placeholders);

    const handleDelete = () => {
        if (!onDelete) return;
        if (confirm(`คุณต้องการลบ "${template.variant_name || template.display_name || template.name}" หรือไม่?\n\nการลบนี้จะไม่สามารถกู้คืนได้`)) {
            onDelete(template.id);
        }
    };

    return (
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            {/* Index number */}
            <div className="w-10 h-10 bg-[#007398]/10 rounded-lg flex items-center justify-center text-[#007398] font-medium flex-shrink-0">
                {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Link
                        href={`/forms/${template.id}`}
                        className="text-base font-medium text-gray-900 hover:text-[#007398] transition-colors"
                    >
                        {template.variant_name || template.display_name || template.name || `รูปแบบ ${index + 1}`}
                    </Link>
                    {template.is_verified && (
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                    {template.is_ai_available && (
                        <Sparkles className="w-4 h-4 text-purple-500" />
                    )}
                </div>

                {/* Description */}
                {template.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {template.description}
                    </p>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {placeholders.length > 0 && (
                        <span>{placeholders.length} ช่องกรอก</span>
                    )}
                    {template.tier && (
                        <span className="capitalize">{template.tier}</span>
                    )}
                    {template.created_at && (
                        <span>{formatDate(template.created_at)}</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                    href={`/forms/${template.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-[#007398] hover:bg-white rounded transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    ดูรายละเอียด
                </Link>
                {authLoading ? (
                    <Loader2 className="w-5 h-5 text-[#007398] animate-spin" />
                ) : isAuthenticated ? (
                    <>
                        <Link
                            href={`/forms/${template.id}/fill`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-[#007398] text-white rounded hover:bg-[#005f7a] transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            ใช้งาน
                        </Link>
                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="ลบเทมเพลต"
                            >
                                {deleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </>
                ) : (
                    <Link
                        href={`/login?redirect=/forms/${template.id}/fill`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-[#007398] text-white rounded hover:bg-[#005f7a] transition-colors"
                    >
                        <LogIn className="w-4 h-4" />
                        เข้าสู่ระบบ
                    </Link>
                )}
            </div>
        </div>
    );
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TemplateGroupDetailClient({ params }: PageProps) {
    const { id: documentTypeId } = use(params);
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [documentType, setDocumentType] = useState<DocumentType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"about" | "variants">("about");

    // Edit modal state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<DocumentTypeUpdateRequest>({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Category state
    const [categories, setCategories] = useState<string[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategory, setNewCategory] = useState("");

    // Delete template state
    const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

    // Add variant modal state
    const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
    const [orphanTemplates, setOrphanTemplates] = useState<Template[]>([]);
    const [loadingOrphans, setLoadingOrphans] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState("");
    const [variantName, setVariantName] = useState("");
    const [variantOrder, setVariantOrder] = useState(0);
    const [addingVariant, setAddingVariant] = useState(false);

    // Delete template handler
    const handleDeleteTemplate = async (templateId: string) => {
        try {
            setDeletingTemplateId(templateId);
            await apiClient.deleteTemplate(templateId);
            // Remove template from local state
            if (documentType) {
                setDocumentType({
                    ...documentType,
                    templates: documentType.templates?.filter(t => t.id !== templateId),
                });
            }
        } catch (err) {
            console.error("Failed to delete template:", err);
            alert(err instanceof Error ? err.message : "ไม่สามารถลบเทมเพลตได้");
        } finally {
            setDeletingTemplateId(null);
        }
    };

    // Fetch orphan templates for adding variants
    const fetchOrphanTemplates = async () => {
        try {
            setLoadingOrphans(true);
            const response = await apiClient.getTemplatesGrouped();
            setOrphanTemplates(response.orphan_templates || []);
        } catch (err) {
            console.error("Failed to fetch orphan templates:", err);
        } finally {
            setLoadingOrphans(false);
        }
    };

    // Open add variant modal
    const openAddVariantModal = () => {
        setSelectedTemplateId("");
        setVariantName("");
        setVariantOrder((documentType?.templates?.length || 0) + 1);
        setIsAddVariantOpen(true);
        fetchOrphanTemplates();
    };

    // Add variant handler
    const handleAddVariant = async () => {
        if (!selectedTemplateId) {
            alert("กรุณาเลือกเทมเพลต");
            return;
        }

        try {
            setAddingVariant(true);
            await apiClient.assignTemplateToDocumentType(
                documentTypeId,
                selectedTemplateId,
                variantName || `รูปแบบ ${variantOrder}`,
                variantOrder
            );

            // Refresh document type data
            const updatedDocType = await apiClient.getDocumentType(documentTypeId, true);
            setDocumentType(updatedDocType);

            setIsAddVariantOpen(false);
        } catch (err) {
            console.error("Failed to add variant:", err);
            alert(err instanceof Error ? err.message : "ไม่สามารถเพิ่มรูปแบบเอกสารได้");
        } finally {
            setAddingVariant(false);
        }
    };

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const fetchedCategories = await apiClient.getDocumentTypeCategories();
            setCategories(fetchedCategories || []);
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            // Fallback to empty array
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Open edit modal with current values
    const openEditModal = () => {
        if (documentType) {
            setEditForm({
                name: documentType.name,
                name_en: documentType.name_en || "",
                description: documentType.description || "",
                category: documentType.category,
                code: documentType.code,
            });
            setSaveError(null);
            setIsAddingCategory(false);
            setNewCategory("");
            setIsEditOpen(true);
            fetchCategories();
        }
    };

    // Add new category
    const handleAddCategory = () => {
        if (newCategory.trim()) {
            const categoryValue = newCategory.trim().toLowerCase().replace(/\s+/g, "_");
            setEditForm({ ...editForm, category: categoryValue });
            setCategories(prev => [...prev, categoryValue]);
            setIsAddingCategory(false);
            setNewCategory("");
        }
    };

    // Save document type changes
    const handleSave = async () => {
        if (!documentType) return;

        try {
            setSaving(true);
            setSaveError(null);

            const updatedDocType = await apiClient.updateDocumentType(documentType.id, editForm);

            // Update local state with new data (preserve templates)
            setDocumentType({
                ...updatedDocType,
                templates: documentType.templates,
            });

            setIsEditOpen(false);
        } catch (err) {
            console.error("Failed to update document type:", err);
            setSaveError(err instanceof Error ? err.message : "ไม่สามารถบันทึกได้");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        const loadDocumentType = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get document type with templates
                const docType = await apiClient.getDocumentType(documentTypeId, true);
                setDocumentType(docType);
            } catch (err) {
                console.error("Failed to load document type:", err);
                setError(
                    err instanceof Error ? err.message : "Failed to load document type"
                );
            } finally {
                setLoading(false);
            }
        };

        if (documentTypeId) {
            loadDocumentType();
        }
    }, [documentTypeId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#007398] animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !documentType) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 py-24 text-center">
                    <h1 className="text-2xl font-light text-gray-900 mb-4">
                        {error || "ไม่พบกลุ่มเอกสาร"}
                    </h1>
                    <Link
                        href="/templates"
                        className="inline-flex items-center text-[#007398] hover:underline"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับไปหน้ารายการ
                    </Link>
                </div>
            </div>
        );
    }

    const templates = documentType.templates || [];
    const headerBgColor = getHeaderBgColor(documentType.category || "other");
    const hasVerified = templates.some((t) => t.is_verified);
    const hasAI = templates.some((t) => t.is_ai_available);

    // Calculate total placeholders across all templates
    const totalPlaceholders = templates.reduce((sum, t) => {
        const placeholders = parsePlaceholders(t.placeholders);
        return sum + placeholders.length;
    }, 0);

    // Get the most common tier
    const tierCounts = templates.reduce((acc, t) => {
        const tier = t.tier || "free";
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const mostCommonTier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "free";

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                    <Link
                        href="/templates"
                        className="text-sm text-gray-600 hover:text-[#007398]"
                    >
                        &#8592; กลับไปหน้ากลุ่มเอกสาร
                    </Link>
                </div>
            </div>

            {/* Header Banner */}
            <div
                className="relative"
                style={{ backgroundColor: headerBgColor }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-start gap-6">
                        {/* Document Type Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl md:text-3xl font-light text-white leading-tight mb-2">
                                {documentType.name}
                            </h1>

                            {/* English name */}
                            {documentType.name_en && (
                                <p className="text-white/80 text-lg mb-3">
                                    {documentType.name_en}
                                </p>
                            )}

                            {/* Tags/Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {hasVerified && (
                                    <span className="inline-flex items-center gap-1 text-white/90 text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        มีรูปแบบที่ยืนยันแล้ว
                                    </span>
                                )}
                                {hasAI && (
                                    <span className="inline-flex items-center gap-1 text-white/90 text-sm">
                                        <Sparkles className="w-4 h-4" />
                                        รองรับ AI
                                    </span>
                                )}
                                {mostCommonTier === "free" && (
                                    <span className="inline-flex items-center gap-1 text-white/90 text-sm">
                                        <Unlock className="w-4 h-4" />
                                        ใช้งานฟรี
                                    </span>
                                )}
                            </div>

                            {/* Short description */}
                            {documentType.description && (
                                <p className="text-white/80 text-sm max-w-2xl">
                                    {documentType.description}
                                </p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="hidden lg:flex items-center gap-8 text-white">
                            <div className="text-center">
                                <div className="text-3xl font-light">
                                    {templates.length}
                                </div>
                                <div className="text-sm text-white/70">รูปแบบ</div>
                            </div>
                            <div className="w-px h-12 bg-white/30" />
                            <div className="text-center">
                                <div className="text-3xl font-light capitalize">
                                    {mostCommonTier || "Free"}
                                </div>
                                <div className="text-sm text-white/70">ระดับ</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        {/* Left - Tabs */}
                        <div className="flex items-center">
                            <button
                                onClick={() => setActiveTab("about")}
                                className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "about"
                                        ? "border-[#007398] text-[#007398]"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                รายละเอียด
                            </button>
                            <button
                                onClick={() => setActiveTab("variants")}
                                className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "variants"
                                        ? "border-[#007398] text-[#007398]"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                รูปแบบเอกสาร ({templates.length})
                            </button>
                        </div>

                        {/* Right - Quick Actions */}
                        <div className="flex items-center gap-2">
                            {templates.length > 0 && (
                                <button
                                    onClick={() => setActiveTab("variants")}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white text-sm font-medium rounded hover:bg-[#005f7a] transition-colors"
                                >
                                    <Play className="w-4 h-4" />
                                    เลือกรูปแบบเอกสาร
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* Left Column - Main Content */}
                    <div className="flex-1 min-w-0">
                        {activeTab === "about" && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h2 className="text-xl font-medium text-gray-900 mb-4">
                                    เกี่ยวกับกลุ่มเอกสาร
                                </h2>

                                {documentType.description ? (
                                    <div className="prose prose-sm max-w-none text-gray-700 mb-6">
                                        <p>{documentType.description}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm mb-6">
                                        {documentType.name} เป็นกลุ่มเอกสารที่รวบรวมแบบฟอร์มที่เกี่ยวข้องเข้าด้วยกัน
                                    </p>
                                )}

                                {/* Quick Info */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1">
                                        ข้อมูลเบื้องต้น
                                        <Info className="w-4 h-4 text-gray-400" />
                                    </h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        {documentType.category && (
                                            <div>
                                                <dt className="text-gray-500">หมวดหมู่</dt>
                                                <dd className="text-gray-900 font-medium">
                                                    {documentType.category}
                                                </dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt className="text-gray-500">จำนวนรูปแบบ</dt>
                                            <dd className="text-gray-900 font-medium">
                                                {templates.length} รูปแบบ
                                            </dd>
                                        </div>
                                        {documentType.created_at && (
                                            <div>
                                                <dt className="text-gray-500">วันที่สร้าง</dt>
                                                <dd className="text-gray-900">
                                                    {formatDate(documentType.created_at)}
                                                </dd>
                                            </div>
                                        )}
                                        {totalPlaceholders > 0 && (
                                            <div>
                                                <dt className="text-gray-500">ช่องกรอกทั้งหมด</dt>
                                                <dd className="text-gray-900">
                                                    {totalPlaceholders} ช่อง (เฉลี่ย {Math.round(totalPlaceholders / templates.length)} ต่อรูปแบบ)
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Form Variants Preview */}
                                {templates.length > 0 && (
                                    <div className="border-t border-gray-200 pt-6 mt-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                                            รูปแบบเอกสารในกลุ่มนี้ ({templates.length} รูปแบบ)
                                        </h3>
                                        <div className="space-y-2">
                                            {templates.slice(0, 3).map((template, idx) => (
                                                <Link
                                                    key={template.id}
                                                    href={`/forms/${template.id}`}
                                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="w-8 h-8 bg-[#007398]/10 rounded flex items-center justify-center text-[#007398] text-sm font-medium flex-shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {template.variant_name || template.display_name || `รูปแบบ ${idx + 1}`}
                                                        </div>
                                                        {template.is_verified && (
                                                            <span className="inline-flex items-center text-xs text-blue-600 mt-0.5">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                ยืนยันแล้ว
                                                            </span>
                                                        )}
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                </Link>
                                            ))}
                                        </div>
                                        {templates.length > 3 && (
                                            <button
                                                onClick={() => setActiveTab("variants")}
                                                className="mt-3 text-sm text-[#007398] hover:underline"
                                            >
                                                ดูรูปแบบทั้งหมด ({templates.length}) &#8594;
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "variants" && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-medium text-gray-900">
                                        รูปแบบเอกสาร ({templates.length} รูปแบบ)
                                    </h2>
                                    {isAuthenticated && (
                                        <button
                                            onClick={openAddVariantModal}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#007398] text-white text-sm rounded hover:bg-[#005f7a] transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                            เพิ่มรูปแบบ
                                        </button>
                                    )}
                                </div>

                                {templates.length > 0 ? (
                                    <div className="space-y-3">
                                        {templates
                                            .sort((a, b) => (a.variant_order || 0) - (b.variant_order || 0))
                                            .map((template, idx) => (
                                                <TemplateVariantItem
                                                    key={template.id}
                                                    template={template}
                                                    index={idx}
                                                    isAuthenticated={isAuthenticated}
                                                    authLoading={authLoading}
                                                    onDelete={handleDeleteTemplate}
                                                    deleting={deletingTemplateId === template.id}
                                                />
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">
                                            ยังไม่มีรูปแบบเอกสารในกลุ่มนี้
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="w-72 flex-shrink-0 hidden lg:block">
                        {/* Form Variants Selection Card */}
                        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                เลือกรูปแบบเอกสาร
                            </h3>
                            <div className="space-y-2">
                                {authLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 text-[#007398] animate-spin" />
                                    </div>
                                ) : templates.length > 0 ? (
                                    <>
                                        {templates
                                            .sort((a, b) => (a.variant_order || 0) - (b.variant_order || 0))
                                            .map((template, idx) => (
                                                <div
                                                    key={template.id}
                                                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="w-5 h-5 bg-[#007398]/10 rounded text-[#007398] text-xs font-medium flex items-center justify-center flex-shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-900 truncate">
                                                            {template.variant_name || template.display_name || `รูปแบบ ${idx + 1}`}
                                                        </span>
                                                        {template.is_verified && (
                                                            <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/forms/${template.id}`}
                                                            className="flex-1 text-center px-2 py-1.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-white transition-colors"
                                                        >
                                                            ดูรายละเอียด
                                                        </Link>
                                                        {isAuthenticated ? (
                                                            <Link
                                                                href={`/forms/${template.id}/fill`}
                                                                className="flex-1 text-center px-2 py-1.5 text-xs bg-[#007398] text-white rounded hover:bg-[#005f7a] transition-colors"
                                                            >
                                                                ใช้งาน
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                href={`/login?redirect=/forms/${template.id}/fill`}
                                                                className="flex-1 text-center px-2 py-1.5 text-xs bg-[#007398] text-white rounded hover:bg-[#005f7a] transition-colors"
                                                            >
                                                                เข้าสู่ระบบ
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                        {/* Register prompt for non-authenticated users */}
                                        {!isAuthenticated && (
                                            <p className="text-xs text-gray-500 text-center pt-2">
                                                ยังไม่มีบัญชี?{" "}
                                                <Link
                                                    href="/register"
                                                    className="text-[#007398] hover:underline"
                                                >
                                                    สมัครสมาชิก
                                                </Link>
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center">
                                        ยังไม่มีรูปแบบเอกสารในกลุ่มนี้
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Access Info */}
                        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                การเข้าถึง
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    {mostCommonTier === "free" ? (
                                        <Unlock className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 capitalize">
                                            {mostCommonTier || "Free"}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {mostCommonTier === "free"
                                                ? "ใช้งานได้ฟรีไม่มีค่าใช้จ่าย"
                                                : `รูปแบบส่วนใหญ่ต้องเป็นสมาชิกระดับ ${mostCommonTier}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Document Type Info */}
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    ข้อมูลกลุ่มเอกสาร
                                </h3>
                                {isAuthenticated && (
                                    <button
                                        onClick={openEditModal}
                                        className="p-1.5 text-gray-400 hover:text-[#007398] hover:bg-gray-100 rounded transition-colors"
                                        title="แก้ไขข้อมูล"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <dl className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">
                                        {templates.length} รูปแบบเอกสาร
                                    </span>
                                </div>
                                {documentType.created_at && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">
                                            {formatDate(documentType.created_at)}
                                        </span>
                                    </div>
                                )}
                                {documentType.code && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-400 text-xs">CODE</span>
                                        <span className="text-gray-600 font-mono text-xs">
                                            {documentType.code}
                                        </span>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsEditOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                แก้ไขข้อมูลกลุ่มเอกสาร
                            </h2>
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form */}
                        <div className="p-4 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อกลุ่มเอกสาร (ภาษาไทย) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editForm.name || ""}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent"
                                    placeholder="เช่น ทะเบียนสมรส"
                                />
                            </div>

                            {/* Name EN */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อกลุ่มเอกสาร (ภาษาอังกฤษ)
                                </label>
                                <input
                                    type="text"
                                    value={editForm.name_en || ""}
                                    onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent"
                                    placeholder="e.g. Marriage Certificate"
                                />
                            </div>

                            {/* Code */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รหัส (Code)
                                </label>
                                <input
                                    type="text"
                                    value={editForm.code || ""}
                                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent"
                                    placeholder="e.g. marriage_certificate"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    รหัสสำหรับอ้างอิง ใช้ตัวอักษรภาษาอังกฤษ ตัวเลข และ _ เท่านั้น
                                </p>
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    หมวดหมู่
                                </label>
                                {isAddingCategory ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCategory}
                                            disabled={!newCategory.trim()}
                                            className="px-3 py-2 bg-[#007398] text-white text-sm rounded-lg hover:bg-[#005f7a] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            เพิ่ม
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddingCategory(false);
                                                setNewCategory("");
                                            }}
                                            className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                                        >
                                            ยกเลิก
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select
                                            value={editForm.category || ""}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent"
                                            disabled={loadingCategories}
                                        >
                                            <option value="">
                                                {loadingCategories ? "กำลังโหลด..." : "เลือกหมวดหมู่"}
                                            </option>
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setIsAddingCategory(true)}
                                            className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                                            title="เพิ่มหมวดหมู่ใหม่"
                                        >
                                            <Plus className="w-4 h-4" />
                                            ใหม่
                                        </button>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {editForm.category && `หมวดหมู่ปัจจุบัน: ${editForm.category}`}
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    คำอธิบาย
                                </label>
                                <textarea
                                    value={editForm.description || ""}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent resize-none"
                                    placeholder="อธิบายเกี่ยวกับกลุ่มเอกสารนี้..."
                                />
                            </div>

                            {/* Error message */}
                            {saveError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{saveError}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={saving}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !editForm.name}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white text-sm font-medium rounded-lg hover:bg-[#005f7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        บันทึก
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Variant Modal */}
            {isAddVariantOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/50"
                            onClick={() => !addingVariant && setIsAddVariantOpen(false)}
                        />

                        {/* Modal */}
                        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    เพิ่มรูปแบบเอกสาร
                                </h3>
                                <button
                                    onClick={() => setIsAddVariantOpen(false)}
                                    disabled={addingVariant}
                                    className="p-1 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-4 space-y-4">
                                {/* Template Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        เลือกเทมเพลต <span className="text-red-500">*</span>
                                    </label>
                                    {loadingOrphans ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="w-5 h-5 text-[#007398] animate-spin" />
                                        </div>
                                    ) : orphanTemplates.length > 0 ? (
                                        <select
                                            value={selectedTemplateId}
                                            onChange={(e) => {
                                                setSelectedTemplateId(e.target.value);
                                                const selected = orphanTemplates.find(t => t.id === e.target.value);
                                                if (selected && !variantName) {
                                                    setVariantName(selected.display_name || selected.name || "");
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent"
                                        >
                                            <option value="">เลือกเทมเพลต...</option>
                                            {orphanTemplates.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.display_name || t.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-sm text-gray-500 py-2">
                                            ไม่มีเทมเพลตที่สามารถเพิ่มได้ (ทุกเทมเพลตอยู่ในกลุ่มแล้ว)
                                        </p>
                                    )}
                                </div>

                                {/* Variant Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อรูปแบบ
                                    </label>
                                    <input
                                        type="text"
                                        value={variantName}
                                        onChange={(e) => setVariantName(e.target.value)}
                                        placeholder="เช่น ด้านหน้า, ด้านหลัง, แบบที่ 1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        หากไม่กรอกจะใช้ชื่อเทมเพลตเดิม
                                    </p>
                                </div>

                                {/* Variant Order */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ลำดับการแสดง
                                    </label>
                                    <input
                                        type="number"
                                        value={variantOrder}
                                        onChange={(e) => setVariantOrder(parseInt(e.target.value) || 0)}
                                        min={1}
                                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007398] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                                <button
                                    onClick={() => setIsAddVariantOpen(false)}
                                    disabled={addingVariant}
                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleAddVariant}
                                    disabled={addingVariant || !selectedTemplateId}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white text-sm font-medium rounded-lg hover:bg-[#005f7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addingVariant ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            กำลังเพิ่ม...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            เพิ่มรูปแบบ
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
