"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@dooform/shared/auth/hooks";
import { LogoLoader } from "@dooform/shared";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace("/templates");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking auth
  return <LogoLoader />;
}
