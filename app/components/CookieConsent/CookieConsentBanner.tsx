'use client';

import { useState } from 'react';
import { useCookieConsent, CookiePreferences } from '@/lib/cookie/context';
import { Cookie, Settings, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';

export function CookieConsentBanner() {
  const { showBanner, preferences, acceptAll, acceptNecessary, acceptCustom } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [customPreferences, setCustomPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  });

  if (!showBanner) return null;

  const handleCustomSave = () => {
    acceptCustom(customPreferences);
    setShowSettings(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 w-full max-w-md font-sans flex items-center justify-center">
      {/* Banner */}
      <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border border-border-default flex items-center justify-center">
        {/* Header */}


        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Cookie className="w-6 h-6 text-amber-800 " strokeWidth={2} fill="#ffba00" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">การตั้งค่าคุกกี้</h2>
              <p className="text-sm">Cookie Settings</p>
            </div>
          </div>
          {!showSettings ? (
            <>
              <p className="text-text-default text-body-sm leading-relaxed mb-4">
                เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งานของคุณ วิเคราะห์การเข้าชมเว็บไซต์
                และนำเสนอเนื้อหาที่ตรงกับความสนใจของคุณ คุณสามารถเลือกยอมรับคุกกี้ทั้งหมด
                หรือปรับแต่งการตั้งค่าได้ตามต้องการ
              </p>
              <p className="text-text-muted text-caption mb-6">
                We use cookies to enhance your experience, analyze site traffic, and personalize content.
                You can accept all cookies or customize your preferences.
              </p>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  onClick={acceptAll}
                  className="flex rounded-full gap-2 shrink-0"
                >
                  ยอมรับทั้งหมด
                </Button>
                <Button
                  variant="secondary"
                  onClick={acceptNecessary}
                  className="flex rounded-full gap-2 shrink-0"
                >
                  จำเป็นเท่านั้น
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowSettings(true)}
                  className="flex rounded-full gap-2 shrink-0"
                >
                  <Settings className="w-4 h-4" />
                  ตั้งค่า
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Settings Panel */}
              <div className="space-y-4 mb-6">
                {/* Necessary Cookies */}
                <div className="p-4 bg-surface-alt rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">คุกกี้ที่จำเป็น</span>
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">จำเป็น</span>
                    </div>
                    <div className="w-12 h-6 bg-primary rounded-full relative cursor-not-allowed">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  <p className="text-body-sm text-text-muted">
                    คุกกี้เหล่านี้จำเป็นสำหรับการทำงานพื้นฐานของเว็บไซต์ เช่น การรักษาความปลอดภัย การจดจำการเข้าสู่ระบบ
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="p-4 bg-surface-alt rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">คุกกี้วิเคราะห์</span>
                    <button
                      onClick={() => setCustomPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${customPreferences.analytics ? 'bg-primary' : 'bg-border-default'
                        }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${customPreferences.analytics ? 'right-1' : 'left-1'
                          }`}
                      />
                    </button>
                  </div>
                  <p className="text-body-sm text-text-muted">
                    คุกกี้เหล่านี้ช่วยให้เราเข้าใจว่าผู้ใช้โต้ตอบกับเว็บไซต์อย่างไร เพื่อปรับปรุงประสิทธิภาพ (Google Analytics)
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="p-4 bg-surface-alt rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">คุกกี้การตลาด</span>
                    <button
                      onClick={() => setCustomPreferences(prev => ({ ...prev, marketing: !prev.marketing }))}
                      className={`w-12 h-6 rounded-full relative transition-colors ${customPreferences.marketing ? 'bg-primary' : 'bg-border-default'
                        }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${customPreferences.marketing ? 'right-1' : 'left-1'
                          }`}
                      />
                    </button>
                  </div>
                  <p className="text-body-sm text-text-muted">
                    คุกกี้เหล่านี้ใช้เพื่อติดตามผู้เข้าชมและแสดงโฆษณาที่เกี่ยวข้อง (Google Tag Manager)
                  </p>
                </div>
              </div>

              {/* Settings Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  onClick={handleCustomSave}
                  className="flex-1 px-6 py-3 rounded-xl"
                >
                  บันทึกการตั้งค่า
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-6 py-3 rounded-xl"
                >
                  ย้อนกลับ
                </Button>
              </div>
            </>
          )}

          {/* Policy Link */}
          <div className="mt-4 pt-4 border-t border-border-default text-center">
            <Link
              href="/documents/Terms-of-Use/cookie-policy"
              className="text-body-sm text-primary hover:text-primary-hover hover:underline"
            >
              อ่านนโยบายคุกกี้ฉบับเต็ม →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
