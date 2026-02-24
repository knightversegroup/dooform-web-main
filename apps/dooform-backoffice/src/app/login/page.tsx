"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@dooform/shared/firebase/config";
import { useAuth } from "@dooform/shared/auth/hooks";
import { LogoLoader } from "@dooform/shared";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { setAuthState, isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isAdmin, authLoading, router, redirectTo]);

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

      // Check if user has admin role
      const userRoles: string[] = data.data.user?.roles || [];
      if (!userRoles.includes("admin")) {
        setError("คุณไม่มีสิทธิ์เข้าถึงระบบ Backoffice กรุณาติดต่อผู้ดูแลระบบ");
        return;
      }

      setAuthState(
        data.data.user,
        data.data.access_token,
        data.data.refresh_token,
      );

      router.push(redirectTo);
    } catch (err: unknown) {
      console.error("Google login error:", err);
      let errorMessage = "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google";

      if (err && typeof err === "object" && "code" in err) {
        const errorCode = (err as { code: string }).code;
        switch (errorCode) {
          case "auth/popup-closed-by-user":
          case "auth/cancelled-popup-request":
            errorMessage = "การเข้าสู่ระบบถูกยกเลิก";
            break;
          case "auth/popup-blocked":
            errorMessage = "Popup ถูกบล็อก กรุณาอนุญาต popup";
            break;
          case "auth/network-request-failed":
            errorMessage = "ไม่สามารถเชื่อมต่อได้";
            break;
          default:
            errorMessage = "เกิดข้อผิดพลาด กรุณาลองใหม่";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return <LogoLoader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <ShieldAlert className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Dooform Backoffice
          </h1>
          <p className="text-text-muted text-sm">
            เข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Google Login Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full h-11 px-4 py-2 bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600 rounded-full flex items-center justify-center space-x-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          <span>
            {googleLoading
              ? "กำลังเข้าสู่ระบบ..."
              : "เข้าสู่ระบบด้วย Google"}
          </span>
        </button>

        <p className="mt-6 text-xs text-center text-text-muted">
          สำหรับผู้ดูแลระบบเท่านั้น
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LogoLoader />}>
      <LoginContent />
    </Suspense>
  );
}
