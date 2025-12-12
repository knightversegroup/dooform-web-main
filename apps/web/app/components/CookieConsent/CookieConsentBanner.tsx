"use client";

import { useState } from "react";
import { useCookieConsent, CookiePreferences } from "@/lib/cookie/context";
import { SquareCheckBig, Square } from "lucide-react";

export function CookieConsentBanner() {
  const { showBanner, preferences, acceptAll, acceptNecessary, acceptCustom } =
    useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [customPreferences, setCustomPreferences] = useState<CookiePreferences>(
    {
      necessary: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    },
  );

  if (!showBanner) return null;

  const handleCustomSave = () => {
    acceptCustom(customPreferences);
    setShowSettings(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 w-fit font-sans">
      {!showSettings ? (
        /* Main Cookie Banner */
        <div className="bg-white border-l-8 border-l-[#1c398e] p-4 flex flex-col gap-2 shadow-lg">
          <div className="flex flex-col gap-1 px-4">
            <p className="font-semibold text-base text-[#1c398e]">
              นโยบายคุกกี้และข้อตกลงในการใช้งาน
            </p>
            <p className="text-base text-black">
              คุณจำเป็นต้องยอมรับข้อตกลงในการใช้งานเว็บไซต์
              โดยสามารถดูข้อมูลเพิ่มเติมได้
              <button
                onClick={() => setShowSettings(true)}
                className="text-[#1c398e] underline hover:text-[#152c70] ml-1"
              >
                ที่นี่
              </button>
            </p>
          </div>
          <div className="flex gap-2 items-center justify-end w-full">
            <button
              onClick={acceptNecessary}
              className="bg-white border border-stone-100 px-4 py-2 text-base font-medium text-black hover:bg-stone-50 transition-colors"
            >
              ปฏิเสธ
            </button>
            <button
              onClick={acceptAll}
              className="bg-[#1c398e] border border-[#2b7fff] px-4 py-2 text-base font-medium text-white hover:bg-[#152c70] transition-colors"
            >
              ยอมรับ
            </button>
          </div>
        </div>
      ) : (
        /* Cookie Settings Panel */
        <div className="bg-white border-l-8 border-l-[#1c398e] p-4 flex flex-col gap-2 shadow-lg">
          {/* Necessary Cookies */}
          <div className="flex gap-4 items-start px-4 min-h-[82px]">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="font-semibold text-base text-[#1c398e]">
                คุกกี้ที่จำเป็น
              </p>
              <p className="text-base text-black">
                คุณจำเป็นต้องยอมรับข้อตกลงในการใช้งานเว็บไซต์
                โดยสามารถดูข้อมูลเพิ่มเติมได้ที่นี่
              </p>
            </div>
            <div className="shrink-0 w-4 h-4 text-[#1c398e]">
              <SquareCheckBig className="w-4 h-4" />
            </div>
          </div>

          {/* Analytics Cookies */}
          <button
            onClick={() =>
              setCustomPreferences((prev) => ({
                ...prev,
                analytics: !prev.analytics,
              }))
            }
            className="flex gap-4 items-start px-4 min-h-[82px] w-full text-left hover:bg-stone-50 transition-colors"
          >
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="font-semibold text-base text-[#1c398e]">
                คุกกี้วิเคราะห์
              </p>
              <p className="text-base text-black">
                คุณจำเป็นต้องยอมรับข้อตกลงในการใช้งานเว็บไซต์
                โดยสามารถดูข้อมูลเพิ่มเติมได้ที่นี่
              </p>
            </div>
            <div className="shrink-0 w-4 h-4 text-[#1c398e]">
              {customPreferences.analytics ? (
                <SquareCheckBig className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Marketing Cookies */}
          <button
            onClick={() =>
              setCustomPreferences((prev) => ({
                ...prev,
                marketing: !prev.marketing,
              }))
            }
            className="flex gap-4 items-start px-4 min-h-[82px] w-full text-left hover:bg-stone-50 transition-colors"
          >
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="font-semibold text-base text-[#1c398e]">
                คุกกี้การตลาด
              </p>
              <p className="text-base text-black">
                คุณจำเป็นต้องยอมรับข้อตกลงในการใช้งานเว็บไซต์
                โดยสามารถดูข้อมูลเพิ่มเติมได้ที่นี่
              </p>
            </div>
            <div className="shrink-0 w-4 h-4 text-[#1c398e]">
              {customPreferences.marketing ? (
                <SquareCheckBig className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </div>
          </button>

          {/* Action Buttons */}
          <div className="flex gap-2 items-center justify-end w-full">
            <button
              onClick={() => setShowSettings(false)}
              className="bg-white border border-stone-100 px-4 py-2 text-base font-medium text-black hover:bg-stone-50 transition-colors"
            >
              ย้อนกลับ
            </button>
            <button
              onClick={handleCustomSave}
              className="bg-[#1c398e] border border-[#2b7fff] px-4 py-2 text-base font-medium text-white hover:bg-[#152c70] transition-colors"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
