"use client";

import { useState, useRef } from "react";
import {
    Camera,
    Loader2,
    CheckCircle,
    AlertCircle,
    X,
    FileText,
    Scan,
} from "lucide-react";
import { apiClient, OCRResponse } from "@/lib/api/client";
import { Button } from "./Button";

interface OCRScannerProps {
    templateId: string;
    onDataExtracted: (mappedFields: Record<string, string>) => void;
    onClose?: () => void;
}

export function OCRScanner({ templateId, onDataExtracted, onClose }: OCRScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<OCRResponse | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                setError("กรุณาเลือกไฟล์รูปภาพ");
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setError(null);
            setResult(null);
        }
    };

    const handleScan = async () => {
        if (!selectedFile) {
            setError("กรุณาเลือกรูปภาพก่อน");
            return;
        }

        setIsScanning(true);
        setError(null);

        try {
            const response = await apiClient.extractTextForTemplate(templateId, selectedFile);
            setResult(response);

            // If we have mapped fields, notify parent
            if (response.mapped_fields && Object.keys(response.mapped_fields).length > 0) {
                // Don't auto-apply, let user confirm
            }
        } catch (err) {
            console.error("OCR error:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถสแกนรูปภาพได้");
        } finally {
            setIsScanning(false);
        }
    };

    const handleApplyData = () => {
        if (result?.mapped_fields) {
            onDataExtracted(result.mapped_fields);
            onClose?.();
        }
    };

    const handleClear = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="bg-background border border-border-default rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Scan className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-h4 text-foreground">สแกนเอกสาร (OCR)</h3>
                        <p className="text-body-sm text-text-muted">
                            อัปโหลดรูปภาพเอกสารเพื่อดึงข้อมูลอัตโนมัติ
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 text-text-muted hover:text-foreground hover:bg-surface-alt rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-body-sm text-red-700">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* File Upload Area */}
            {!selectedFile ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border-default rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                >
                    <Camera className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <p className="text-body text-foreground mb-2">
                        คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง
                    </p>
                    <p className="text-body-sm text-text-muted">
                        รองรับไฟล์ JPG, PNG, HEIC
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Image Preview */}
                    <div className="relative">
                        <img
                            src={previewUrl || ""}
                            alt="Preview"
                            className="w-full max-h-64 object-contain rounded-lg border border-border-default"
                        />
                        <button
                            onClick={handleClear}
                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center gap-3 p-3 bg-surface-alt rounded-lg">
                        <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-body-sm font-medium text-foreground truncate">
                                {selectedFile.name}
                            </p>
                            <p className="text-caption text-text-muted">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    </div>

                    {/* Scan Button */}
                    {!result && (
                        <Button
                            onClick={handleScan}
                            variant="primary"
                            disabled={isScanning}
                            className="w-full"
                        >
                            {isScanning ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    กำลังสแกน...
                                </>
                            ) : (
                                <>
                                    <Scan className="w-4 h-4 mr-2" />
                                    สแกนรูปภาพ
                                </>
                            )}
                        </Button>
                    )}
                </div>
            )}

            {/* OCR Results */}
            {result && (
                <div className="mt-6 space-y-4">
                    {/* Detection Score */}
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-body-sm text-foreground">
                            สแกนสำเร็จ - คะแนนความแม่นยำ: {result.detection_score}%
                        </span>
                    </div>

                    {/* Mapped Fields Preview */}
                    {result.mapped_fields && Object.keys(result.mapped_fields).length > 0 ? (
                        <div className="bg-surface-alt rounded-lg p-4">
                            <h4 className="text-body font-medium text-foreground mb-3">
                                ข้อมูลที่ตรวจพบ ({Object.keys(result.mapped_fields).length} รายการ)
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {Object.entries(result.mapped_fields).map(([key, value]) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between p-2 bg-background rounded border border-border-default"
                                    >
                                        <span className="text-body-sm text-text-muted font-mono">
                                            {key}
                                        </span>
                                        <span className="text-body-sm text-foreground font-medium">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 mt-4">
                                <Button
                                    onClick={handleApplyData}
                                    variant="primary"
                                    className="flex-1"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    ใช้ข้อมูลนี้
                                </Button>
                                <Button
                                    onClick={handleClear}
                                    variant="secondary"
                                >
                                    สแกนใหม่
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-body-sm text-yellow-700">
                                ไม่พบข้อมูลที่ตรงกับช่องกรอกในเทมเพลต
                            </p>
                            <Button
                                onClick={handleClear}
                                variant="secondary"
                                size="sm"
                                className="mt-3"
                            >
                                ลองใหม่อีกครั้ง
                            </Button>
                        </div>
                    )}

                    {/* Raw Text (Collapsible) */}
                    <details className="bg-surface-alt rounded-lg">
                        <summary className="p-3 cursor-pointer text-body-sm text-text-muted hover:text-foreground">
                            ดูข้อความทั้งหมดที่สแกนได้
                        </summary>
                        <div className="p-3 pt-0">
                            <pre className="text-caption text-text-muted whitespace-pre-wrap bg-background p-3 rounded border border-border-default max-h-48 overflow-y-auto">
                                {result.raw_text || "ไม่พบข้อความ"}
                            </pre>
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
}
