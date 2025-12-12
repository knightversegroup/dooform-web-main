"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SolutionItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}

const solutions: SolutionItem[] = [
  {
    id: "1",
    title: "จัดการเอกสารทางกฎหมาย",
    description: "สร้างแบบสำรวจความพึงพอใจลูกค้าได้อย่างง่ายดาย",
    imageUrl: "/mockup/example-1.png",
    linkUrl: "/solutions/survey",
  },
  {
    id: "2",
    title: "ระบบใบเสร็จครบวงจรกับบริษัทนำเที่ยว",
    description: "จัดการการลงทะเบียนงานอีเวนต์และกิจกรรมต่างๆ",
    imageUrl: "/mockup/example-2.png",
    linkUrl: "/solutions/registration",
  },
  {
    id: "3",
    title: "เอกสารสำหรับบริษัทรับทำวีซ่า",
    description: "รับออเดอร์และจัดการคำสั่งซื้อได้อย่างมีประสิทธิภาพ",
    imageUrl: "/mockup/example-3.png",
    linkUrl: "/solutions/order",
  },
  {
    id: "4",
    title: "ลดงานแปลเอกสารสำหรับบริษัทรับแปล",
    description: "สร้างแบบฟอร์มรับสมัครงานและจัดการผู้สมัครได้ง่าย",
    imageUrl: "/mockup/example-4.png",
    linkUrl: "/solutions/recruitment",
  },
  {
    id: "5",
    title: "แบบฟอร์มนัดหมาย",
    description: "จัดการการนัดหมายและจองเวลาได้อย่างสะดวก",
    imageUrl: "/mockup/1102.webp",
    linkUrl: "/solutions/booking",
  },
];

interface BusinessSolutionsProps {
  background?: "default" | "alt";
  sectionTitle?: string;
  sectionSubtitle?: string;
  items?: SolutionItem[];
}

export default function BusinessSolutions({
  background = "default",
  sectionTitle = "ดูฟอร์มกับธุรกิจ",
  sectionSubtitle = "เลือกโซลูชันที่เหมาะกับธุรกิจของคุณ",
  items = solutions,
}: BusinessSolutionsProps) {
  const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        container.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className={`${bgClass} font-sans`}>
      <div className="container-main section-padding">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
          <div>
            <p className="text-body text-text-muted mb-2">{sectionSubtitle}</p>
            <h2 className="text-h2 text-text-default">{sectionTitle}</h2>

            {/* Navigation Buttons */}
            {/*<div className="flex gap-3 mt-6">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
                  !canScrollLeft
                    ? "cursor-not-allowed border-border-default text-text-muted"
                    : "border-text-default text-text-default hover:bg-surface-alt"
                }`}
                aria-label="Previous"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors ${
                  !canScrollRight
                    ? "cursor-not-allowed border-border-default text-text-muted"
                    : "border-text-default text-text-default hover:bg-surface-alt"
                }`}
                aria-label="Next"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>*/}
          </div>

          <Link
            href="/solutions"
            className="text-body-sm text-text-muted hover:text-primary transition-colors"
          >
            ดูทั้งหมด
          </Link>
        </div>

        {/* Scrollable Cards */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex-shrink-0 w-[300px] lg:w-[320px]"
            >
              {/* Image */}
              <div className="relative h-96 w-full overflow-hidden rounded-xl mb-4 bg-surface-alt">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  sizes="320px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <h3 className="text-h4 text-text-default mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-body-sm text-text-muted mb-3">
                {item.description}
              </p>
              <Link
                href={item.linkUrl}
                className="inline-flex items-center text-body-sm font-semibold text-text-default hover:text-primary transition-colors"
              >
                ดูรายละเอียด
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
