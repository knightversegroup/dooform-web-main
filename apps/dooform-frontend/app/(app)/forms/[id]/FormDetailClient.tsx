"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    User,
    CheckCircle,
    Sparkles,
    Globe,
    Building2,
    Users,
    Loader2,
    Download,
    Play,
    LogIn,
    Pencil,
    Eye,
    ExternalLink,
    Info,
    Lock,
    Unlock,
    Trash2,
    FileText,
    AlertTriangle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@dooform/shared/api/client";
import { Template, Tier } from "@dooform/shared/api/types";
import { useAuth } from "@dooform/shared/auth/hooks";

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

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function FormDetailClient({ params }: PageProps) {
    const { id: templateId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, isLoading: authLoading, isAdmin, canGenerate, user, refreshQuota } = useAuth();
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllFields, setShowAllFields] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Check for quota error from redirect
    const quotaError = searchParams.get("error") === "no_quota";

    // Refresh quota when page loads (in case admin added quota)
    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            refreshQuota();
        }
    }, [isAuthenticated, authLoading, refreshQuota]);

    // Delete template handler
    const handleDeleteTemplate = async () => {
        if (!template) return;

        const confirmMessage = `คุณต้องการลบ "${template.name}" หรือไม่?\n\nการลบนี้จะไม่สามารถกู้คืนได้`;
        if (!confirm(confirmMessage)) return;

        try {
            setDeleting(true);
            await apiClient.deleteTemplate(templateId);
            // Navigate back to templates page
            if (template.document_type_id) {
                router.push(`/templates/${template.document_type_id}`);
            } else {
                router.push("/templates");
            }
        } catch (err) {
            console.error("Failed to delete template:", err);
            alert(err instanceof Error ? err.message : "ไม่สามารถลบเทมเพลตได้");
            setDeleting(false);
        }
    };

    useEffect(() => {
        const loadTemplate = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get all templates and find the one we need
                const response = await apiClient.getAllTemplates();
                const foundTemplate = response.templates?.find(
                    (t) => t.id === templateId
                );

                if (!foundTemplate) {
                    setError("ไม่พบเทมเพลตที่ต้องการ");
                    return;
                }

                setTemplate(foundTemplate);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-white font-sans flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#000091] animate-spin" />
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="min-h-screen bg-white font-sans">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <h1 className="text-2xl text-gray-900 mb-4">
                        {error || "ไม่พบเทมเพลต"}
                    </h1>
                    <Link
                        href="/templates"
                        className="inline-flex items-center text-[#000091] hover:underline"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับไปหน้ากลุ่มเอกสาร
                    </Link>
                </div>
            </div>
        );
    }

    const placeholders = template.placeholders || [];
    const aliases = template.aliases || {};
    const displayedFields = showAllFields ? placeholders : placeholders.slice(0, 8);

    // Determine back link based on document type
    const backLink = template.document_type_id
        ? `/templates/${template.document_type_id}`
        : "/templates";

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Quota Error Banner */}
            {quotaError && (
                <div className="bg-red-50 border-b border-red-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <div>
                                <p className="text-red-800 font-medium">
                                    คุณไม่มีโควต้าเหลือ
                                </p>
                                <p className="text-red-600 text-sm">
                                    กรุณาติดต่อผู้ดูแลระบบเพื่อขอเพิ่มโควต้า
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm mb-8">
                        <Link href="/" className="text-[#000091] hover:underline">หน้าหลัก</Link>
                        <span className="text-gray-400">/</span>
                        <Link href="/templates" className="text-[#000091] hover:underline">กลุ่มเอกสาร</Link>
                        {template.document_type && (
                            <>
                                <span className="text-gray-400">/</span>
                                <Link
                                    href={`/templates/${template.document_type_id}`}
                                    className="text-[#000091] hover:underline"
                                >
                                    {template.document_type.name}
                                </Link>
                            </>
                        )}
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-600">{template.variant_name || template.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        {/* Left - Content */}
                        <div>
                            <h1 className="text-4xl font-medium text-gray-900 leading-tight mb-4">
                                {template.name}
                            </h1>

                            {template.description && (
                                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                                    {template.description}
                                </p>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 text-sm text-gray-600 mb-8">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    <span>{placeholders.length} ช่องกรอก</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {template.tier === "free" ? (
                                        <Unlock className="w-4 h-4 text-green-600" />
                                    ) : (
                                        <Lock className="w-4 h-4 text-amber-600" />
                                    )}
                                    <span className="capitalize">{template.tier || "Free"}</span>
                                </div>
                                {template.is_verified && (
                                    <div className="flex items-center gap-1.5 text-[#000091]">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>ยืนยันแล้ว</span>
                                    </div>
                                )}
                                {template.is_ai_available && (
                                    <div className="flex items-center gap-1.5 text-purple-600">
                                        <Sparkles className="w-4 h-4" />
                                        <span>รองรับ AI</span>
                                    </div>
                                )}
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex items-center gap-3">
                                {authLoading ? (
                                    <Loader2 className="w-5 h-5 text-[#000091] animate-spin" />
                                ) : isAuthenticated ? (
                                    // Check if user can generate (has quota or is admin)
                                    canGenerate || isAdmin ? (
                                        <Link
                                            href={`/forms/${templateId}/fill`}
                                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#000091] text-white font-medium rounded-sm hover:bg-[#00006b] transition-colors"
                                        >
                                            <Play className="w-5 h-5" />
                                            เริ่มใช้งาน
                                        </Link>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-500 font-medium rounded-sm cursor-not-allowed">
                                            <Lock className="w-5 h-5" />
                                            ไม่มีโควต้า
                                        </div>
                                    )
                                ) : (
                                    <Link
                                        href={`/login?redirect=/forms/${templateId}/fill`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#000091] text-white font-medium rounded-sm hover:bg-[#00006b] transition-colors"
                                    >
                                        <LogIn className="w-5 h-5" />
                                        เข้าสู่ระบบเพื่อใช้งาน
                                    </Link>
                                )}
                                <Link
                                    href={`/forms/${templateId}/preview`}
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-sm hover:bg-gray-50 transition-colors"
                                >
                                    <Eye className="w-5 h-5" />
                                    ดูตัวอย่าง
                                </Link>
                            </div>
                        </div>

                        {/* Right - Preview Image (HD quality) */}
                        <div className="hidden lg:block">
                            <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                                <Image
                                    src={apiClient.getHDThumbnailUrl(templateId, 800)}
                                    alt={template.name}
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
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
                                เกี่ยวกับเทมเพลต
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-700 leading-relaxed">
                                {template.description || `${template.name} เป็นแบบฟอร์มที่ช่วยให้ผู้ใช้สามารถกรอกข้อมูลได้ง่ายและรวดเร็ว`}
                            </p>
                            <dl className="grid grid-cols-2 gap-4 pt-4">
                                {template.type && (
                                    <div>
                                        <dt className="text-sm text-gray-500">ประเภท</dt>
                                        <dd className="text-gray-900 font-medium capitalize">
                                            {template.type === "official" ? "Official" : template.type}
                                        </dd>
                                    </div>
                                )}
                                {template.author && (
                                    <div>
                                        <dt className="text-sm text-gray-500">ผู้สร้าง</dt>
                                        <dd className="text-gray-900">{template.author}</dd>
                                    </div>
                                )}
                                {template.created_at && (
                                    <div>
                                        <dt className="text-sm text-gray-500">วันที่สร้าง</dt>
                                        <dd className="text-gray-900">{formatDate(template.created_at)}</dd>
                                    </div>
                                )}
                                {template.file_size && template.file_size > 0 && (
                                    <div>
                                        <dt className="text-sm text-gray-500">ขนาดไฟล์</dt>
                                        <dd className="text-gray-900">{formatFileSize(template.file_size)}</dd>
                                    </div>
                                )}
                                {template.original_source && (
                                    <div>
                                        <dt className="text-sm text-gray-500">แหล่งที่มา</dt>
                                        <dd className="text-gray-900">{template.original_source}</dd>
                                    </div>
                                )}
                                {template.category && (
                                    <div>
                                        <dt className="text-sm text-gray-500">หมวดหมู่</dt>
                                        <dd className="text-gray-900 capitalize">{template.category}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fields Section */}
            {placeholders.length > 0 && (
                <div className="border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <h2 className="text-2xl font-medium text-gray-900 mb-8">
                            ช่องกรอกข้อมูล ({placeholders.length} รายการ)
                        </h2>

                        <div className="flex flex-wrap gap-2 mb-4">
                            {displayedFields.map((field, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center px-3 py-1.5 rounded-sm text-sm bg-gray-100 text-gray-700 border border-gray-200"
                                >
                                    {aliases[field] || field.replace(/[{}]/g, "")}
                                </span>
                            ))}
                            {placeholders.length > 8 && !showAllFields && (
                                <button
                                    onClick={() => setShowAllFields(true)}
                                    className="inline-flex items-center px-3 py-1.5 rounded-sm text-sm bg-[#000091]/10 text-[#000091] hover:bg-[#000091]/20 transition-colors"
                                >
                                    +{placeholders.length - 8} อื่นๆ
                                </button>
                            )}
                        </div>

                        {showAllFields && placeholders.length > 8 && (
                            <button
                                onClick={() => setShowAllFields(false)}
                                className="text-sm text-[#000091] hover:underline"
                            >
                                แสดงน้อยลง
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Actions Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Action Card */}
                    <div className="bg-white border border-gray-200 rounded-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">การดำเนินการ</h3>
                        <div className="space-y-3">
                            {authLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 text-[#000091] animate-spin" />
                                </div>
                            ) : isAuthenticated ? (
                                <>
                                    {canGenerate || isAdmin ? (
                                        <Link
                                            href={`/forms/${templateId}/fill`}
                                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#000091] text-white text-sm font-medium rounded-sm hover:bg-[#00006b] transition-colors"
                                        >
                                            <Play className="w-4 h-4" />
                                            เริ่มกรอกข้อมูล
                                        </Link>
                                    ) : (
                                        <div className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-300 text-gray-500 text-sm font-medium rounded-sm cursor-not-allowed">
                                            <Lock className="w-4 h-4" />
                                            ไม่มีโควต้า
                                        </div>
                                    )}
                                    <Link
                                        href={`/forms/${templateId}/preview`}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-sm hover:bg-gray-50 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        ดูตัวอย่างเทมเพลต
                                    </Link>
                                    {/* Admin-only actions */}
                                    {isAdmin && (
                                        <>
                                            <Link
                                                href={`/forms/${templateId}/edit`}
                                                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-sm hover:bg-gray-50 transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                แก้ไขข้อมูล
                                            </Link>
                                            <button
                                                onClick={handleDeleteTemplate}
                                                disabled={deleting}
                                                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-red-300 text-red-600 text-sm rounded-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                {deleting ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                {deleting ? "กำลังลบ..." : "ลบเทมเพลต"}
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={`/login?redirect=/forms/${templateId}/fill`}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#000091] text-white text-sm font-medium rounded-sm hover:bg-[#00006b] transition-colors"
                                    >
                                        <LogIn className="w-4 h-4" />
                                        เข้าสู่ระบบเพื่อใช้งาน
                                    </Link>
                                    <Link
                                        href={`/forms/${templateId}/preview`}
                                        className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-sm hover:bg-gray-50 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        ดูตัวอย่างเทมเพลต
                                    </Link>
                                    <p className="text-xs text-gray-500 text-center pt-2">
                                        ยังไม่มีบัญชี?{" "}
                                        <Link
                                            href={`/register?redirect=/forms/${templateId}/fill`}
                                            className="text-[#000091] hover:underline"
                                        >
                                            สมัครสมาชิก
                                        </Link>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Access Card */}
                    <div className="bg-white border border-gray-200 rounded-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">การเข้าถึง</h3>
                        <div className="flex items-start gap-3">
                            {template.tier === "free" ? (
                                <Unlock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                                <div className="text-base font-medium text-gray-900 capitalize">
                                    {template.tier || "Free"}
                                </div>
                                <p className="text-sm text-gray-500">
                                    {template.tier === "free"
                                        ? "ใช้งานได้ฟรีไม่มีค่าใช้จ่าย"
                                        : `ต้องเป็นสมาชิกระดับ ${template.tier}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-white border border-gray-200 rounded-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลเทมเพลต</h3>
                        <dl className="space-y-3 text-sm">
                            {template.author && (
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">{template.author}</span>
                                </div>
                            )}
                            {template.created_at && (
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">{formatDate(template.created_at)}</span>
                                </div>
                            )}
                            {template.file_size && template.file_size > 0 && (
                                <div className="flex items-center gap-2">
                                    <Download className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-600">{formatFileSize(template.file_size)}</span>
                                </div>
                            )}
                            {template.type && (
                                <div className="flex items-center gap-2">
                                    {template.type === "official" ? (
                                        <Globe className="w-4 h-4 text-gray-400" />
                                    ) : template.type === "private" ? (
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <Users className="w-4 h-4 text-gray-400" />
                                    )}
                                    <span className="text-gray-600 capitalize">{template.type}</span>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </div>

            {/* Back Link */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <Link
                    href={backLink}
                    className="inline-flex items-center text-[#000091] hover:underline"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    กลับไปหน้า{template.document_type ? template.document_type.name : "กลุ่มเอกสาร"}
                </Link>
            </div>
        </div>
    );
}
