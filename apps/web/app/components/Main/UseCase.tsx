"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface UseCaseItem {
  id: string;
  title: string;
  features: string[];
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  imageAlt: string;
}

const useCases: UseCaseItem[] = [
  {
    id: "1",
    title: "สร้างแบบฟอร์มได้อย่างง่ายดาย ไม่ต้องเขียนโค้ด",
    features: [
      "Drag & Drop สร้างแบบฟอร์มได้ง่ายๆ เพียงลากและวาง",
      "รองรับคำถามหลายรูปแบบ ทั้ง Multiple Choice, Text, Rating และอื่นๆ",
      "ปรับแต่งธีมและสีให้เข้ากับแบรนด์ของคุณ",
      "รองรับการใช้งานบนทุกอุปกรณ์ ทั้ง Desktop และ Mobile",
    ],
    ctaText: "ดูรายละเอียด",
    ctaUrl: "/features/form-builder",
    imageUrl: "/mockup/1101.webp",
    imageAlt: "Form Builder Feature",
  },
  {
    id: "2",
    title: "วิเคราะห์ข้อมูลแบบเรียลไทม์ ด้วย Dashboard",
    features: [
      "ดูสถิติการตอบแบบฟอร์มแบบเรียลไทม์",
      "สร้างกราฟและรายงานอัตโนมัติ",
      "Export ข้อมูลเป็น Excel, CSV หรือ PDF",
      "แชร์รายงานกับทีมได้อย่างง่ายดาย",
    ],
    ctaText: "ดูรายละเอียด",
    ctaUrl: "/features/analytics",
    imageUrl: "/mockup/1102.webp",
    imageAlt: "Analytics Dashboard",
  },
  {
    id: "3",
    title: "เชื่อมต่อกับระบบอื่นๆ ผ่าน API",
    features: [
      "RESTful API รองรับการเชื่อมต่อกับระบบภายนอก",
      "Webhook แจ้งเตือนเมื่อมีการตอบแบบฟอร์มใหม่",
      "รองรับการเชื่อมต่อกับ CRM, ERP และระบบอื่นๆ",
      "Documentation ครบถ้วน พร้อมตัวอย่างโค้ด",
    ],
    ctaText: "ดูรายละเอียด",
    ctaUrl: "/features/api",
    imageUrl: "/mockup/1103.webp",
    imageAlt: "API Integration",
  },
];

interface UseCaseProps {
  background?: "default" | "alt";
  items?: UseCaseItem[];
}

export default function UseCase({
  background = "default",
  items = useCases,
}: UseCaseProps) {
  const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

  return (
    <section className={`${bgClass} font-sans`}>
      <div className="container-main section-padding">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-h2 text-text-default mb-4">
            ทำไมต้องเลือก Dooform
          </h2>
          <p className="text-body text-text-muted max-w-2xl mx-auto">
            เครื่องมือสร้างแบบฟอร์มที่ครบครันสำหรับทุกความต้องการ
          </p>
        </div>

        {/* Use Cases */}
        <div className="space-y-16 lg:space-y-24">
          {items.map((item, index) => {
            const isImageLeft = index % 2 === 1;

            return (
              <div
                key={item.id}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
              >
                {/* Content */}
                <div
                  className={`${isImageLeft ? "lg:order-2" : "lg:order-1"} order-2`}
                >
                  <h3 className="text-h3 text-text-default mb-6">
                    {item.title}
                  </h3>

                  <ul className="space-y-4 mb-6">
                    {item.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start gap-3 text-body text-text-default"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={item.ctaUrl}
                    className="inline-flex items-center gap-1 text-body font-semibold text-primary hover:text-primary-hover transition-colors"
                  >
                    {item.ctaText}
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* Image */}
                <div
                  className={`${isImageLeft ? "lg:order-1" : "lg:order-2"} order-1`}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-surface-alt">
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
