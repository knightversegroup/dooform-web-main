import type { Metadata } from "next";
import {
  IBM_Plex_Sans_Thai,
  IBM_Plex_Sans_Thai_Looped,
  Prompt,
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { CookieConsentProvider } from "@/lib/cookie/context";
import { CookieConsentBanner, Analytics } from "./components/CookieConsent";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dooform.com";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSansThaiLooped = IBM_Plex_Sans_Thai_Looped({
  variable: "--font-ibm-plex-sans-thai-looped",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default:
      "Dooform | แปลเอกสารราชการไทย-อังกฤษ กรอกฟอร์มอัตโนมัติ ยื่นวีซ่า สถานทูต",
    template: "%s | Dooform - แปลเอกสารราชการออนไลน์",
  },
  description:
    "Dooform แพลตฟอร์มแปลและกรอกเอกสารราชการไทย-อังกฤษออนไลน์ รองรับบัตรประชาชน ทะเบียนบ้าน สูติบัตร ทะเบียนสมรส ใบขับขี่ หนังสือเดินทาง จัดรูปแบบอัตโนมัติตามมาตรฐานสากล ยื่นสถานทูตได้ทันที ประหยัดเวลา ลดข้อผิดพลาด API สำหรับธุรกิจ",
  keywords: [
    // Primary Thai Keywords
    "แปลเอกสารราชการ",
    "แปลเอกสารราชการออนไลน์",
    "กรอกเอกสารราชการออนไลน์",
    "แปลบัตรประชาชน",
    "แปลทะเบียนบ้าน",
    "แปลสูติบัตร",
    "แปลทะเบียนสมรส",
    "แปลใบขับขี่",
    "แปลหนังสือเดินทาง",
    "แปลใบเปลี่ยนชื่อ",
    "แปลใบรับรองโสด",
    "แปลใบมรณบัตร",
    // Visa & Embassy Keywords
    "แปลเอกสารยื่นวีซ่า",
    "แปลเอกสารสถานทูต",
    "เอกสารวีซ่าอเมริกา",
    "เอกสารวีซ่าอังกฤษ",
    "เอกสารวีซ่าออสเตรเลีย",
    "เอกสารวีซ่าแคนาดา",
    "เอกสารวีซ่าเชงเก้น",
    "เอกสารวีซ่าญี่ปุ่น",
    // Service Keywords
    "แปลเอกสารรับรอง",
    "รับรองเอกสารแปล",
    "แบบฟอร์มแปลเอกสาร",
    "จัดหน้าเอกสารแปล",
    "แปลเอกสารด่วน",
    "แปลเอกสารราคาถูก",
    // English Keywords
    "Thai to English document translation",
    "Thai official document translation",
    "translate Thai ID card",
    "translate Thai house registration",
    "translate Thai birth certificate",
    "translate Thai marriage certificate",
    "visa document translation Thailand",
    "embassy document translation",
    "certified translation Thailand",
    "document filling automation",
    "Thai document API",
    // Brand Keywords
    "Dooform",
    "ดูฟอร์ม",
  ],
  authors: [{ name: "Knight Consultant Worldwide Company Limited" }],
  creator: "Dooform by Knight Consultant",
  publisher: "Knight Consultant Worldwide Company Limited",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      "th-TH": baseUrl,
      "en-US": `${baseUrl}/en`,
    },
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    alternateLocale: "en_US",
    url: baseUrl,
    siteName: "Dooform",
    title: "Dooform | กรอกและแปลเอกสารราชการไทย-อังกฤษ ยื่นวีซ่าสถานทูต",
    description:
      "แพลตฟอร์มกรอกและแปลเอกสารราชการไทย-อังกฤษออนไลน์ รองรับบัตรประชาชน ทะเบียนบ้าน สูติบัตร ทะเบียนสมรส จัดรูปแบบอัตโนมัติตามมาตรฐานสากล ยื่นสถานทูตได้ทันที ประหยัดเวลา ลดข้อผิดพลาด",
    images: [
      {
        url: "/opengraph-df.webp",
        width: 1200,
        height: 630,
        alt: "Dooform - แปลและกรอกเอกสารราชการออนไลน์",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dooform | กรอกและแปลเอกสารราชการไทย-อังกฤษ ยื่นวีซ่าสถานทูต",
    description:
      "แพลตฟอร์มกรอกและแปลเอกสารราชการไทย-อังกฤษออนไลน์ รองรับบัตรประชาชน ทะเบียนบ้าน สูติบัตร ทะเบียนสมรส จัดรูปแบบอัตโนมัติ ยื่นสถานทูตได้ทันที",
    images: ["/opengraph-df.webp"],
    site: "@dooform",
    creator: "@dooform",
  },
  category: "Business",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "Dooform",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.svg`,
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        availableLanguage: ["Thai", "English"],
      },
      sameAs: [
        "https://www.facebook.com/dooform",
        "https://twitter.com/dooform",
        "https://www.linkedin.com/company/dooform",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "Dooform",
      publisher: {
        "@id": `${baseUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${baseUrl}/#software`,
      name: "Dooform",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Document Translation & Form Filling",
      operatingSystem: "Web",
      description:
        "แพลตฟอร์มกรอกและแปลเอกสารราชการไทย-อังกฤษออนไลน์ รองรับบัตรประชาชน ทะเบียนบ้าน สูติบัตร ทะเบียนสมรส จัดรูปแบบอัตโนมัติตามมาตรฐานสากล ยื่นสถานทูตได้ทันที",
      url: baseUrl,
      author: {
        "@id": `${baseUrl}/#organization`,
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "THB",
        availability: "https://schema.org/InStock",
      },
      featureList: [
        "แปลเอกสารราชการไทย-อังกฤษ",
        "กรอกเอกสารอัตโนมัติ",
        "รองรับบัตรประชาชน ทะเบียนบ้าน สูติบัตร ทะเบียนสมรส",
        "จัดรูปแบบตามมาตรฐานสากล",
        "Webhooks API สำหรับธุรกิจ",
        "ยื่นสถานทูตได้ทันที",
      ],
    },
    {
      "@type": "Service",
      "@id": `${baseUrl}/#service`,
      name: "บริการแปลเอกสารราชการ",
      serviceType: "Document Translation",
      provider: {
        "@id": `${baseUrl}/#organization`,
      },
      areaServed: {
        "@type": "Country",
        name: "Thailand",
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "เอกสารที่รองรับ",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "แปลบัตรประชาชน",
              description: "แปลบัตรประชาชนไทยเป็นภาษาอังกฤษ",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "แปลทะเบียนบ้าน",
              description: "แปลทะเบียนบ้านไทยเป็นภาษาอังกฤษ",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "แปลสูติบัตร",
              description: "แปลสูติบัตรไทยเป็นภาษาอังกฤษ",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "แปลทะเบียนสมรส",
              description: "แปลทะเบียนสมรสไทยเป็นภาษาอังกฤษ",
            },
          },
        ],
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${baseUrl}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "Dooform รองรับเอกสารประเภทใดบ้าง?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Dooform รองรับเอกสารราชการไทยหลายประเภท เช่น บัตรประชาชน ทะเบียนบ้าน สูติบัตร ทะเบียนสมรส ใบขับขี่ หนังสือเดินทาง ใบเปลี่ยนชื่อ และใบรับรองโสด",
          },
        },
        {
          "@type": "Question",
          name: "สามารถใช้เอกสารที่แปลจาก Dooform ยื่นวีซ่าได้หรือไม่?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "ได้ เอกสารที่แปลจาก Dooform จัดรูปแบบตามมาตรฐานสากล สามารถใช้ยื่นสถานทูตและสำนักงานตรวจคนเข้าเมืองได้ทันที",
          },
        },
        {
          "@type": "Question",
          name: "Dooform มี API สำหรับธุรกิจหรือไม่?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "มี Dooform มี API และ Webhooks สำหรับธุรกิจที่ต้องการเชื่อมต่อระบบแปลเอกสารอัตโนมัติ",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="light" style={{ colorScheme: "light" }}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${ibmPlexSansThai.variable} ${ibmPlexSansThaiLooped.variable} ${prompt.variable} antialiased`}
      >
        <CookieConsentProvider>
          <Analytics />
          <AuthProvider>
            {children}
          </AuthProvider>
          <CookieConsentBanner />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
