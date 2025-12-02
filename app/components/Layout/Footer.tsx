import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const footerLinks = {
    application: {
        title: "เกี่ยวกับแอปพลิเคชั่น",
        links: [
            { label: "รายการเอกสาร", href: "/documents" },
            { label: "แบบฟอร์มทั้งหมด", href: "/forms" },
        ],
    },
    legal: {
        title: "ข้อบังคับทางกฎหมาย",
        links: [
            { label: "นโยบายคุกกี้", href: "/documents/Terms-of-Use/cookie-policy" },
            { label: "นโยบายความเป็นส่วนตัว", href: "/documents/Terms-of-Use/privacy-notice" },
        ],
    },
};

export default function Footer() {
    return (
        <footer className="flex w-full justify-between font-sans text-sm">
            <div className="container-main section-padding-sm">
                <div className="flex flex-col items-start gap-6 text-foreground">
                    {/* Main content row */}
                    <div className="flex w-full flex-col items-start justify-between gap-6 lg:flex-row lg:gap-2">
                        {/* Brand section */}
                        <div className="flex shrink-0 flex-col items-start justify-center gap-2">
                            <Link href="/">
                                <Image
                                    src="/logo.svg"
                                    alt="Dooform logo"
                                    width={120}
                                    height={32}
                                    className="my-2 h-8"
                                />
                            </Link>
                            <div className="flex flex-col gap-2 text-text-muted">
                                <p>
                                    © {new Date().getFullYear()} Dooform by Knight Consultant
                                    <br />
                                    Under License of Rinkai
                                </p>
                            </div>
                        </div>

                        {/* Links grid */}
                        <div className="grid w-full grid-cols-2 items-start gap-6 md:grid-cols-4 lg:flex lg:justify-end lg:gap-12">
                            {Object.values(footerLinks).map((section) => (
                                <ul key={section.title} className="flex flex-col gap-2">
                                    <li className="font-semibold">{section.title}</li>
                                    {section.links.map((link) => (
                                        <li key={link.href + link.label}>
                                            <Link
                                                href={link.href}
                                                className="text-text-muted hover:text-foreground transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ))}
                        </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex w-full flex-col items-center justify-between gap-2 border-t border-border-default pt-6 sm:flex-row">
                        <ul className="flex flex-col items-start justify-start">
                            <li className="flex items-center gap-1">
                                <a
                                    href="https://www.knightvisahelppoint.com/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-text-muted hover:text-foreground transition-colors"
                                >
                                    knight consultant worldwide company limited
                                </a>
                                <ArrowUpRight className="h-4 w-4 text-text-muted" />
                            </li>
                        </ul>
                        <p className="text-text-muted text-center sm:text-right">
                            การใช้งานเว็บไซต์นี้นับว่าคุณได้ยอมรับเงื่อนไขในการใช้งานเรียบร้อย
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
