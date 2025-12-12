import Link from "next/link";
import { Users, Layers, LayoutGrid, FileText } from "lucide-react";

interface FeatureTile {
    id: string;
    title: string;
    description: string;
    linkText: string;
    linkHref: string;
    icon: React.ReactNode;
}

const featureTiles: FeatureTile[] = [
    {
        id: "design-system",
        title: "ระบบออกแบบสำหรับใคร?",
        description:
            "ระบบออกแบบนี้สร้างขึ้นเพื่อบริการภาครัฐ ค้นหาขอบเขตการใช้งานเพื่อเริ่มต้นใช้งาน",
        linkText: "ขอบเขตการใช้งาน",
        linkHref: "/scope",
        icon: <Users className="w-12 h-12 text-primary" />,
    },
    {
        id: "fundamentals",
        title: "หลักการพื้นฐาน",
        description:
            "ระบบนี้ตั้งอยู่บนหลักการพื้นฐานที่จำเป็นต้องรู้ก่อนเริ่มใช้งาน",
        linkText: "ดูหลักการพื้นฐาน",
        linkHref: "/fundamentals",
        icon: <Layers className="w-12 h-12 text-primary" />,
    },
    {
        id: "components",
        title: "คลังส่วนประกอบ",
        description:
            "มีส่วนประกอบมากกว่า 50 รายการพร้อมใช้งานเพื่อเร่งโปรเจกต์ของคุณ",
        linkText: "ดูส่วนประกอบทั้งหมด",
        linkHref: "/components",
        icon: <LayoutGrid className="w-12 h-12 text-primary" />,
    },
    {
        id: "templates",
        title: "เทมเพลตและตัวอย่าง",
        description:
            "มีฟอร์มมาตรฐานและเทมเพลตหน้าอย่างเป็นทางการพร้อมนำไปใช้ซ้ำ",
        linkText: "ดูเทมเพลตทั้งหมด",
        linkHref: "/templates",
        icon: <FileText className="w-12 h-12 text-primary" />,
    },
];

function FeatureTileCard({ tile }: { tile: FeatureTile }) {
    return (
        <div className="flex flex-col h-full font-sans">
            <div className="mb-4">{tile.icon}</div>

            <div className="grow">
                <h3 className="text-h4 text-foreground mb-2">
                    {tile.title}
                </h3>
                <p className="text-body-sm text-text-default">
                    {tile.description}
                </p>
            </div>

            <div className="mt-4">
                <Link
                    href={tile.linkHref}
                    className="inline-flex items-center text-primary hover:underline font-medium text-body-sm group"
                >
                    {tile.linkText}
                    <span className="ml-1 transition-transform group-hover:translate-x-1">
                        →
                    </span>
                </Link>
            </div>
        </div>
    );
}

interface FeaturesProps {
    background?: "default" | "alt";
}

export default function Features({ background = "default" }: FeaturesProps) {
    const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

    return (
        <section className={`${bgClass} font-sans`}>
            <div className="container-main section-padding">
                <h2 className="text-h2 text-foreground mb-10">
                    ค้นพบ
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featureTiles.map((tile) => (
                        <div key={tile.id} className="p-4">
                            <FeatureTileCard tile={tile} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
