"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
    ArrowLeft,
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
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Template, Tier } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/context";

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

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function FormDetailClient({ params }: PageProps) {
    const { id: templateId } = use(params);
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"about" | "fields">("about");
    const [showAllFields, setShowAllFields] = useState(false);

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
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-[#007398] animate-spin" />
                </div>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 py-24 text-center">
                    <h1 className="text-2xl font-light text-gray-900 mb-4">
                        {error || "ไม่พบเทมเพลต"}
                    </h1>
                    <Link
                        href="/templates"
                        className="inline-flex items-center text-[#007398] hover:underline"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับไปหน้ากลุ่มเอกสาร
                    </Link>
                </div>
            </div>
        );
    }

    const placeholders = parsePlaceholders(template.placeholders);
    const aliases = parseAliases(template.aliases);
    const headerBgColor = getHeaderBgColor(template.category || template.document_type?.category || "other");
    const displayedFields = showAllFields ? placeholders : placeholders.slice(0, 8);

    // Determine back link based on document type
    const backLink = template.document_type_id
        ? `/templates/${template.document_type_id}`
        : "/forms";
    const backLinkText = template.document_type_id
        ? `← กลับไปหน้ากลุ่มเอกสาร`
        : "← กลับไปหน้าเทมเพลต";

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                    <Link
                        href={backLink}
                        className="text-sm text-gray-600 hover:text-[#007398]"
                    >
                        {backLinkText}
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
                        {/* Template Info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl md:text-3xl font-light text-white leading-tight mb-2">
                                {template.display_name ||
                                    template.name ||
                                    template.filename}
                            </h1>

                            {/* Tags/Badges */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {template.is_verified && (
                                    <span className="inline-flex items-center gap-1 text-white/90 text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        ยืนยันแล้ว
                                    </span>
                                )}
                                {template.is_ai_available && (
                                    <span className="inline-flex items-center gap-1 text-white/90 text-sm">
                                        <Sparkles className="w-4 h-4" />
                                        รองรับ AI
                                    </span>
                                )}
                                {template.tier === "free" && (
                                    <span className="inline-flex items-center gap-1 text-white/90 text-sm">
                                        <Unlock className="w-4 h-4" />
                                        ใช้งานฟรี
                                    </span>
                                )}
                            </div>

                            {/* Short description */}
                            {template.description && (
                                <p className="text-white/80 text-sm max-w-2xl">
                                    {template.description}
                                </p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="hidden lg:flex items-center gap-8 text-white">
                            <div className="text-center">
                                <div className="text-3xl font-light">
                                    {placeholders.length}
                                </div>
                                <div className="text-sm text-white/70">ช่องกรอก</div>
                            </div>
                            <div className="w-px h-12 bg-white/30" />
                            <div className="text-center">
                                <div className="text-3xl font-light capitalize">
                                    {template.tier || "Free"}
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
                                onClick={() => setActiveTab("fields")}
                                className={`px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === "fields"
                                        ? "border-[#007398] text-[#007398]"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                ช่องกรอก ({placeholders.length})
                            </button>
                            {template.gcs_path_html && (
                                <Link
                                    href={`/forms/${templateId}/preview`}
                                    className="px-4 py-4 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
                                >
                                    ดูตัวอย่าง
                                    <ExternalLink className="w-3 h-3" />
                                </Link>
                            )}
                        </div>

                        {/* Right - Actions */}
                        <div className="flex items-center gap-2">
                            {authLoading ? (
                                <div className="py-2 px-4">
                                    <Loader2 className="w-5 h-5 text-[#007398] animate-spin" />
                                </div>
                            ) : isAuthenticated ? (
                                <Link
                                    href={`/forms/${templateId}/fill`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white text-sm font-medium rounded hover:bg-[#005f7a] transition-colors"
                                >
                                    <Play className="w-4 h-4" />
                                    เริ่มกรอกข้อมูล
                                </Link>
                            ) : (
                                <Link
                                    href={`/login?redirect=/forms/${templateId}/fill`}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white text-sm font-medium rounded hover:bg-[#005f7a] transition-colors"
                                >
                                    <LogIn className="w-4 h-4" />
                                    เข้าสู่ระบบเพื่อใช้งาน
                                </Link>
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
                                    เกี่ยวกับเทมเพลต
                                </h2>

                                {template.description ? (
                                    <div className="prose prose-sm max-w-none text-gray-700 mb-6">
                                        <p>{template.description}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm mb-6">
                                        ไม่มีคำอธิบายสำหรับเทมเพลตนี้
                                    </p>
                                )}

                                {/* Quick Info */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-1">
                                        ข้อมูลเบื้องต้น
                                        <Info className="w-4 h-4 text-gray-400" />
                                    </h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        {template.category && (
                                            <div>
                                                <dt className="text-gray-500">หมวดหมู่</dt>
                                                <dd className="text-gray-900 font-medium">
                                                    {template.category}
                                                </dd>
                                            </div>
                                        )}
                                        {template.type && (
                                            <div>
                                                <dt className="text-gray-500">ประเภท</dt>
                                                <dd className="text-gray-900 font-medium capitalize">
                                                    {template.type}
                                                </dd>
                                            </div>
                                        )}
                                        {template.author && (
                                            <div>
                                                <dt className="text-gray-500">ผู้สร้าง</dt>
                                                <dd className="text-gray-900">{template.author}</dd>
                                            </div>
                                        )}
                                        {template.original_source && (
                                            <div>
                                                <dt className="text-gray-500">แหล่งที่มา</dt>
                                                <dd className="text-gray-900">
                                                    {template.original_source}
                                                </dd>
                                            </div>
                                        )}
                                        {template.created_at && (
                                            <div>
                                                <dt className="text-gray-500">วันที่สร้าง</dt>
                                                <dd className="text-gray-900">
                                                    {formatDate(template.created_at)}
                                                </dd>
                                            </div>
                                        )}
                                        {template.file_size > 0 && (
                                            <div>
                                                <dt className="text-gray-500">ขนาดไฟล์</dt>
                                                <dd className="text-gray-900">
                                                    {formatFileSize(template.file_size)}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>

                                {/* Fields Preview */}
                                {placeholders.length > 0 && (
                                    <div className="border-t border-gray-200 pt-6 mt-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                                            ช่องกรอกข้อมูล ({placeholders.length} รายการ)
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {displayedFields.map((field, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center px-2.5 py-1 rounded text-xs bg-gray-100 text-gray-700"
                                                >
                                                    {aliases[field] || field.replace(/[{}]/g, "")}
                                                </span>
                                            ))}
                                            {placeholders.length > 8 && !showAllFields && (
                                                <button
                                                    onClick={() => setShowAllFields(true)}
                                                    className="inline-flex items-center px-2.5 py-1 rounded text-xs bg-[#007398]/10 text-[#007398] hover:bg-[#007398]/20"
                                                >
                                                    +{placeholders.length - 8} อื่นๆ
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setActiveTab("fields")}
                                            className="mt-3 text-sm text-[#007398] hover:underline"
                                        >
                                            ดูรายละเอียดช่องกรอกทั้งหมด →
                                        </button>
                                    </div>
                                )}

                                {/* Remarks */}
                                {template.remarks && (
                                    <div className="border-t border-gray-200 pt-6 mt-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                                            หมายเหตุ
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {template.remarks}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "fields" && (
                            <div className="bg-white rounded-lg border border-gray-200 p-6">
                                <h2 className="text-xl font-medium text-gray-900 mb-4">
                                    ช่องกรอกข้อมูล ({placeholders.length} รายการ)
                                </h2>

                                {placeholders.length > 0 ? (
                                    <div className="space-y-2">
                                        {placeholders.map((placeholder, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="w-8 h-8 bg-[#007398]/10 rounded flex items-center justify-center text-[#007398] text-sm font-medium flex-shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {aliases[placeholder] ||
                                                            placeholder.replace(/[{}]/g, "")}
                                                    </div>
                                                    {aliases[placeholder] && (
                                                        <div className="text-xs text-gray-500 font-mono">
                                                            {placeholder}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">
                                        ไม่พบช่องกรอกข้อมูลในเทมเพลตนี้
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Sidebar */}
                    <div className="w-72 flex-shrink-0 hidden lg:block">
                        {/* Actions Card */}
                        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                การดำเนินการ
                            </h3>
                            <div className="space-y-3">
                                {authLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 text-[#007398] animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Fill form button - requires login */}
                                        {isAuthenticated ? (
                                            <Link
                                                href={`/forms/${templateId}/fill`}
                                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#007398] text-white text-sm font-medium rounded hover:bg-[#005f7a] transition-colors"
                                            >
                                                <Play className="w-4 h-4" />
                                                เริ่มกรอกข้อมูล
                                            </Link>
                                        ) : (
                                            <Link
                                                href={`/login?redirect=/forms/${templateId}/fill`}
                                                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#007398] text-white text-sm font-medium rounded hover:bg-[#005f7a] transition-colors"
                                            >
                                                <LogIn className="w-4 h-4" />
                                                เข้าสู่ระบบเพื่อใช้งาน
                                            </Link>
                                        )}

                                        {/* Preview button - public access */}
                                        {template.gcs_path_html && (
                                            <Link
                                                href={`/forms/${templateId}/preview`}
                                                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                ดูตัวอย่างเทมเพลต
                                            </Link>
                                        )}

                                        {/* Edit button - only for authenticated users */}
                                        {isAuthenticated && (
                                            <Link
                                                href={`/forms/${templateId}/edit`}
                                                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors"
                                            >
                                                <Pencil className="w-4 h-4" />
                                                แก้ไขข้อมูล
                                            </Link>
                                        )}

                                        {/* Register prompt for non-authenticated users */}
                                        {!isAuthenticated && (
                                            <p className="text-xs text-gray-500 text-center">
                                                ยังไม่มีบัญชี?{" "}
                                                <Link
                                                    href={`/register?redirect=/forms/${templateId}/fill`}
                                                    className="text-[#007398] hover:underline"
                                                >
                                                    สมัครสมาชิก
                                                </Link>
                                            </p>
                                        )}
                                    </>
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
                                    {template.tier === "free" ? (
                                        <Unlock className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                    )}
                                    <div>
                                        <div className="text-sm font-medium text-gray-900 capitalize">
                                            {template.tier || "Free"}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {template.tier === "free"
                                                ? "ใช้งานได้ฟรีไม่มีค่าใช้จ่าย"
                                                : `ต้องเป็นสมาชิกระดับ ${template.tier}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Template Info */}
                        <div className="bg-white rounded-lg border border-gray-200 p-5">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                ข้อมูลเทมเพลต
                            </h3>
                            <dl className="space-y-3 text-sm">
                                {template.author && (
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">
                                            {template.author}
                                        </span>
                                    </div>
                                )}
                                {template.created_at && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">
                                            {formatDate(template.created_at)}
                                        </span>
                                    </div>
                                )}
                                {template.file_size > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Download className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-600">
                                            {formatFileSize(template.file_size)}
                                        </span>
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
                                        <span className="text-gray-600 capitalize">
                                            {template.type}
                                        </span>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
