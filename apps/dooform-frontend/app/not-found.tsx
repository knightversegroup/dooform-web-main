import Link from "next/link";

export default function NotFound() {
  return (
    <section className="w-full bg-background font-sans">
      <div className="container-main section-padding">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto min-h-[50vh] justify-center">
          {/* 404 Number */}
          <span className="text-8xl md:text-9xl font-bold text-primary opacity-20">
            404
          </span>

          {/* Heading */}
          <h1 className="text-h1 text-foreground mt-4">
            ไม่พบหน้าที่คุณต้องการ
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-body-lg text-text-default">
            หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่
            <br />
            กรุณาตรวจสอบ URL อีกครั้ง หรือกลับไปหน้าหลัก
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-full transition-colors"
            >
              กลับหน้าหลัก
            </Link>
            <Link
              href="/forms"
              className="px-6 py-3 text-sm font-semibold text-text-default border border-border-default hover:bg-surface-alt rounded-full transition-colors"
            >
              ดูเทมเพลตทั้งหมด
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
