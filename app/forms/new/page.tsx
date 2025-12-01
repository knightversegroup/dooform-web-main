"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Upload,
    FileText,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { useAuth } from "@/lib/auth/context";

export default function NewTemplatePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const htmlInputRef = useRef<HTMLInputElement>(null);

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [file, setFile] = useState<File | null>(null);
    const [htmlFile, setHtmlFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        displayName: "",
        description: "",
        author: "",
        category: "",
    });

    // Redirect to login if not authenticated
    if (!authLoading && !isAuthenticated) {
        router.replace("/login?redirect=/forms/new");
        return null;
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Validate file type
            if (!selectedFile.name.endsWith('.docx')) {
                setError("กรุณาเลือกไฟล์ .docx เท่านั้น");
                return;
            }
            setFile(selectedFile);
            setError(null);

            // Auto-fill display name from filename if empty
            if (!formData.displayName) {
                const nameWithoutExt = selectedFile.name.replace('.docx', '');
                setFormData(prev => ({ ...prev, displayName: nameWithoutExt }));
            }
        }
    };

    const handleHtmlFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.html') && !selectedFile.name.endsWith('.htm')) {
                setError("กรุณาเลือกไฟล์ .html เท่านั้น");
                return;
            }
            setHtmlFile(selectedFile);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!file) {
            setError("กรุณาเลือกไฟล์เทมเพลต (.docx)");
            return;
        }

        if (!formData.displayName) {
            setError("กรุณากรอกชื่อเทมเพลต");
            return;
        }

        try {
            setUploading(true);

            const response = await apiClient.uploadTemplate(
                file,
                formData.displayName,
                formData.description,
                formData.author,
                undefined, // aliases
                htmlFile || undefined
            );

            setSuccess("อัปโหลดเทมเพลตสำเร็จ!");

            // Redirect to the new template's edit page after a short delay
            setTimeout(() => {
                router.push(`/forms/${response.template.id}/edit`);
            }, 1500);
        } catch (err) {
            console.error("Failed to upload template:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถอัปโหลดได้");
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeHtmlFile = () => {
        setHtmlFile(null);
        if (htmlInputRef.current) {
            htmlInputRef.current.value = '';
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

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

                {/* Header */}
                <div className="bg-background border border-border-default rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Upload className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-h3 text-foreground">
                                เพิ่มเทมเพลตใหม่
                            </h1>
                            <p className="text-body-sm text-text-muted">
                                อัปโหลดไฟล์ Word (.docx) ที่มี placeholder เช่น {"{{ชื่อ}}"} หรือ {"{{วันที่}}"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-6">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-body-sm text-red-700">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto text-red-500">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-6">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p className="text-body-sm text-green-700">{success}</p>
                    </div>
                )}

                {/* Upload Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* File Upload */}
                    <div className="bg-background border border-border-default rounded-lg p-6">
                        <h2 className="text-h4 text-foreground mb-4">ไฟล์เทมเพลต *</h2>

                        {!file ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-border-default rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                            >
                                <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                                <p className="text-body text-foreground mb-2">
                                    คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง
                                </p>
                                <p className="text-body-sm text-text-muted">
                                    รองรับไฟล์ .docx เท่านั้น
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".docx"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-surface-alt rounded-lg">
                                <FileText className="w-10 h-10 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-body font-medium text-foreground truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-body-sm text-text-muted">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeFile}
                                    className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* HTML Preview File (Optional) */}
                    <div className="bg-background border border-border-default rounded-lg p-6">
                        <h2 className="text-h4 text-foreground mb-2">ไฟล์ Preview HTML (ไม่บังคับ)</h2>
                        <p className="text-body-sm text-text-muted mb-4">
                            อัปโหลดไฟล์ HTML สำหรับแสดงตัวอย่างเอกสารในหน้ากรอกข้อมูล
                        </p>

                        {!htmlFile ? (
                            <div
                                onClick={() => htmlInputRef.current?.click()}
                                className="border-2 border-dashed border-border-default rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                            >
                                <p className="text-body-sm text-text-muted">
                                    คลิกเพื่อเลือกไฟล์ .html
                                </p>
                                <input
                                    ref={htmlInputRef}
                                    type="file"
                                    accept=".html,.htm"
                                    onChange={handleHtmlFileSelect}
                                    className="hidden"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 p-4 bg-surface-alt rounded-lg">
                                <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-body font-medium text-foreground truncate">
                                        {htmlFile.name}
                                    </p>
                                    <p className="text-body-sm text-text-muted">
                                        {(htmlFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={removeHtmlFile}
                                    className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Template Info */}
                    <div className="bg-background border border-border-default rounded-lg p-6">
                        <h2 className="text-h4 text-foreground mb-4">ข้อมูลเทมเพลต</h2>
                        <div className="space-y-4">
                            <Input
                                label="ชื่อเทมเพลต *"
                                type="text"
                                placeholder="เช่น สูติบัตร ทร.1"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            />
                            <Input
                                label="คำอธิบาย"
                                type="text"
                                placeholder="อธิบายเกี่ยวกับเทมเพลตนี้"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="ผู้สร้าง"
                                    type="text"
                                    placeholder="ชื่อผู้สร้างเทมเพลต"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                />
                                <Input
                                    label="หมวดหมู่"
                                    type="text"
                                    placeholder="เช่น legal, medical"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => router.back()}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={uploading || !file}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    กำลังอัปโหลด...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    อัปโหลดเทมเพลต
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
