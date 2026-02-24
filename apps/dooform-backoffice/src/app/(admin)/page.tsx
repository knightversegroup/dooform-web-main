"use client";

import Link from "next/link";
import { Users, Settings } from "lucide-react";

const QUICK_LINKS = [
  {
    href: "/users",
    label: "User Management",
    description: "จัดการผู้ใช้, บทบาท, และโควต้า",
    icon: Users,
  },
  {
    href: "/console",
    label: "Console",
    description: "จัดการการตั้งค่าระบบทั้งหมด",
    icon: Settings,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Dooform Backoffice Administration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {link.label}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{link.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
