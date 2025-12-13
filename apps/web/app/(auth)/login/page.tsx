"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/context";

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
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const response = await fetch(`${API_BASE_URL}/auth/google/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_token: idToken }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Google authentication failed");
            }

            setAuthState(data.data.user, data.data.access_token, data.data.refresh_token);

            if (data.data.user && !data.data.user.profile_completed) {
                router.push("/profile/setup");
            } else {
                router.push(redirectTo);
            }
        } catch (err: unknown) {
            console.error("Google login error:", err);
            let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google";

            if (err && typeof err === 'object' && 'code' in err) {
                const errorCode = (err as { code: string }).code;
                switch (errorCode) {
                    case 'auth/popup-closed-by-user':
                    case 'auth/cancelled-popup-request':
                        errorMessage = "การเข้าสู่ระบบถูกยกเลิก";
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = "Popup ถูกบล็อก กรุณาอนุญาต popup";
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = "ไม่สามารถเชื่อมต่อได้";
                        break;
                    default:
                        errorMessage = "เกิดข้อผิดพลาด กรุณาลองใหม่";
                }
            }
            setError(errorMessage);
        } finally {
            setGoogleLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 text-black/30 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm">
            {/* Card */}
            <div className="backdrop-blur-2xl bg-white/70 rounded-2xl border border-black/[0.06] p-8 shadow-sm">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-lg font-semibold text-black/85">
                        เข้าสู่ระบบ
                    </h1>
                    <p className="mt-1 text-sm text-black/50">
                        เข้าสู่ระบบเพื่อใช้งาน Dooform
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        name="email"
                        placeholder="อีเมล"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading || googleLoading}
                        className="w-full px-4 py-2.5 text-base bg-black/[0.04] border border-black/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-black/30 disabled:opacity-50"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="รหัสผ่าน"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading || googleLoading}
                        className="w-full px-4 py-2.5 text-base bg-black/[0.04] border border-black/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-black/30 disabled:opacity-50"
                        required
                    />

                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/10 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="w-full py-2.5 px-4 bg-primary text-white text-base font-medium rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                กำลังเข้าสู่ระบบ...
                            </>
                        ) : (
                            "เข้าสู่ระบบ"
                        )}
                    </button>

                    {/* Divider */}
                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-black/[0.06]"></div>
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 text-sm text-black/30 bg-white/70">หรือ</span>
                        </div>
                    </div>

                    {/* Google Login */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading || googleLoading}
                        className="w-full py-2.5 px-4 bg-white text-black/80 text-base font-medium border border-black/[0.08] rounded-xl hover:bg-black/[0.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {googleLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                        {googleLoading ? "กำลังเข้าสู่ระบบ..." : "Google"}
                    </button>
                </form>
            </div>

            {/* Links */}
            <div className="mt-6 text-center space-y-3">
                <Link
                    href={redirectTo !== "/" ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"}
                    className="block text-base text-black/50 hover:text-primary transition-colors"
                >
                    ยังไม่มีบัญชี? <span className="text-primary">สมัครสมาชิก</span>
                </Link>
                <Link
                    href="/forgot-password"
                    className="block text-sm text-black/30 hover:text-black/50 transition-colors"
                >
                    ลืมรหัสผ่าน?
                </Link>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-black/30 animate-spin" />
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}
