"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/app/components/ui/Button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

function LineCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { updateUser } = useAuth();

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get("code");
            const state = searchParams.get("state");
            const errorParam = searchParams.get("error");
            const errorDescription = searchParams.get("error_description");

            if (errorParam) {
                setError(errorDescription || errorParam);
                setStatus("error");
                return;
            }

            if (!code) {
                setError("ไม่พบ authorization code");
                setStatus("error");
                return;
            }

            try {
                // Exchange code for tokens via backend
                const response = await fetch(
                    `${API_BASE_URL}/auth/line/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "LINE authentication failed");
                }

                // Store tokens in localStorage
                const authData = {
                    user: data.data.user,
                    accessToken: data.data.access_token,
                    refreshToken: data.data.refresh_token,
                };

                localStorage.setItem("dooform_auth", JSON.stringify(authData));

                // Update auth context
                if (data.data.user) {
                    updateUser(data.data.user);
                }

                setStatus("success");

                // Check if profile needs to be completed
                if (data.data.user && !data.data.user.profile_completed) {
                    setTimeout(() => {
                        router.push("/profile/setup");
                    }, 1500);
                } else {
                    setTimeout(() => {
                        router.push("/");
                    }, 1500);
                }
            } catch (err) {
                console.error("LINE callback error:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ"
                );
                setStatus("error");
            }
        };

        handleCallback();
    }, [searchParams, router, updateUser]);

    return (
        <div className="min-h-screen bg-surface-alt flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                <div className="bg-background rounded-lg border border-border-default p-8 shadow-sm text-center">
                    {status === "loading" && (
                        <>
                            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                            <h2 className="text-h3 text-foreground mb-2">
                                กำลังเข้าสู่ระบบ
                            </h2>
                            <p className="text-body-sm text-text-muted">
                                กรุณารอสักครู่...
                            </p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-h3 text-foreground mb-2">
                                เข้าสู่ระบบสำเร็จ!
                            </h2>
                            <p className="text-body-sm text-text-muted">
                                กำลังนำคุณไปยังหน้าหลัก...
                            </p>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-h3 text-foreground mb-2">
                                เกิดข้อผิดพลาด
                            </h2>
                            <p className="text-body-sm text-text-muted mb-6">
                                {error}
                            </p>
                            <div className="space-y-3">
                                <Button
                                    href="/login"
                                    variant="primary"
                                    className="w-full justify-center"
                                >
                                    กลับไปหน้าเข้าสู่ระบบ
                                </Button>
                                <Button
                                    href="/"
                                    variant="secondary"
                                    className="w-full justify-center"
                                >
                                    กลับหน้าหลัก
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function LineCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-surface-alt flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            }
        >
            <LineCallbackContent />
        </Suspense>
    );
}
