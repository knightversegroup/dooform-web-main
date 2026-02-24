"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, Settings } from "lucide-react";
import { Navbar } from "@dooform/shared";
import type { NavTab } from "@dooform/shared";

const NAV_TABS: NavTab[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, position: "left" },
  { name: "จัดการผู้ใช้", href: "/users", icon: Users, position: "left" },
  { name: "Console", href: "/console", icon: Settings, position: "left" },
];

export function BackofficeNav() {
  const router = useRouter();

  return (
    <Navbar
      tabs={NAV_TABS}
      badge="Backoffice"
      onLogout={() => router.push("/login")}
    />
  );
}
