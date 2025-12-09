// Structured data (JSON-LD) generators for SEO

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dooform.com";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

// Generate BreadcrumbList schema
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

// Generate Article schema for documentation pages
export function generateArticleSchema({
  title,
  description,
  path,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${baseUrl}${path}`,
    author: {
      "@type": "Organization",
      name: "Dooform",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Dooform",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.svg`,
      },
    },
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}${path}`,
    },
  };
}

// Generate HowTo schema for tutorial pages
export function generateHowToSchema({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    description,
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}

// Generate ItemList schema for form templates
export function generateFormListSchema(
  forms: { id: string; name: string; description: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "แบบฟอร์มเอกสารราชการ",
    description: "รายการแบบฟอร์มเอกสารราชการที่รองรับการแปลไทย-อังกฤษ",
    numberOfItems: forms.length,
    itemListElement: forms.map((form, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: form.name,
        description: form.description,
        url: `${baseUrl}/forms?id=${form.id}`,
        brand: {
          "@type": "Brand",
          name: "Dooform",
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "THB",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };
}

// Generate WebApplication schema for the app
export function generateWebApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Dooform",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "Requires JavaScript",
    url: baseUrl,
    description:
      "แพลตฟอร์มแปลและกรอกเอกสารราชการไทย-อังกฤษออนไลน์",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "THB",
    },
    featureList: [
      "แปลเอกสารราชการไทย-อังกฤษ",
      "กรอกเอกสารอัตโนมัติ",
      "จัดรูปแบบตามมาตรฐานสากล",
      "ยื่นสถานทูตได้ทันที",
    ],
    screenshot: `${baseUrl}/opengraph-df.webp`,
  };
}

// Component to render JSON-LD script tag
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Generate structured data for forms page
export function generateFormsPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "แบบฟอร์มเอกสารราชการ",
    description:
      "เลือกแบบฟอร์มเอกสารราชการที่ต้องการแปล รองรับบัตรประชาชน ทะเบียนบ้าน สูติบัตร ทะเบียนสมรส ใบขับขี่",
    url: `${baseUrl}/forms`,
    mainEntity: {
      "@type": "ItemList",
      name: "รายการแบบฟอร์มเอกสาร",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "Service",
            name: "แปลบัตรประชาชน",
            description: "แบบฟอร์มแปลบัตรประชาชนไทยเป็นภาษาอังกฤษ",
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "Service",
            name: "แปลทะเบียนบ้าน",
            description: "แบบฟอร์มแปลทะเบียนบ้านไทยเป็นภาษาอังกฤษ",
          },
        },
        {
          "@type": "ListItem",
          position: 3,
          item: {
            "@type": "Service",
            name: "แปลสูติบัตร",
            description: "แบบฟอร์มแปลสูติบัตรไทยเป็นภาษาอังกฤษ",
          },
        },
        {
          "@type": "ListItem",
          position: 4,
          item: {
            "@type": "Service",
            name: "แปลทะเบียนสมรส",
            description: "แบบฟอร์มแปลทะเบียนสมรสไทยเป็นภาษาอังกฤษ",
          },
        },
      ],
    },
  };
}

// Generate structured data for documents page
export function generateDocumentsPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "คู่มือการใช้งาน Dooform",
    description:
      "เอกสารและคู่มือการใช้งาน Dooform แพลตฟอร์มแปลเอกสารราชการไทย-อังกฤษ",
    url: `${baseUrl}/documents`,
    author: {
      "@type": "Organization",
      name: "Dooform",
    },
    publisher: {
      "@type": "Organization",
      name: "Dooform",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/documents`,
    },
  };
}
