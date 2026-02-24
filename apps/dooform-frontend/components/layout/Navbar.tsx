"use client";

import {
  FileText,
  History,
  BookMarked,
  BookOpenText,
} from "lucide-react";
import { Navbar as SharedNavbar } from "@dooform/shared";
import type { NavTab } from "@dooform/shared";

const NAV_TABS: NavTab[] = [
  { name: "รายการเอกสาร", href: "/templates", icon: FileText, position: "left" },
  { name: "ประวัติการกรอก", href: "/history", icon: History, position: "left" },
  { name: "คลังคำศัพท์", href: "/dictionary", icon: BookMarked, position: "left" },
  { name: "คู่มือการใช้งาน", href: "/docs", icon: BookOpenText, position: "right" },
];

export default function Navbar() {
  return (
    <SharedNavbar
      tabs={NAV_TABS}
      logoHref="/templates"
      showSearch
      searchPlaceholder="ค้นหาเอกสาร..."
      profileHref="/profile"
    />
  );
}
