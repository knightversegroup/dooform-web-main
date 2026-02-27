/**
 * Action buttons component for form navigation and submission
 */

import { Loader2, Download, AlertTriangle } from "lucide-react";
import { FormStep } from "../utils/constants";

interface ActionButtonsProps {
  currentStep: FormStep;
  processing: boolean;
  canGenerate: boolean;
  isAdmin: boolean;
  success: { documentId: string } | null;
  selectedFileType: "docx" | "pdf";
  onGoToReview: () => void;
  onGoToFill: () => void;
  onConfirmAndProcess: () => void;
  onDownload: (format: "docx" | "pdf") => void;
}

/**
 * Renders action buttons based on the current form step
 */
export function ActionButtons({
  currentStep,
  processing,
  canGenerate,
  isAdmin,
  success,
  selectedFileType,
  onGoToReview,
  onGoToFill,
  onConfirmAndProcess,
  onDownload,
}: ActionButtonsProps) {
  if (currentStep === "fill") {
    return (
      <button
        onClick={onGoToReview}
        className="
                   bg-[#000091]
          text-white
          px-[13px] py-[10px]
          text-base
          hover:bg-[#000070]
          transition-colors
        "
      >
        ตรวจสอบฟอร์ม
      </button>
    );
  }

  if (currentStep === "review") {
    return (
      <div className="flex flex-col gap-2 items-start">
        {/* Quota warning for non-admins */}
        {!canGenerate && !isAdmin && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-2" role="alert">
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            <span>คุณไม่มีโควต้าเหลือ กรุณาติดต่อผู้ดูแลระบบ</span>
          </div>
        )}
        <div className="flex gap-2 items-start">
          <button
            onClick={onGoToFill}
            className="
                           bg-[#f0f0f0]
              text-[#5b5b5b]
              px-[13px] py-[10px]
              text-base
              hover:bg-[#e0e0e0]
              transition-colors
            "
          >
            แก้ไขข้อมูล
          </button>
          <button
            onClick={onConfirmAndProcess}
            disabled={processing || !canGenerate}
            className="
                           bg-[#000091]
              text-white
              px-[13px] py-[10px]
              text-base
              hover:bg-[#000070]
              transition-colors
              disabled:opacity-50
              disabled:cursor-not-allowed
              inline-flex items-center gap-2
            "
            aria-busy={processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                กำลังสร้าง...
              </>
            ) : (
              "ยืนยันข้อมูล"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === "download") {
    return (
      <button
        onClick={() => onDownload(selectedFileType)}
        disabled={!success}
        className="
                   bg-[#000091]
          text-white
          px-[13px] py-[10px]
          text-base
          hover:bg-[#000070]
          transition-colors
          disabled:opacity-50
          disabled:cursor-not-allowed
          inline-flex items-center gap-2
        "
      >
        <Download className="w-4 h-4" aria-hidden="true" />
        ดาวน์โหลด
      </button>
    );
  }

  return null;
}
