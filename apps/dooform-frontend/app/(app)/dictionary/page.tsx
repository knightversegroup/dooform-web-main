import { Book } from "lucide-react";

export default function DictionaryPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-sans">
      {/* Icon */}
      <div className="w-16 h-16 mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
        <Book className="w-8 h-8 text-neutral-400" />
      </div>

      {/* Heading */}
      <h1 className="text-xl font-semibold text-neutral-900">
        พจนานุกรม
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-sm text-neutral-500 max-w-sm">
        ฟีเจอร์นี้กำลังพัฒนา และจะเปิดให้ใช้งานเร็วๆ นี้
      </p>

      {/* Coming Soon Badge */}
      <span className="mt-4 px-3 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full">
        Coming Soon
      </span>
    </div>
  );
}
