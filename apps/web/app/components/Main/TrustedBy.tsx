"use client";

import Image from "next/image";
import { useState } from "react";

interface Partner {
    id: string;
    name: string;
    logo?: string;
}

interface TrustedByProps {
    background?: "default" | "alt";
}

// Mock partner data - replace with real logos later
const partners: Partner[] = [
    { id: "1", name: "SCB", logo: "/logos/scb.svg" },
    { id: "2", name: "PTT", logo: "/logos/ptt.svg" },
    { id: "3", name: "AIS", logo: "/logos/ais.svg" },
    { id: "4", name: "TRUE", logo: "/logos/true.svg" },
    { id: "5", name: "KBANK", logo: "/logos/kbank.svg" },
    { id: "6", name: "CP", logo: "/logos/cp.svg" },
];

function LogoCard({ partner }: { partner: Partner }) {
    const [imageError, setImageError] = useState(true); // Default to text fallback

    return (
        <div className="relative flex items-center justify-center">
            <div className="h-16 sm:h-[4.5rem] md:h-20 px-4 flex w-full items-center justify-center rounded-xl bg-surface-alt border border-border-default">
                {!imageError && partner.logo ? (
                    <Image
                        src={partner.logo}
                        alt={`${partner.name} logo`}
                        width={120}
                        height={48}
                        className="h-8 sm:h-9 md:h-10 w-auto object-contain"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className="text-lg sm:text-xl md:text-2xl font-bold text-text-muted tracking-wide">
                        {partner.name}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function TrustedBy({ background = "default" }: TrustedByProps) {
    const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

    return (
        <section className={`w-full ${bgClass} font-sans`}>
            <div className="container-main section-padding">
                <div className="text-center">
                    {/* Heading */}
                    <h2 className="text-body-sm text-text-muted mb-8">
                        ได้รับความไว้วางใจจากองค์กรชั้นนำ
                    </h2>

                    {/* Logo Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {partners.map((partner) => (
                            <LogoCard key={partner.id} partner={partner} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
