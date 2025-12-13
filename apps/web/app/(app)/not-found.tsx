import Link from "next/link";
import { Home, FileText } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-sans">
      {/* 404 Number */}
      <span className="text-8xl font-bold text-neutral-200">404</span>

      {/* Heading */}
      <h1 className="text-xl font-semibold text-neutral-900 mt-4">
        ไม่พบหน้าที่คุณต้องการ
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-sm text-neutral-500 max-w-sm">
        หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่
      </p>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/templates"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>หน้าหลัก</span>
        </Link>
        <Link
          href="/templates"
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>ดูเทมเพลต</span>
        </Link>
      </div>
    </div>
  );
}
