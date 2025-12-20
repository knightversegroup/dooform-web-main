"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to consolidated Console page
export default function DocumentTypesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/console?tab=doctypes");
  }, [router]);

  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-gray-500">Redirecting to Console...</p>
    </div>
  );
}
