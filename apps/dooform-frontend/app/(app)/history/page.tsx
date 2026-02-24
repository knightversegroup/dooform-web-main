"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    History,
    Download,
    FileText,
    ChevronLeft,
    ChevronRight,
    Eye,
    Calendar,
    X,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { apiClient } from "@dooform/shared/api/client";
import { useAuth } from "@dooform/shared/auth/hooks";
import { Button } from "@dooform/shared";

interface DocumentHistory {
    id: string;
    template_id: string;
    user_id: string;
    filename: string;
    gcs_path_docx: string;
    gcs_path_pdf: string;
    file_size: number;
    mime_type: string;
    data: string;
    status: string;
    created_at: string;
    updated_at: string;
    template?: {
        id: string;
        name: string;
        description: string;
        placeholders: string[];
        aliases: Record<string, string>;
    };
}

interface HistoryResponse {
    documents: DocumentHistory[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export default function HistoryPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [documents, setDocuments] = useState<DocumentHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedDocument, setSelectedDocument] = useState<DocumentHistory | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [regenerating, setRegenerating] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login?redirect=/history");
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            loadHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, authLoading, isAuthenticated]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<HistoryResponse>(
                `/api/v1/documents/history?page=${page}&limit=${limit}`
            );
            setDocuments(response.data.documents || []);
            setTotalPages(response.data.pagination?.pages || 1);
            setTotal(response.data.pagination?.total || 0);
        } catch (err) {
            console.error("Failed to load history:", err);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (doc: DocumentHistory, format: "docx" | "pdf") => {
        try {
            setDownloading(`${doc.id}-${format}`);
            const blob = await apiClient.downloadDocument(doc.id, format);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const extension = format === "pdf" ? ".pdf" : ".docx";
            const baseName = doc.filename.replace(/\.(docx|pdf)$/i, "");
            a.download = `${baseName}${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Failed to download:", err);
            alert("ไม่สามารถดาวน์โหลดไฟล์ได้ ไฟล์อาจหมดอายุแล้ว กรุณากด 'สร้างใหม่' เพื่อสร้างเอกสารอีกครั้ง");
            // Reload history to update status
            await loadHistory();
        } finally {
            setDownloading(null);
        }
    };

    const handleRegenerate = async (doc: DocumentHistory) => {
        try {
            setRegenerating(doc.id);
            await apiClient.regenerateDocument(doc.id);

            // Reload history to show DOCX/PDF buttons
            await loadHistory();
        } catch (err) {
            console.error("Failed to regenerate:", err);
            alert("ไม่สามารถสร้างเอกสารใหม่ได้ กรุณาลองอีกครั้ง");
        } finally {
            setRegenerating(null);
        }
    };

    const formatDate = (dateString: string) => {
        // Backend returns time that is already in Bangkok timezone
        // but may have Z suffix treating it as UTC incorrectly
        // We need to parse it as-is without timezone conversion

        // Remove Z suffix if present to prevent UTC interpretation
        const cleanDateString = dateString.replace('Z', '');

        // Parse the date parts manually to avoid timezone issues
        const date = new Date(cleanDateString);

        // Format without timezone conversion (use UTC methods to get the raw values)
        const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        };

        // Use the date as-is (the values in the string are already Bangkok time)
        return date.toLocaleString("th-TH", options);
    };

    const formatRelativeTime = (dateString: string) => {
        const now = new Date();
        // Remove Z suffix to parse as local time
        const cleanDateString = dateString.replace('Z', '');
        const date = new Date(cleanDateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "เมื่อสักครู่";
        if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
        if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
        if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
        return formatDate(dateString);
    };

    const parseFormData = (dataStr: string): Record<string, string> => {
        try {
            return JSON.parse(dataStr);
        } catch {
            return {};
        }
    };

    const getStatusBadge = (doc: DocumentHistory) => {
        // Check if files are available based on paths
        const hasFiles = doc.gcs_path_docx || doc.gcs_path_pdf;

        if (hasFiles) {
            return (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    พร้อมดาวน์โหลด
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                    ต้องสร้างใหม่
                </span>
            );
        }
    };

    const getPlaceholderAlias = (doc: DocumentHistory, placeholder: string): string => {
        if (!doc.template?.aliases) return placeholder.replace(/[{}]/g, "");
        // aliases is now an object, not a JSON string
        return doc.template.aliases[placeholder] || placeholder.replace(/[{}]/g, "");
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container-main section-padding">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <History className="w-8 h-8 text-primary" />
                        <h1 className="text-h2 text-foreground">ประวัติเอกสาร</h1>
                    </div>
                    <p className="text-body text-text-muted">
                        ดูประวัติการสร้างเอกสารและดาวน์โหลดไฟล์
                    </p>
                </div>

                {/* Content */}
                <div className="bg-background border border-border-default rounded-lg">
                    <div className="p-6 border-b border-border-default">
                        <h2 className="text-h4 text-foreground">เอกสารของคุณ</h2>
                        <p className="text-body-sm text-text-muted">
                            {total > 0
                                ? `พบ ${total} เอกสาร`
                                : "ยังไม่มีเอกสาร"}
                        </p>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 mx-auto text-text-muted mb-4" />
                                <h3 className="text-h4 text-foreground mb-2">
                                    ยังไม่มีเอกสาร
                                </h3>
                                <p className="text-body-sm text-text-muted mb-6">
                                    เอกสารที่คุณสร้างจะแสดงที่นี่
                                </p>
                                <Button href="/forms" variant="primary">
                                    เริ่มสร้างเอกสาร
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border-default">
                                                <th className="text-left py-3 px-4 text-body-sm font-semibold text-text-muted">
                                                    เอกสาร
                                                </th>
                                                <th className="text-left py-3 px-4 text-body-sm font-semibold text-text-muted">
                                                    เทมเพลต
                                                </th>
                                                <th className="text-left py-3 px-4 text-body-sm font-semibold text-text-muted">
                                                    วันที่สร้าง
                                                </th>
                                                <th className="text-left py-3 px-4 text-body-sm font-semibold text-text-muted">
                                                    สถานะ
                                                </th>
                                                <th className="text-right py-3 px-4 text-body-sm font-semibold text-text-muted">
                                                    การดำเนินการ
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.map((doc) => (
                                                <tr
                                                    key={doc.id}
                                                    className="border-b border-border-default hover:bg-surface-alt transition-colors"
                                                >
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="w-8 h-8 text-primary" />
                                                            <div>
                                                                <p className="text-body-sm font-medium text-foreground truncate max-w-[200px]">
                                                                    {doc.filename}
                                                                </p>
                                                                <p className="text-caption text-text-muted font-mono">
                                                                    {doc.id.slice(0, 8)}...
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <p className="text-body-sm text-foreground">
                                                            {doc.template?.name ||
                                                                "ไม่ทราบเทมเพลต"}
                                                        </p>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-text-muted" />
                                                            <div>
                                                                <p className="text-body-sm text-foreground">
                                                                    {formatRelativeTime(doc.created_at)}
                                                                </p>
                                                                <p className="text-caption text-text-muted">
                                                                    {formatDate(doc.created_at)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        {getStatusBadge(doc)}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => setSelectedDocument(doc)}
                                                                className="inline-flex items-center px-3 py-1.5 text-body-sm border border-border-default rounded-lg hover:bg-surface-alt transition-colors"
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                ดูข้อมูล
                                                            </button>
                                                            {!doc.gcs_path_docx && !doc.gcs_path_pdf ? (
                                                                <button
                                                                    onClick={() => handleRegenerate(doc)}
                                                                    disabled={regenerating === doc.id}
                                                                    className="inline-flex items-center px-3 py-1.5 text-body-sm border border-blue-200 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {regenerating === doc.id ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <RefreshCw className="w-4 h-4 mr-1" />
                                                                            สร้างใหม่
                                                                        </>
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    {doc.gcs_path_docx && (
                                                                        <button
                                                                            onClick={() => handleDownload(doc, "docx")}
                                                                            disabled={downloading === `${doc.id}-docx`}
                                                                            className="inline-flex items-center px-3 py-1.5 text-body-sm border border-border-default rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            {downloading === `${doc.id}-docx` ? (
                                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                            ) : (
                                                                                <>
                                                                                    <Download className="w-4 h-4 mr-1" />
                                                                                    DOCX
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                    {doc.gcs_path_pdf && (
                                                                        <button
                                                                            onClick={() => handleDownload(doc, "pdf")}
                                                                            disabled={downloading === `${doc.id}-pdf`}
                                                                            className="inline-flex items-center px-3 py-1.5 text-body-sm border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            {downloading === `${doc.id}-pdf` ? (
                                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                            ) : (
                                                                                <>
                                                                                    <Download className="w-4 h-4 mr-1" />
                                                                                    PDF
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-border-default">
                                        <p className="text-body-sm text-text-muted">
                                            หน้า {page} จาก {totalPages}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                className="inline-flex items-center px-3 py-1.5 text-body-sm border border-border-default rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="w-4 h-4 mr-1" />
                                                ก่อนหน้า
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setPage((p) => Math.min(totalPages, p + 1))
                                                }
                                                disabled={page === totalPages}
                                                className="inline-flex items-center px-3 py-1.5 text-body-sm border border-border-default rounded-lg hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                ถัดไป
                                                <ChevronRight className="w-4 h-4 ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* View Data Modal */}
            {selectedDocument && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-background rounded-lg border border-border-default shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-border-default flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-primary" />
                                <div>
                                    <h3 className="text-h4 text-foreground">
                                        รายละเอียดเอกสาร
                                    </h3>
                                    <p className="text-caption text-text-muted">
                                        ข้อมูลที่คุณกรอกในเอกสารนี้
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedDocument(null)}
                                className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-text-muted" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Document Info */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-surface-alt rounded-lg">
                                <div>
                                    <p className="text-caption text-text-muted">เทมเพลต</p>
                                    <p className="text-body-sm font-medium text-foreground">
                                        {selectedDocument.template?.name || "ไม่ทราบ"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-caption text-text-muted">วันที่สร้าง</p>
                                    <p className="text-body-sm font-medium text-foreground">
                                        {formatDate(selectedDocument.created_at)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-caption text-text-muted">สถานะ</p>
                                    {getStatusBadge(selectedDocument)}
                                </div>
                                <div>
                                    <p className="text-caption text-text-muted">รหัสเอกสาร</p>
                                    <p className="text-caption font-mono text-foreground">
                                        {selectedDocument.id}
                                    </p>
                                </div>
                            </div>

                            {/* Form Data */}
                            <div>
                                <h4 className="text-body font-semibold text-foreground mb-3">
                                    ข้อมูลในฟอร์ม
                                </h4>
                                <div className="space-y-3">
                                    {Object.entries(
                                        parseFormData(selectedDocument.data)
                                    ).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex flex-col p-3 bg-surface-alt rounded-lg"
                                        >
                                            <span className="text-caption text-text-muted mb-1">
                                                {getPlaceholderAlias(selectedDocument, key)}
                                            </span>
                                            <span className="text-body-sm font-medium text-foreground">
                                                {value || (
                                                    <span className="text-text-muted italic">
                                                        ว่าง
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Download/Regenerate Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-border-default">
                                {!selectedDocument.gcs_path_docx && !selectedDocument.gcs_path_pdf ? (
                                    <Button
                                        onClick={() => handleRegenerate(selectedDocument)}
                                        variant="primary"
                                        className="flex-1 justify-center"
                                        disabled={regenerating === selectedDocument.id}
                                    >
                                        {regenerating === selectedDocument.id ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                        )}
                                        สร้างเอกสารใหม่
                                    </Button>
                                ) : (
                                    <>
                                        {selectedDocument.gcs_path_docx && (
                                            <Button
                                                onClick={() => handleDownload(selectedDocument, "docx")}
                                                variant="primary"
                                                className="flex-1 justify-center"
                                                disabled={downloading === `${selectedDocument.id}-docx`}
                                            >
                                                {downloading === `${selectedDocument.id}-docx` ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4 mr-2" />
                                                )}
                                                ดาวน์โหลด DOCX
                                            </Button>
                                        )}
                                        {selectedDocument.gcs_path_pdf && (
                                            <Button
                                                onClick={() => handleDownload(selectedDocument, "pdf")}
                                                variant="secondary"
                                                className="flex-1 justify-center"
                                                disabled={downloading === `${selectedDocument.id}-pdf`}
                                            >
                                                {downloading === `${selectedDocument.id}-pdf` ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4 mr-2" />
                                                )}
                                                ดาวน์โหลด PDF
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
