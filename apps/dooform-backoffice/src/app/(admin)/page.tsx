"use client";

import Link from "next/link";
import { Users, Settings, ArrowRight } from "lucide-react";

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
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Dooform Backoffice Administration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {link.label}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {link.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
