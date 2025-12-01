"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/app/components/ui/Button";
import { DocumentPreview } from "@/app/components/ui/DocumentPreview";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TemplatePreviewPage({ params }: PageProps) {
    const { id: templateId } = use(params);
    const [htmlContent, setHtmlContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPreview = async () => {
            try {
                setLoading(true);
                setError(null);

                const html = await apiClient.getHTMLPreview(templateId);
                setHtmlContent(html);
            } catch (err) {
                console.error("Failed to load preview:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load preview"
                );
            } finally {
                setLoading(false);
            }
        };

        if (templateId) {
            loadPreview();
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

    if (error) {
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

                    <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-h3 text-red-800 mb-2">
                            ไม่สามารถโหลดตัวอย่างได้
                        </h1>
                        <p className="text-body-sm text-red-600 mb-4">
                            {error}
                        </p>
                        <Button
                            href={`/forms/${templateId}`}
                            variant="secondary"
                        >
                            กลับไปหน้าเทมเพลต
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-alt">
            {/* Header */}
            <div className="bg-background border-b border-border-default sticky top-0 z-10">
                <div className="container-main py-4">
                    <div className="flex items-center justify-between">
                        <Button
                            href={`/forms/${templateId}`}
                            variant="secondary"
                            size="sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            กลับ
                        </Button>
                        <span className="text-body-sm text-text-muted">
                            ตัวอย่างเอกสาร
                        </span>
                        <Button
                            href={`/forms/${templateId}/fill`}
                            variant="primary"
                            size="sm"
                        >
                            เริ่มกรอกแบบฟอร์ม
                        </Button>
                    </div>
                </div>
            </div>

            {/* Preview Content */}
            <div className="container-main section-padding">
                <div className="max-w-5xl mx-auto">
                    {htmlContent ? (
                        <DocumentPreview
                            htmlContent={htmlContent}
                            title="ตัวอย่างเอกสาร"
                            showHeader={false}
                        />
                    ) : (
                        <div className="bg-background rounded-lg shadow-lg p-8 text-center text-text-muted">
                            ไม่มีตัวอย่างสำหรับเทมเพลตนี้
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
