"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface NewsItem {
    id: string;
    date: string;
    title: string;
    description: string;
    category: string;
    image: string;
    href: string;
}

interface LatestNewsProps {
    background?: "default" | "alt";
}

// Mock news data - replace with API call later
const mockNewsItems: NewsItem[] = [
    {
        id: "1",
        date: "3 ธันวาคม 2567",
        title: "เปิดตัว Dooform 2.0 พร้อมฟีเจอร์ AI ใหม่",
        description: "อัปเดตครั้งใหญ่พร้อมระบบ AI ที่ช่วยกรอกฟอร์มอัตโนมัติ และเทมเพลตใหม่กว่า 50 รายการ",
        category: "Product",
        image: "/cover-1.webp",
        href: "/news/dooform-2-launch",
    },
    {
        id: "2",
        date: "28 พฤศจิกายน 2567",
        title: "แนะนำการใช้งานเทมเพลตสัญญาจ้างงาน",
        description: "คู่มือการใช้งานเทมเพลตสัญญาจ้างงานอย่างละเอียด พร้อมตัวอย่างการกรอกข้อมูล",
        category: "Tutorial",
        image: "/cover-1.webp",
        href: "/news/contract-template-guide",
    },
    {
        id: "3",
        date: "20 พฤศจิกายน 2567",
        title: "Dooform รองรับการส่งออกเป็น PDF แล้ว",
        description: "ตอนนี้คุณสามารถส่งออกเอกสารเป็นไฟล์ PDF ได้โดยตรงจากระบบ",
        category: "Feature",
        image: "/cover-1.webp",
        href: "/news/pdf-export-feature",
    },
];

function ArrowRightIcon({ className }: { className?: string }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M5 12H19M19 12L12 5M19 12L12 19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function NewsCard({ item }: { item: NewsItem }) {
    const [imageError, setImageError] = useState(false);

    return (
        <article className="group flex flex-col gap-6 border-b border-border-default py-8 first:pt-0 last:border-b-0 md:flex-row md:gap-8">
            {/* Content - Left side on desktop */}
            <div className="order-2 flex flex-1 flex-col gap-4 md:order-1">
                {/* Date */}
                <p className="text-caption text-text-muted font-medium tracking-wide">
                    {item.date}
                </p>

                {/* Title & Description */}
                <div className="flex flex-col gap-3">
                    <Link href={item.href} className="group/link">
                        <h3 className="text-h4 text-foreground group-hover/link:text-primary transition-colors">
                            {item.title}
                        </h3>
                    </Link>
                    <p className="text-body-sm text-text-muted">
                        {item.description}
                    </p>
                </div>

                {/* Category & Read button */}
                <div className="flex items-center justify-between gap-3 mt-auto pt-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-caption font-medium bg-primary/10 text-primary">
                        {item.category}
                    </span>
                    <Link
                        href={item.href}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-default text-caption font-medium text-text-default hover:bg-surface-alt hover:border-primary/30 transition-colors group-hover:bg-surface-alt"
                    >
                        อ่านเพิ่มเติม
                        <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>

            {/* Image - Right side on desktop */}
            <div className="order-1 flex-shrink-0 md:order-2 md:w-[280px] lg:w-[360px]">
                <Link href={item.href} className="block overflow-hidden rounded-lg">
                    <div className="relative aspect-[16/10] bg-surface-alt">
                        {!imageError ? (
                            <Image
                                src={item.image}
                                alt={item.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-surface-alt">
                                <svg
                                    className="w-12 h-12 text-border-default"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                </Link>
            </div>
        </article>
    );
}

export default function LatestNews({ background = "default" }: LatestNewsProps) {
    const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

    return (
        <section className={`w-full ${bgClass} font-sans`}>
            <div className="container-main section-padding">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-h2 text-foreground">ข่าวสารล่าสุด</h2>
                    <Link
                        href="/news"
                        className="inline-flex items-center gap-2 text-body-sm text-primary hover:underline"
                    >
                        ดูทั้งหมด
                        <ArrowRightIcon className="w-4 h-4" />
                    </Link>
                </div>

                {/* News List */}
                <div className="border-t border-border-default">
                    {mockNewsItems.map((item) => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
