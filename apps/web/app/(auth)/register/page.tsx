"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/";
    const { setAuthState, isAuthenticated, isLoading: authLoading } = useAuth();

    const [error, setError] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, authLoading, router, redirectTo]);

    const handleGoogleRegister = async () => {
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
            console.error("Google register error:", err);
            let errorMessage = "เกิดข้อผิดพลาดในการสมัครด้วย Google";

            if (err && typeof err === 'object' && 'code' in err) {
                const errorCode = (err as { code: string }).code;
                switch (errorCode) {
                    case 'auth/popup-closed-by-user':
                    case 'auth/cancelled-popup-request':
                        errorMessage = "การสมัครถูกยกเลิก";
                        break;
                    case 'auth/popup-blocked':
                        errorMessage = "Popup ถูกบล็อก กรุณาอนุญาต popup";
                        break;
                    case 'auth/account-exists-with-different-credential':
                        errorMessage = "อีเมลนี้ถูกใช้งานแล้ว";
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
                        ทดลองใช้งานฟรี
                    </h1>
                    <p className="mt-1 text-sm text-black/50">
                        สมัครสมาชิกและเริ่มใช้งานได้ทันที
                    </p>
                </div>

                <div className="space-y-4">
                    {error && (
                        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/10 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleGoogleRegister}
                        disabled={googleLoading}
                        className="w-full py-2.5 px-4 bg-primary text-white text-base font-medium rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {googleLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                        )}
                        {googleLoading ? "กำลังสมัคร..." : "สมัครด้วย Google"}
                    </button>

                    <p className="text-sm text-black/30 text-center leading-relaxed">
                        การสมัครถือว่ายอมรับ
                        <Link href="/documents/Terms-of-Use/privacy-notice" className="text-black/50 hover:text-primary mx-1">
                            นโยบายความเป็นส่วนตัว
                        </Link>
                    </p>
                </div>
            </div>

            {/* Links */}
            <div className="mt-6 text-center">
                <Link
                    href={redirectTo !== "/" ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                    className="text-base text-black/50 hover:text-primary transition-colors"
                >
                    มีบัญชีแล้ว? <span className="text-primary">เข้าสู่ระบบ</span>
                </Link>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-black/30 animate-spin" />
                </div>
            }
        >
            <RegisterContent />
        </Suspense>
    );
}
