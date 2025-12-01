"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    FileText,
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
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Template, TemplateType, Tier } from "@/lib/api/types";
import { Button } from "@/app/components/ui/Button";
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

// Get type info
function getTypeInfo(type: TemplateType) {
    switch (type) {
        case "official":
            return {
                icon: Globe,
                label: "Official",
                bgClass: "bg-primary/10 text-primary",
            };
        case "private":
            return {
                icon: Building2,
                label: "Private",
                bgClass:
                    "bg-surface-alt text-text-muted border border-border-default",
            };
        case "community":
            return {
                icon: Users,
                label: "Community",
                bgClass:
                    "bg-surface-alt text-text-muted border border-border-default",
            };
        default:
            return {
                icon: Globe,
                label: type || "Unknown",
                bgClass:
                    "bg-surface-alt text-text-muted border border-border-default",
            };
    }
}

// Get tier styling
function getTierClass(tier: Tier) {
    switch (tier) {
        case "enterprise":
            return "bg-primary text-white";
        case "premium":
            return "bg-primary/80 text-white";
        case "basic":
            return "bg-surface-alt text-text-default border border-border-default";
        case "free":
        default:
            return "bg-surface-alt text-text-muted border border-border-default";
    }
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TemplateDetailPage({ params }: PageProps) {
    const { id: templateId } = use(params);
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [template, setTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            <div className="min-h-screen bg-background">
                <div className="container-main section-padding">
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !template) {
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

    const placeholders = parsePlaceholders(template.placeholders);
    const aliases = parseAliases(template.aliases);
    const typeInfo = getTypeInfo(template.type);
    const TypeIcon = typeInfo.icon;

    return (
        <div className="min-h-screen bg-background">
            <div className="container-main section-padding">
                {/* Back button */}
                <div className="mb-6">
                    <Button href="/forms" variant="secondary" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับ
                    </Button>
                </div>

                {/* Main content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left - Template Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header */}
                        <div className="bg-background border border-border-default rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-7 h-7 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-h2 text-foreground flex items-center gap-2 flex-wrap">
                                        {template.display_name ||
                                            template.name ||
                                            template.filename}
                                        {template.is_verified && (
                                            <CheckCircle className="w-5 h-5 text-blue-500" />
                                        )}
                                        {template.is_ai_available && (
                                            <Sparkles className="w-5 h-5 text-purple-500" />
                                        )}
                                    </h1>
                                    {template.description && (
                                        <p className="text-body text-text-muted mt-2">
                                            {template.description}
                                        </p>
                                    )}

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {template.category && (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-body-sm font-medium bg-primary/10 text-primary">
                                                {template.category}
                                            </span>
                                        )}
                                        {template.type && (
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium ${typeInfo.bgClass}`}
                                            >
                                                <TypeIcon className="w-4 h-4" />
                                                {typeInfo.label}
                                            </span>
                                        )}
                                        {template.tier && (
                                            <span
                                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-body-sm font-medium ${getTierClass(
                                                    template.tier
                                                )}`}
                                            >
                                                {template.tier
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    template.tier.slice(1)}
                                            </span>
                                        )}
                                        {template.group && (
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-body-sm font-medium bg-surface-alt text-text-muted border border-border-default">
                                                กลุ่ม: {template.group}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Placeholders */}
                        <div className="bg-background border border-border-default rounded-lg p-6">
                            <h2 className="text-h3 text-foreground mb-4">
                                ช่องกรอกข้อมูล ({placeholders.length} รายการ)
                            </h2>
                            {placeholders.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {placeholders.map((placeholder, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg"
                                        >
                                            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary text-body-sm font-semibold">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-body-sm font-medium text-foreground truncate">
                                                    {aliases[placeholder] ||
                                                        placeholder}
                                                </div>
                                                {aliases[placeholder] && (
                                                    <div className="text-caption text-text-muted font-mono truncate">
                                                        {placeholder}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-body-sm text-text-muted">
                                    ไม่พบช่องกรอกข้อมูลในเทมเพลตนี้
                                </p>
                            )}
                        </div>

                        {/* Additional Info */}
                        {(template.remarks || template.original_source) && (
                            <div className="bg-background border border-border-default rounded-lg p-6">
                                <h2 className="text-h3 text-foreground mb-4">
                                    ข้อมูลเพิ่มเติม
                                </h2>
                                <div className="space-y-4">
                                    {template.original_source && (
                                        <div>
                                            <div className="text-body-sm font-medium text-foreground mb-1">
                                                แหล่งที่มา
                                            </div>
                                            <div className="text-body-sm text-text-muted">
                                                {template.original_source}
                                            </div>
                                        </div>
                                    )}
                                    {template.remarks && (
                                        <div>
                                            <div className="text-body-sm font-medium text-foreground mb-1">
                                                หมายเหตุ
                                            </div>
                                            <div className="text-body-sm text-text-muted">
                                                {template.remarks}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right - Actions & Meta */}
                    <div className="space-y-6">
                        {/* Actions */}
                        <div className="bg-background border border-border-default rounded-lg p-6">
                            <h2 className="text-h4 text-foreground mb-4">
                                การดำเนินการ
                            </h2>
                            <div className="space-y-3">
                                {authLoading ? (
                                    <div className="flex items-center justify-center py-2">
                                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                    </div>
                                ) : isAuthenticated ? (
                                    <Button
                                        href={`/forms/${templateId}/fill`}
                                        variant="primary"
                                        className="w-full justify-center"
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        เริ่มกรอกแบบฟอร์ม
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            href={`/login?redirect=/forms/${templateId}/fill`}
                                            variant="primary"
                                            className="w-full justify-center"
                                        >
                                            <LogIn className="w-4 h-4 mr-2" />
                                            เข้าสู่ระบบเพื่อกรอกแบบฟอร์ม
                                        </Button>
                                        <p className="text-caption text-text-muted text-center">
                                            ยังไม่มีบัญชี?{" "}
                                            <Link
                                                href={`/register?redirect=/forms/${templateId}/fill`}
                                                className="text-primary hover:underline"
                                            >
                                                สมัครสมาชิก
                                            </Link>
                                        </p>
                                    </>
                                )}
                                {template.gcs_path_html && (
                                    <Button
                                        href={`/forms/${templateId}/preview`}
                                        variant="secondary"
                                        className="w-full justify-center"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        ดูตัวอย่าง
                                    </Button>
                                )}
                                {isAuthenticated && (
                                    <Button
                                        href={`/forms/${templateId}/edit`}
                                        variant="secondary"
                                        className="w-full justify-center"
                                    >
                                        <Pencil className="w-4 h-4 mr-2" />
                                        แก้ไขรายละเอียด
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div className="bg-background border border-border-default rounded-lg p-6">
                            <h2 className="text-h4 text-foreground mb-4">
                                ข้อมูลเทมเพลต
                            </h2>
                            <div className="space-y-4">
                                {template.author && (
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-text-muted flex-shrink-0" />
                                        <div>
                                            <div className="text-caption text-text-muted">
                                                ผู้สร้าง
                                            </div>
                                            <div className="text-body-sm text-foreground">
                                                {template.author}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {template.created_at && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-text-muted flex-shrink-0" />
                                        <div>
                                            <div className="text-caption text-text-muted">
                                                วันที่สร้าง
                                            </div>
                                            <div className="text-body-sm text-foreground">
                                                {formatDate(template.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {template.updated_at && (
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-text-muted flex-shrink-0" />
                                        <div>
                                            <div className="text-caption text-text-muted">
                                                อัปเดตล่าสุด
                                            </div>
                                            <div className="text-body-sm text-foreground">
                                                {formatDate(template.updated_at)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {template.file_size > 0 && (
                                    <div className="flex items-center gap-3">
                                        <Download className="w-5 h-5 text-text-muted flex-shrink-0" />
                                        <div>
                                            <div className="text-caption text-text-muted">
                                                ขนาดไฟล์
                                            </div>
                                            <div className="text-body-sm text-foreground">
                                                {formatFileSize(template.file_size)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
