import { Metadata } from "next";
import { API_BASE_URL } from "@/lib/api/types";
import FormDetailClient from "./FormDetailClient";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dooform.com";

// Fetch template data server-side for metadata
async function getTemplate(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/templates/${id}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Generate dynamic metadata for form detail pages
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const template = await getTemplate(id);

  if (!template) {
    return {
      title: "ไม่พบเทมเพลต",
      description: "ไม่พบเทมเพลตที่ต้องการ",
    };
  }

  const templateName = template.display_name || template.name;
  const title = `แปล ${templateName} ด้วยดูฟอร์ม`;
  const description =
    template.description ||
    `แปลและกรอก${templateName}ไทย-อังกฤษออนไลน์ จัดรูปแบบอัตโนมัติ ยื่นสถานทูตได้ทันที`;

  // Generate OG image URL with title
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/forms/${id}`,
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
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TemplateDetailPage({ params }: PageProps) {
  return <FormDetailClient params={params} />;
}
