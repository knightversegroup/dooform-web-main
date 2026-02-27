"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@dooform/shared/auth/hooks";
import { LogoLoader } from "@dooform/shared";
import { BackofficeNav } from "./_components/BackofficeNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (!isAdmin) {
        router.replace("/login");
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router]);

  if (isLoading) {
    return <LogoLoader />;
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BackofficeNav />
      <main className="pt-[144px] pb-8 max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
