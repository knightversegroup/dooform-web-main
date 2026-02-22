"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Upload,
    FileText,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    Plus,
    Info,
} from "lucide-react";
import { apiClient } from "@dooform/shared/api/client";
import { useAuth } from "@dooform/shared/auth/hooks";

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
            if (!selectedFile.name.endsWith('.docx')) {
                setError("กรุณาเลือกไฟล์ .docx เท่านั้น");
                return;
            }
            setFile(selectedFile);
            setError(null);

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
                undefined,
                htmlFile || undefined
            );

            setSuccess("อัปโหลดเทมเพลตสำเร็จ!");

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#007398] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                    <Link
                        href="/forms"
                        className="text-sm text-gray-600 hover:text-[#007398]"
                    >
                        ← กลับไปหน้าเทมเพลต
                    </Link>
                </div>
            </div>

            {/* Header Banner */}
            <div className="bg-[#007398]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-start gap-6">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl md:text-3xl font-light text-white leading-tight mb-2">
                                เพิ่มเทมเพลตใหม่
                            </h1>
                            <p className="text-white/80 text-sm max-w-2xl">
                                อัปโหลดไฟล์ Word (.docx) ที่มี placeholder เช่น {"{{ชื่อ}}"} หรือ {"{{วันที่}}"} ระบบจะดึง placeholder ออกมาโดยอัตโนมัติ
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden lg:flex items-center gap-6 text-white">
                            <div className="text-center">
                                <div className="text-3xl font-light">
                                    <Plus className="w-8 h-8 mx-auto" />
                                </div>
                                <div className="text-sm text-white/70">สร้างใหม่</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14">
                        {/* Left - Steps */}
                        <div className="flex items-center gap-4">
                            <span className={`text-sm ${file ? 'text-green-600' : 'text-gray-400'}`}>
                                {file ? <CheckCircle className="w-4 h-4 inline mr-1" /> : '1.'}
                                เลือกไฟล์
                            </span>
                            <span className="text-gray-300">→</span>
                            <span className={`text-sm ${formData.displayName ? 'text-green-600' : 'text-gray-400'}`}>
                                {formData.displayName ? <CheckCircle className="w-4 h-4 inline mr-1" /> : '2.'}
                                กรอกข้อมูล
                            </span>
                            <span className="text-gray-300">→</span>
                            <span className="text-sm text-gray-400">
                                3. อัปโหลด
                            </span>
                        </div>

                        {/* Right - Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={uploading || !file || !formData.displayName}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white text-sm font-medium rounded hover:bg-[#005f7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    กำลังอัปโหลด...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    อัปโหลดเทมเพลต
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Error/Success Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            <p className="text-sm text-red-700 flex-1">{error}</p>
                            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    </div>
                )}

                <div className="max-w-3xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload Section */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-[#007398] text-white text-xs flex items-center justify-center">1</span>
                                    ไฟล์เทมเพลต
                                    <span className="text-red-500">*</span>
                                </h2>
                            </div>
                            <div className="p-4">
                                {!file ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#007398] hover:bg-[#007398]/5 transition-colors"
                                    >
                                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-sm text-gray-900 mb-1">
                                            คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง
                                        </p>
                                        <p className="text-xs text-gray-500">
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
                                    <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <FileText className="w-10 h-10 text-[#007398] flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* HTML Preview File Section */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-gray-400 text-white text-xs flex items-center justify-center">+</span>
                                    ไฟล์ Preview HTML
                                    <span className="text-xs text-gray-400 font-normal">(ไม่บังคับ)</span>
                                </h2>
                            </div>
                            <div className="p-4">
                                <p className="text-xs text-gray-500 mb-3">
                                    อัปโหลดไฟล์ HTML สำหรับแสดงตัวอย่างเอกสารแบบ Real-time ในหน้ากรอกข้อมูล
                                </p>
                                {!htmlFile ? (
                                    <div
                                        onClick={() => htmlInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#007398] hover:bg-[#007398]/5 transition-colors"
                                    >
                                        <p className="text-xs text-gray-500">
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
                                    <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {htmlFile.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(htmlFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeHtmlFile}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Template Info Section */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded bg-[#007398] text-white text-xs flex items-center justify-center">2</span>
                                    ข้อมูลเทมเพลต
                                </h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อเทมเพลต <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="เช่น สูติบัตร ทร.1"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398] focus:ring-1 focus:ring-[#007398]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        คำอธิบาย
                                    </label>
                                    <textarea
                                        placeholder="อธิบายเกี่ยวกับเทมเพลตนี้"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398] focus:ring-1 focus:ring-[#007398] resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ผู้สร้าง
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="ชื่อผู้สร้างเทมเพลต"
                                            value={formData.author}
                                            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398] focus:ring-1 focus:ring-[#007398]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            หมวดหมู่
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398] focus:ring-1 focus:ring-[#007398] bg-white"
                                        >
                                            <option value="">เลือกหมวดหมู่</option>
                                            <option value="legal">กฎหมาย (Legal)</option>
                                            <option value="finance">การเงิน (Finance)</option>
                                            <option value="hr">ทรัพยากรบุคคล (HR)</option>
                                            <option value="education">การศึกษา (Education)</option>
                                            <option value="government">ราชการ (Government)</option>
                                            <option value="business">ธุรกิจ (Business)</option>
                                            <option value="other">อื่นๆ (Other)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                วิธีสร้าง Placeholder
                            </h4>
                            <ul className="text-xs text-blue-800 space-y-1">
                                <li>• ใช้เครื่องหมาย {"{{ }}"} ครอบข้อความที่ต้องการเป็นช่องกรอก</li>
                                <li>• ตัวอย่าง: {"{{ชื่อ}}"}, {"{{นามสกุล}}"}, {"{{วันที่}}"}</li>
                                <li>• ระบบจะดึง placeholder ออกมาให้อัตโนมัติหลังอัปโหลด</li>
                                <li>• สามารถแก้ไขชื่อแสดงผลได้ในหน้าถัดไป</li>
                            </ul>
                        </div>

                        {/* Mobile Submit Button */}
                        <div className="lg:hidden">
                            <button
                                type="submit"
                                disabled={uploading || !file || !formData.displayName}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#007398] text-white font-medium rounded hover:bg-[#005f7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        กำลังอัปโหลด...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        อัปโหลดเทมเพลต
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
