/**
 * Download section component for the download step
 */

import { ChevronDown, CheckCircle } from "lucide-react";

interface DownloadSectionProps {
  selectedFileType: "docx" | "pdf";
  onFileTypeChange: (type: "docx" | "pdf") => void;
  success: {
    documentId: string;
    downloadUrl: string;
    downloadPdfUrl?: string;
  } | null;
}

/**
 * Renders the download step content with file type selection
 */
export function DownloadSection({
  selectedFileType,
  onFileTypeChange,
  success,
}: DownloadSectionProps) {
  return (
    <div className="flex flex-col items-start w-full">
      <div className="flex flex-col items-start justify-center px-4 py-2 w-full">
        <div className="flex flex-col gap-4 items-start w-full">
          {/* File Type Selection */}
          <div className="flex flex-col gap-2 items-start w-full">
            <label
              htmlFor="file-type-select"
              className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-[#171717] text-base"
            >
              เลือกประเภทไฟล์
            </label>
            <div className="relative">
              <select
                id="file-type-select"
                value={selectedFileType}
                onChange={(e) =>
                  onFileTypeChange(e.target.value as "docx" | "pdf")
                }
                className="
                  font-['IBM_Plex_Sans_Thai',sans-serif]
                  bg-[#f0f0f0]
                  border-b-2 border-[#5b5b5b] border-l-0 border-r-0 border-t-0
                  px-4 py-[13px] pr-10
                  text-base
                  text-[#5b5b5b]
                  outline-none
                  appearance-none
                  min-w-[140px]
                  cursor-pointer
                "
              >
                <option value="pdf">ไฟล์ PDF</option>
                <option value="docx">ไฟล์ DOCX</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#5b5b5b] pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div
              className="w-full p-4 bg-green-50 border-l-4 border-green-500 mt-4"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
                <p className="font-['IBM_Plex_Sans_Thai',sans-serif] text-green-700">
                  เอกสารพร้อมให้ดาวน์โหลดแล้ว
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
