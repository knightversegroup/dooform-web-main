import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dooform.com";

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  page?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export function generatePageMetadata({
  title,
  description,
  path,
  page = "default",
  keywords = [],
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const url = `${baseUrl}${path}`;
  // OG image only needs title - searchParams.set handles encoding automatically
  const ogImageUrl = new URL("/api/og", baseUrl);
  ogImageUrl.searchParams.set("title", title);

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: "Dooform",
      locale: "th_TH",
      alternateLocale: "en_US",
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
      site: "@dooform",
      creator: "@dooform",
    },
  };
}

// Pre-defined metadata for common pages
export const pageMetadataConfigs: Record<string, PageMetadataOptions> = {
  documents: {
    title: "คู่มือการใช้งาน Dooform",
    description:
      "เอกสารและคู่มือการใช้งาน Dooform แพลตฟอร์มแปลเอกสารราชการไทย-อังกฤษ ครอบคลุมการสร้างฟอร์ม การกรอกข้อมูล และการจัดรูปแบบเอกสาร",
    path: "/documents",
    page: "documents",
    keywords: [
      "คู่มือ Dooform",
      "วิธีใช้ Dooform",
      "เอกสารประกอบ",
      "Dooform documentation",
      "Dooform guide",
    ],
  },
  forms: {
    title: "แบบฟอร์มเอกสารราชการ",
    description:
      "เลือกแบบฟอร์มเอกสารราชการที่ต้องการแปล รองรับบัตรประชาชน ทะเบียนบ้าน สูติบัตร ทะเบียนสมรส ใบขับขี่ และเอกสารอื่นๆ",
    path: "/forms",
    page: "forms",
    keywords: [
      "แบบฟอร์มเอกสารราชการ",
      "ฟอร์มแปลเอกสาร",
      "แบบฟอร์มบัตรประชาชน",
      "แบบฟอร์มทะเบียนบ้าน",
      "document forms",
      "translation forms",
    ],
  },
  login: {
    title: "เข้าสู่ระบบ",
    description:
      "เข้าสู่ระบบ Dooform เพื่อแปลและกรอกเอกสารราชการไทย-อังกฤษออนไลน์",
    path: "/login",
    page: "auth",
    noIndex: true,
  },
  register: {
    title: "สมัครสมาชิก",
    description:
      "สมัครสมาชิก Dooform ฟรี เพื่อเริ่มต้นแปลเอกสารราชการไทย-อังกฤษออนไลน์",
    path: "/register",
    page: "auth",
    keywords: [
      "สมัครสมาชิก Dooform",
      "สมัคร Dooform",
      "register Dooform",
      "sign up",
    ],
  },
  profile: {
    title: "โปรไฟล์ของฉัน",
    description: "จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชี Dooform ของคุณ",
    path: "/profile",
    page: "profile",
    noIndex: true,
  },
  history: {
    title: "ประวัติเอกสาร",
    description:
      "ดูประวัติการแปลเอกสารและดาวน์โหลดเอกสารที่แปลแล้วจาก Dooform",
    path: "/history",
    page: "history",
    noIndex: true,
  },
  stats: {
    title: "สถิติการใช้งาน",
    description: "ดูสถิติการใช้งาน Dooform ของคุณ รวมถึงจำนวนเอกสารที่แปล",
    path: "/stats",
    page: "stats",
    noIndex: true,
  },
  templates: {
    title: "กลุ่มเอกสาร",
    description:
      "เลือกกลุ่มเอกสารที่ต้องการใช้งาน รองรับเอกสารราชการหลากหลายประเภท เช่น บัตรประชาชน ทะเบียนบ้าน สูติบัตร และอื่นๆ",
    path: "/templates",
    page: "templates",
    keywords: [
      "กลุ่มเอกสาร",
      "ประเภทเอกสาร",
      "เทมเพลตเอกสาร",
      "document types",
      "template groups",
    ],
  },
  // NOTE: Documentation pages (MDX) use frontmatter for metadata
  // Add frontmatter to your MDX files like this:
  // ---
  // title: "Page Title"
  // description: "Page description"
  // keywords: ["keyword1", "keyword2"]
  // noIndex: false
  // ---
};

// Helper to generate metadata for documentation pages
export function generateDocMetadata(
  slug: string[],
  title?: string,
  description?: string,
  keywords?: string[],
  noIndex?: boolean
): Metadata {
  const path = `/documents/${slug.join("/")}`;
  const pageTitle = title || formatSlugToTitle(slug[slug.length - 1]);
  const pageDescription =
    description ||
    `${pageTitle} - คู่มือการใช้งาน Dooform แพลตฟอร์มแปลเอกสารราชการไทย-อังกฤษ`;

  // Merge default keywords with frontmatter keywords
  const defaultKeywords = ["คู่มือ Dooform", "วิธีใช้งาน", "documentation"];
  const mergedKeywords = keywords
    ? [...new Set([...keywords, ...defaultKeywords])]
    : [...defaultKeywords, pageTitle];

  return generatePageMetadata({
    title: pageTitle,
    description: pageDescription,
    path,
    page: "documents",
    keywords: mergedKeywords,
    noIndex,
  });
}

// Convert slug to readable title
export function formatSlugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
