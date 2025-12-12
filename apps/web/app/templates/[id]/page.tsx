import { Metadata } from "next";
import { apiClient } from "@/lib/api/client";
import TemplateGroupDetailClient from "./TemplateGroupDetailClient";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dooform.com";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;

    try {
        const documentType = await apiClient.getDocumentType(id, false);
        const title = documentType.name || "กลุ่มเอกสาร";
        const description = documentType.description || `${title} - กลุ่มแบบฟอร์มเอกสารราชการไทย`;

        // OG image with dynamic title
        const ogImageUrl = new URL("/api/og", baseUrl);
        ogImageUrl.searchParams.set("title", title);

        return {
            title,
            description,
            alternates: {
                canonical: `${baseUrl}/templates/${id}`,
            },
            openGraph: {
                title,
                description,
                url: `${baseUrl}/templates/${id}`,
                siteName: "Dooform",
                locale: "th_TH",
                type: "website",
                images: [
                    {
                        url: ogImageUrl.toString(),
                        width: 1200,
                        height: 630,
                        alt: title,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [ogImageUrl.toString()],
            },
        };
    } catch {
        return {
            title: "กลุ่มเอกสาร",
            description: "รายละเอียดกลุ่มเอกสารราชการ",
        };
    }
}

export default function TemplateGroupDetailPage({ params }: PageProps) {
    return <TemplateGroupDetailClient params={params} />;
}
