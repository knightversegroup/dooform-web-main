import Image from "next/image";
import { Button } from "@/app/components/ui/Button";

interface BannerProps {
    background?: "default" | "alt";
}

export default function Banner({ background = "alt" }: BannerProps) {
    const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

    return (
        <section className={`w-full ${bgClass} font-sans`}>
            <div className="container-main section-padding">
                <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
                    {/* Content - Left side */}
                    <div className="flex-1 lg:max-w-[50%]">
                        <h1 className="text-h1 text-foreground">
                            หมดปัญหาจัดการเอกสารแบบเดิมๆ ด้วย Dooform
                        </h1>
                        <p className="mt-6 text-body-lg text-text-default">
                            ลดเวลากับการจัดฟอร์แมตเอกสารให้กับบริษัทของคุณด้วยเครื่องมือสร้างฟอร์มออนไลน์ที่ใช้งานง่ายและรวดเร็ว
                        </p>
                        <div className="mt-8">
                            <Button href="#" className="px-6 py-3">
                                เริ่มต้นใช้งาน Dooform
                            </Button>
                        </div>
                    </div>

                    {/* Image - Right side with Mac window frame */}
                    <div className="flex-1">
                        <div className="bg-[#e8e8e8] rounded-xl shadow-2xl overflow-hidden">
                            {/* Mac window title bar */}
                            <div className="flex items-center gap-2 px-4 py-3 bg-[#e8e8e8] border-b border-border-default">
                                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                                <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
                            </div>
                            {/* Window content */}
                            <Image
                                src="/example.webp"
                                alt=""
                                width={600}
                                height={500}
                                className="w-full h-auto"
                                aria-hidden="true"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
