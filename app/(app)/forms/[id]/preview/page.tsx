"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2, AlertCircle, FileText } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TemplatePreviewPage({ params }: PageProps) {
    const { id: templateId } = use(params);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (templateId) {
            // Get PDF preview URL directly - the backend will generate on-the-fly if needed
            const url = apiClient.getPDFPreviewUrl(templateId);
            setPdfUrl(url);
            setLoading(false);
        }
    }, [templateId]);

    const handleIframeError = () => {
        setError("ไม่สามารถโหลด PDF ได้ กรุณาลองใหม่อีกครั้ง");
    };

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
                            ตัวอย่างเอกสาร (PDF)
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

            {/* PDF Preview Content */}
            <div className="container-main section-padding">
                <div className="max-w-5xl mx-auto">
                    {pdfUrl ? (
                        <div className="bg-background rounded-lg shadow-lg overflow-hidden">
                            {/* PDF Viewer using iframe */}
                            <iframe
                                src={`${pdfUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                                className="w-full border-0"
                                style={{ height: "calc(100vh - 180px)", minHeight: "600px" }}
                                title="PDF Preview"
                            />
                        </div>
                    ) : (
                        <div className="bg-background rounded-lg shadow-lg p-8 text-center text-text-muted">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                            <p>ไม่มีตัวอย่าง PDF สำหรับเทมเพลตนี้</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
