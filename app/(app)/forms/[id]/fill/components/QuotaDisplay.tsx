/**
 * Quota display component for showing user's document generation quota
 */

import { AlertTriangle, Sparkles } from "lucide-react";
import { User } from "@/lib/auth/types";

interface QuotaDisplayProps {
  isAdmin: boolean;
  user: User | null;
}

/**
 * Displays the user's quota status in the form header
 */
export function QuotaDisplay({ isAdmin, user }: QuotaDisplayProps) {
  if (isAdmin) {
    return (
      <span className="text-sm text-purple-600 font-medium flex items-center gap-1">
        <Sparkles className="w-4 h-4" aria-hidden="true" />
        ผู้ดูแลระบบ (ไม่จำกัดโควต้า)
      </span>
    );
  }

  if (!user?.quota) {
    return null;
  }

  const { remaining, total } = user.quota;
  const isLow = remaining > 0 && remaining <= 3;
  const isEmpty = remaining === 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">โควต้าคงเหลือ:</span>
      <span
        className={`font-medium ${
          remaining > 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {remaining} / {total}
      </span>
      {isEmpty && (
        <span className="flex items-center gap-1 text-red-600">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          หมดโควต้า
        </span>
      )}
      {isLow && (
        <span className="flex items-center gap-1 text-amber-600">
          <AlertTriangle className="w-4 h-4" aria-hidden="true" />
          ใกล้หมด
        </span>
      )}
    </div>
  );
}
