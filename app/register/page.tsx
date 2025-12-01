"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/";
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, authLoading, router, redirectTo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = (): string | null => {
        if (!formData.email || !formData.password || !formData.confirmPassword) {
            return "กรุณากรอกข้อมูลให้ครบถ้วน";
        }

        if (!formData.email.includes("@")) {
            return "กรุณากรอกอีเมลที่ถูกต้อง";
        }

        if (formData.password.length < 8) {
            return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
        }

        if (formData.password !== formData.confirmPassword) {
            return "รหัสผ่านไม่ตรงกัน";
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        // Split full name into first and last name
        const nameParts = formData.fullName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        try {
            setLoading(true);

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    first_name: firstName,
                    last_name: lastName,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "การสมัครสมาชิกล้มเหลว");
            }

            setSuccess(true);
        } catch (err) {
            console.error("Register error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "เกิดข้อผิดพลาดในการสมัครสมาชิก"
            );
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking auth state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-surface-alt flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    // Success state
    if (success) {
        const loginUrl = redirectTo !== "/" ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login";
        return (
            <section className="bg-surface-alt font-sans min-h-screen flex items-center justify-center">
                <div className="container-main section-padding flex flex-col items-center gap-9">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-h2 text-foreground">
                            สมัครสมาชิกสำเร็จ!
                        </h2>
                        <p className="text-body text-text-muted">
                            กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี
                        </p>
                    </div>
                    <Button href={loginUrl} variant="primary">
                        ไปหน้าเข้าสู่ระบบ
                    </Button>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-surface-alt font-sans min-h-screen flex items-center justify-center">
            <div className="container-main section-padding flex flex-col items-center gap-9">
                {/* Header */}
                <div className="flex flex-col items-center gap-0.5 text-center w-full">
                    <h2 className="text-h2 text-foreground">
                        ทดลองใช้งานฟรี
                    </h2>
                    <p className="text-body text-foreground">
                        เพียงสมัครสมาชิกและกรอกข้อมูลได้ทันที
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full max-w-[295px]">
                    {/* Input Fields */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <Input
                            type="text"
                            name="fullName"
                            placeholder="ชื่อ – นามสกุล"
                            value={formData.fullName}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <Input
                            type="email"
                            name="email"
                            placeholder="อีเมล"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                        <Input
                            type="password"
                            name="password"
                            placeholder="รหัสผ่าน"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                        <Input
                            type="password"
                            name="confirmPassword"
                            placeholder="ยืนยันรหัสผ่าน"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl w-full">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-body-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex flex-col items-center gap-3 w-full">
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full justify-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    กำลังสมัครสมาชิก...
                                </>
                            ) : (
                                "สมัครสมาชิก"
                            )}
                        </Button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex-1 h-px bg-border-default"></div>
                            <span className="text-caption text-text-muted">หรือ</span>
                            <div className="flex-1 h-px bg-border-default"></div>
                        </div>

                        {/* LINE Register */}
                        <a
                            href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/auth/line/login`}
                            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#06C755] text-white rounded-xl hover:bg-[#05b04c] transition-colors text-sm font-medium"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                            </svg>
                            สมัครด้วย LINE
                        </a>

                        {/* Login Link */}
                        <div className="flex items-center gap-3">
                            <Button
                                href={redirectTo !== "/" ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                                variant="secondary"
                            >
                                มีบัญชีผู้ใช้แล้ว?
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Terms Notice */}
                <p className="text-caption text-text-muted text-center max-w-[295px]">
                    การสมัครสมาชิกถือว่าคุณได้ยินยอมให้มีการเก็บข้อมูลในการใช้งาน
                </p>
            </div>
        </section>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-surface-alt flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            }
        >
            <RegisterContent />
        </Suspense>
    );
}
