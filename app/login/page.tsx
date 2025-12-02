"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/";
    const { login, setAuthState, isAuthenticated, isLoading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.email || !formData.password) {
            setError("กรุณากรอกอีเมลและรหัสผ่าน");
            return;
        }

        try {
            setLoading(true);
            await login(formData.email, formData.password);
        } catch (err) {
            console.error("Login error:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        setGoogleLoading(true);

        try {
            // Sign in with Firebase Google popup
            const result = await signInWithPopup(auth, googleProvider);

            // Get the ID token
            const idToken = await result.user.getIdToken();

            // Send ID token to our backend
            const response = await fetch(`${API_BASE_URL}/auth/google/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id_token: idToken }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Google authentication failed");
            }

            // Update auth context (this will also save to localStorage)
            setAuthState(
                data.data.user,
                data.data.access_token,
                data.data.refresh_token
            );

            // Check if profile needs to be completed
            if (data.data.user && !data.data.user.profile_completed) {
                router.push("/profile/setup");
            } else {
                router.push(redirectTo);
            }
        } catch (err: unknown) {
            console.error("Google login error:", err);

            // Handle Firebase/Google auth errors with user-friendly messages
            let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google";

            if (err && typeof err === 'object' && 'code' in err) {
                const errorCode = (err as { code: string }).code;
                switch (errorCode) {
                    case 'auth/popup-closed-by-user':
                        errorMessage = "การเข้าสู่ระบบถูกยกเลิก";
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = "Popup ถูกบล็อก กรุณาอนุญาต popup สำหรับเว็บไซต์นี้";
                        break;
                    case 'auth/cancelled-popup-request':
                        errorMessage = "การเข้าสู่ระบบถูกยกเลิก";
                        break;
                    case 'auth/admin-restricted-operation':
                    case 'auth/operation-not-allowed':
                        errorMessage = "การเข้าสู่ระบบด้วย Google ยังไม่พร้อมใช้งาน";
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = "ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต";
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = "มีการร้องขอมากเกินไป กรุณาลองใหม่ภายหลัง";
                        break;
                    case 'auth/user-disabled':
                        errorMessage = "บัญชีนี้ถูกระงับการใช้งาน";
                        break;
                    default:
                        errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง";
                }
            }

            setError(errorMessage);
        } finally {
            setGoogleLoading(false);
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

    return (
        <section className="bg-surface-alt font-sans min-h-screen flex items-center justify-center">
            <div className="container-main section-padding flex flex-col items-center gap-9">
                {/* Header */}
                <div className="flex flex-col items-center gap-0.5 text-center w-full">
                    <h2 className="text-h2 text-foreground">
                        เข้าสู่ระบบ
                    </h2>
                    <p className="text-body text-foreground">
                        เข้าสู่ระบบเพื่อใช้งาน Dooform
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full max-w-[295px]">
                    {/* Input Fields */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <Input
                            type="email"
                            name="email"
                            placeholder="อีเมล"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading || googleLoading}
                            required
                        />
                        <Input
                            type="password"
                            name="password"
                            placeholder="รหัสผ่าน"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading || googleLoading}
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
                            disabled={loading || googleLoading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    กำลังเข้าสู่ระบบ...
                                </>
                            ) : (
                                "เข้าสู่ระบบ"
                            )}
                        </Button>

                        {/* Divider */}
                        <div className="flex items-center gap-3 w-full">
                            <div className="flex-1 h-px bg-border-default"></div>
                            <span className="text-caption text-text-muted">หรือ</span>
                            <div className="flex-1 h-px bg-border-default"></div>
                        </div>

                        {/* Google Login */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading || googleLoading}
                            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {googleLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                            )}
                            {googleLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}
                        </button>

                        {/* Register Link */}
                        <div className="flex items-center gap-3">
                            <Button
                                href={redirectTo !== "/" ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
                                variant="secondary"
                            >
                                ยังไม่มีบัญชี? สมัครสมาชิก
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Forgot Password */}
                <Link
                    href="/forgot-password"
                    className="text-caption text-text-muted hover:text-primary transition-colors"
                >
                    ลืมรหัสผ่าน?
                </Link>
            </div>
        </section>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-surface-alt flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}
