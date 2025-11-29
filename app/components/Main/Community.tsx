"use client";

import { MessageCircle, Users, HelpCircle, ArrowRight } from "lucide-react";

interface CommunityTile {
    icon: React.ReactNode;
    title: string;
    description: string;
    linkText: string;
    href: string;
}

const communityTiles: CommunityTile[] = [
    {
        icon: <MessageCircle className="w-6 h-6 text-primary" />,
        title: "ชุมชน Dooform",
        description: "พูดคุยแลกเปลี่ยนความคิดเห็นกับผู้ใช้งานคนอื่นๆ",
        linkText: "เข้าร่วมชุมชน",
        href: "#",
    },
    {
        icon: <Users className="w-6 h-6 text-primary" />,
        title: "ทีมสนับสนุน",
        description: "ติดต่อทีมงานเพื่อขอความช่วยเหลือในการใช้งาน",
        linkText: "ติดต่อทีมงาน",
        href: "#",
    },
    {
        icon: <HelpCircle className="w-6 h-6 text-primary" />,
        title: "ศูนย์ช่วยเหลือ",
        description: "ส่งคำถามหรือข้อเสนอแนะเพื่อพัฒนาระบบ",
        linkText: "ส่งคำถาม",
        href: "#",
    },
];

interface CommunityProps {
    background?: "default" | "alt";
}

export default function Community({ background = "alt" }: CommunityProps) {
    const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

    return (
        <section className={`w-full ${bgClass} font-sans`}>
            <div className="container-main section-padding">
                {/* Section Title */}
                <h2 className="text-h2 text-foreground mb-12">
                    ชุมชนผู้ใช้งาน
                </h2>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                    {/* Left side - Video */}
                    <div className="flex-1 lg:max-w-[55%]">
                        <div className="bg-surface-alt rounded-xl overflow-hidden aspect-video">
                            <video
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                                poster="/example.webp"
                                suppressHydrationWarning
                            >
                                <source src="/video.mp4" type="video/mp4" />
                            </video>
                        </div>
                    </div>

                    {/* Right side - Info Tiles */}
                    <div className="flex-1 flex flex-col gap-8">
                        {communityTiles.map((tile, index) => (
                            <div key={index} className="flex gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-surface-alt rounded-lg">
                                    {tile.icon}
                                </div>

                                {/* Content */}
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-h4 text-foreground">
                                        {tile.title}
                                    </h3>
                                    <p className="text-body-sm text-text-muted">
                                        {tile.description}
                                    </p>
                                    <a
                                        href={tile.href}
                                        className="inline-flex items-center gap-1 text-body-sm text-primary hover:underline mt-1"
                                    >
                                        {tile.linkText}
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
