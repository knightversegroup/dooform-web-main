"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Sparkles,
    Loader2,
    Play,
    LogIn,
    Eye,
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
import { DocumentType, Template, DocumentTypeUpdateRequest, FilterCategory } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/context";

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

// Template Card Component
function TemplateCard({
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
    const handleDelete = () => {
        if (!onDelete) return;
        if (confirm(`คุณต้องการลบ "${template.variant_name || template.name}" หรือไม่?`)) {
            onDelete(template.id);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-sm hover:border-gray-300 hover:shadow-sm transition-all p-6">
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-medium text-gray-900">
                    {template.variant_name || template.name || `รูปแบบ ${index + 1}`}
                </h3>
                {template.is_verified && (
                    <CheckCircle className="w-4 h-4 text-[#000091]" />
                )}
                {template.is_ai_available && (
                    <Sparkles className="w-4 h-4 text-purple-500" />
                )}
            </div>

            {template.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {template.description}
                </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>{(template.placeholders?.length || 0)} ช่องกรอก</span>
                </div>
                <div className="flex items-center gap-1.5">
                    {template.tier === "free" ? (
                        <Unlock className="w-4 h-4 text-green-600" />
                    ) : (
                        <Lock className="w-4 h-4 text-amber-600" />
                    )}
                    <span className="capitalize">{template.tier || "Free"}</span>
                </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2">
                {authLoading ? (
                    <Loader2 className="w-5 h-5 text-[#000091] animate-spin" />
                ) : isAuthenticated ? (
                    <Link
                        href={`/forms/${template.id}/fill`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-[#000091] text-white rounded-sm hover:bg-[#00006b] transition-colors"
                    >
                        <Play className="w-4 h-4" />
                        เริ่มใช้งาน
                    </Link>
                ) : (
                    <Link
                        href={`/login?redirect=/forms/${template.id}/fill`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-[#000091] text-white rounded-sm hover:bg-[#00006b] transition-colors"
                    >
                        <LogIn className="w-4 h-4" />
                        เข้าสู่ระบบ
                    </Link>
                )}
                <Link
                    href={`/forms/${template.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors"
                >
                    ดูรายละเอียด
                    <ArrowRight className="w-4 h-4" />
                </Link>
                {isAuthenticated && onDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50 ml-auto"
                    >
                        {deleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Trash2 className="w-4 h-4" />
                        )}
                    </button>
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

    // Edit modal state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<DocumentTypeUpdateRequest>({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Category state
    const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
    const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({});
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

    // Fetch orphan templates
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

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const filtersData = await apiClient.getFilters();
            const categoryFilter = filtersData.find((f: FilterCategory) => f.field_name === "category");
            if (categoryFilter?.options) {
                const options = categoryFilter.options
                    .filter((opt) => opt.is_active)
                    .map((opt) => ({ value: opt.value, label: opt.label }));
                setCategories(options);
                const labels: Record<string, string> = {};
                categoryFilter.options.forEach((opt) => {
                    labels[opt.value] = opt.label;
                });
                setCategoryLabels(labels);
            }
        } catch (err) {
            console.error("Failed to fetch categories:", err);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Open edit modal
    const openEditModal = () => {
        if (documentType) {
            setEditForm({
                name: documentType.name,
                name_en: documentType.name_en || "",
                description: documentType.description || "",
                original_source: documentType.original_source || "",
                category: documentType.category,
                code: documentType.code,
            });
            setSaveError(null);
            setIsEditOpen(true);
            fetchCategories();
        }
    };

    // Add new category
    const handleAddCategory = () => {
        if (newCategory.trim()) {
            const categoryValue = newCategory.trim().toLowerCase().replace(/\s+/g, "_");
            const categoryLabel = newCategory.trim();
            setEditForm({ ...editForm, category: categoryValue });
            setCategories(prev => [...prev, { value: categoryValue, label: categoryLabel }]);
            setCategoryLabels(prev => ({ ...prev, [categoryValue]: categoryLabel }));
            setIsAddingCategory(false);
            setNewCategory("");
        }
    };

    // Save document type
    const handleSave = async () => {
        if (!documentType) return;
        try {
            setSaving(true);
            setSaveError(null);
            const updatedDocType = await apiClient.updateDocumentType(documentType.id, editForm);
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
                const [docType, filtersData] = await Promise.all([
                    apiClient.getDocumentType(documentTypeId, true),
                    apiClient.getFilters().catch(() => [] as FilterCategory[]),
                ]);
                setDocumentType(docType);
                const categoryFilter = filtersData.find((f: FilterCategory) => f.field_name === "category");
                if (categoryFilter?.options) {
                    const labels: Record<string, string> = {};
                    categoryFilter.options.forEach((opt) => {
                        labels[opt.value] = opt.label;
                    });
                    setCategoryLabels(labels);
                }
            } catch (err) {
                console.error("Failed to load document type:", err);
                setError(err instanceof Error ? err.message : "Failed to load document type");
            } finally {
                setLoading(false);
            }
        };
        if (documentTypeId) loadDocumentType();
    }, [documentTypeId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white font-sans flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#000091] animate-spin" />
            </div>
        );
    }

    if (error || !documentType) {
        return (
            <div className="min-h-screen bg-white font-sans">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <h1 className="text-2xl text-gray-900 mb-4">{error || "ไม่พบกลุ่มเอกสาร"}</h1>
                    <Link href="/templates" className="inline-flex items-center text-[#000091] hover:underline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับไปหน้ารายการ
                    </Link>
                </div>
            </div>
        );
    }

    const templates = documentType.templates || [];
    const totalPlaceholders = templates.reduce((sum, t) => sum + (t.placeholders?.length || 0), 0);
    const tierCounts = templates.reduce((acc, t) => {
        const tier = t.tier || "free";
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const mostCommonTier = Object.entries(tierCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "free";

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Hero Section */}
            <div className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm mb-8">
                        <Link href="/" className="text-[#000091] hover:underline">หน้าหลัก</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/templates" className="text-[#000091] hover:underline">กลุ่มเอกสาร</Link>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{documentType.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Left - Content */}
                        <div>
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <h1 className="text-4xl font-medium text-gray-900 leading-tight">
                                    {documentType.name}
                                </h1>
                                {isAuthenticated && (
                                    <button
                                        onClick={openEditModal}
                                        className="p-2 text-gray-400 hover:text-[#000091] hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {documentType.name_en && (
                                <p className="text-xl text-gray-500 mb-6">{documentType.name_en}</p>
                            )}

                            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                                {documentType.description || `${documentType.name} เป็นกลุ่มเอกสารที่รวบรวมแบบฟอร์มที่เกี่ยวข้องเข้าด้วยกัน`}
                            </p>

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm text-gray-600 mb-8">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>{templates.length} รูปแบบ</span>
                                </div>
                                {totalPlaceholders > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span>{totalPlaceholders} ช่องกรอก</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    {mostCommonTier === "free" ? (
                                        <Unlock className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-amber-600" />
                                    )}
                                    <span className="capitalize">{mostCommonTier}</span>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex items-center gap-3">
                                {templates.length > 0 && (
                                    <>
                                        {authLoading ? (
                                            <Loader2 className="w-5 h-5 text-[#000091] animate-spin" />
                                        ) : isAuthenticated ? (
                                            <Link
                                                href={`/forms/${templates[0].id}/fill`}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#000091] text-white font-medium rounded-sm hover:bg-[#00006b] transition-colors"
                                            >
                                                <Play className="w-5 h-5" />
                                                เริ่มใช้งาน
                                            </Link>
                                        ) : (
                                            <Link
                                                href={`/login?redirect=/forms/${templates[0].id}/fill`}
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#000091] text-white font-medium rounded-sm hover:bg-[#00006b] transition-colors"
                                            >
                                                <LogIn className="w-5 h-5" />
                                                เข้าสู่ระบบเพื่อใช้งาน
                                            </Link>
                                        )}
                                        <a
                                            href="#templates"
                                            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-sm hover:bg-gray-50 transition-colors"
                                        >
                                            ดูรูปแบบทั้งหมด
                                            <ArrowRight className="w-5 h-5" />
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right - Preview Image (HD quality for detail page) */}
                        <div className="hidden lg:block">
                            {templates.length > 0 && (
                                <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                                    <Image
                                        src={apiClient.getHDThumbnailUrl(templates[0].id, 800)}
                                        alt={documentType.name}
                                        fill
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div>
                            <h2 className="text-3xl font-medium text-[#000091] leading-tight">
                                เกี่ยวกับกลุ่มเอกสาร
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-700 leading-relaxed">
                                {documentType.description || `${documentType.name} เป็นกลุ่มเอกสารที่รวบรวมแบบฟอร์มที่เกี่ยวข้องเข้าด้วยกัน เพื่อให้ผู้ใช้สามารถเลือกรูปแบบที่เหมาะสมกับความต้องการได้ง่ายขึ้น`}
                            </p>
                            <dl className="grid grid-cols-2 gap-4 pt-4">
                                {documentType.category && (
                                    <div>
                                        <dt className="text-sm text-gray-500">หมวดหมู่</dt>
                                        <dd className="text-gray-900 font-medium">
                                            {categoryLabels[documentType.category] || documentType.category}
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm text-gray-500">จำนวนรูปแบบ</dt>
                                    <dd className="text-gray-900 font-medium">{templates.length} รูปแบบ</dd>
                                </div>
                                {documentType.created_at && (
                                    <div>
                                        <dt className="text-sm text-gray-500">วันที่สร้าง</dt>
                                        <dd className="text-gray-900">{formatDate(documentType.created_at)}</dd>
                                    </div>
                                )}
                                {documentType.original_source && (
                                    <div>
                                        <dt className="text-sm text-gray-500">แหล่งที่มา</dt>
                                        <dd className="text-gray-900">{documentType.original_source}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Templates Section */}
            <div id="templates" className="scroll-mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-medium text-gray-900">
                            รูปแบบเอกสาร ({templates.length})
                        </h2>
                        {isAuthenticated && (
                            <button
                                onClick={openAddVariantModal}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#000091] text-white text-sm rounded-sm hover:bg-[#00006b] transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                เพิ่มรูปแบบ
                            </button>
                        )}
                    </div>

                    {templates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates
                                .sort((a, b) => (a.variant_order || 0) - (b.variant_order || 0))
                                .map((template, idx) => (
                                    <TemplateCard
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
                        <div className="text-center py-16 bg-gray-50 rounded-lg">
                            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">ยังไม่มีรูปแบบเอกสารในกลุ่มนี้</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsEditOpen(false)} />
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">แก้ไขข้อมูลกลุ่มเอกสาร</h2>
                            <button onClick={() => setIsEditOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อกลุ่มเอกสาร (ภาษาไทย) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editForm.name || ""}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ (ภาษาอังกฤษ)</label>
                                <input
                                    type="text"
                                    value={editForm.name_en || ""}
                                    onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">รหัส (Code)</label>
                                <input
                                    type="text"
                                    value={editForm.code || ""}
                                    onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#000091] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                                {isAddingCategory ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091]"
                                            autoFocus
                                        />
                                        <button onClick={handleAddCategory} disabled={!newCategory.trim()} className="px-3 py-2 bg-[#000091] text-white text-sm rounded-sm hover:bg-[#00006b] disabled:opacity-50">
                                            เพิ่ม
                                        </button>
                                        <button onClick={() => { setIsAddingCategory(false); setNewCategory(""); }} className="px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-sm hover:bg-gray-50">
                                            ยกเลิก
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select
                                            value={editForm.category || ""}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091]"
                                            disabled={loadingCategories}
                                        >
                                            <option value="">{loadingCategories ? "กำลังโหลด..." : "เลือกหมวดหมู่"}</option>
                                            {categories.map((cat) => (
                                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <button onClick={() => setIsAddingCategory(true)} className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-600 text-sm rounded-sm hover:bg-gray-50">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                                <textarea
                                    value={editForm.description || ""}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091] resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">แหล่งที่มา</label>
                                <input
                                    type="text"
                                    value={editForm.original_source || ""}
                                    onChange={(e) => setEditForm({ ...editForm, original_source: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091]"
                                />
                            </div>
                            {saveError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
                                    <p className="text-sm text-red-600">{saveError}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                            <button onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-sm" disabled={saving}>
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !editForm.name}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#000091] text-white text-sm font-medium rounded-sm hover:bg-[#00006b] disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? "กำลังบันทึก..." : "บันทึก"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Variant Modal */}
            {isAddVariantOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => !addingVariant && setIsAddVariantOpen(false)} />
                    <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">เพิ่มรูปแบบเอกสาร</h3>
                            <button onClick={() => setIsAddVariantOpen(false)} disabled={addingVariant} className="p-1 text-gray-500 hover:bg-gray-100 rounded-sm disabled:opacity-50">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เลือกเทมเพลต <span className="text-red-500">*</span>
                                </label>
                                {loadingOrphans ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 text-[#000091] animate-spin" />
                                    </div>
                                ) : orphanTemplates.length > 0 ? (
                                    <select
                                        value={selectedTemplateId}
                                        onChange={(e) => {
                                            setSelectedTemplateId(e.target.value);
                                            const selected = orphanTemplates.find(t => t.id === e.target.value);
                                            if (selected && !variantName) setVariantName(selected.name || "");
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091]"
                                    >
                                        <option value="">เลือกเทมเพลต...</option>
                                        {orphanTemplates.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-sm text-gray-500 py-2">ไม่มีเทมเพลตที่สามารถเพิ่มได้</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อรูปแบบ</label>
                                <input
                                    type="text"
                                    value={variantName}
                                    onChange={(e) => setVariantName(e.target.value)}
                                    placeholder="เช่น ด้านหน้า, ด้านหลัง"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับ</label>
                                <input
                                    type="number"
                                    value={variantOrder}
                                    onChange={(e) => setVariantOrder(parseInt(e.target.value) || 0)}
                                    min={1}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#000091]"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                            <button onClick={() => setIsAddVariantOpen(false)} disabled={addingVariant} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-sm disabled:opacity-50">
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleAddVariant}
                                disabled={addingVariant || !selectedTemplateId}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#000091] text-white text-sm font-medium rounded-sm hover:bg-[#00006b] disabled:opacity-50"
                            >
                                {addingVariant ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                {addingVariant ? "กำลังเพิ่ม..." : "เพิ่มรูปแบบ"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
