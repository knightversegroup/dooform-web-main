import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

import { API_BASE_URL } from "@/lib/api/types";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dooform.com";

// Template type for sitemap (minimal fields needed)
interface SitemapTemplate {
  id: string;
  updated_at?: string;
  created_at?: string;
}

interface DocumentType {
  id: string;
  templates?: SitemapTemplate[];
}

interface GroupedResponse {
  document_types?: DocumentType[];
  orphan_templates?: SitemapTemplate[];
}

// Fetch all templates from API for sitemap
async function getTemplatesForSitemap(): Promise<{ templates: SitemapTemplate[], documentTypes: DocumentType[] }> {
  try {
    const res = await fetch(`${API_BASE_URL}/templates?grouped=true`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) {
      console.error("Sitemap: Failed to fetch templates, status:", res.status);
      return { templates: [], documentTypes: [] };
    }
    const data: GroupedResponse = await res.json();

    // Extract templates from document_types and orphan_templates
    const templatesFromDocTypes = (data.document_types || []).flatMap(
      (dt) => dt.templates || []
    );
    const orphanTemplates = data.orphan_templates || [];

    return {
      templates: [...templatesFromDocTypes, ...orphanTemplates],
      documentTypes: data.document_types || [],
    };
  } catch (error) {
    console.error("Failed to fetch templates for sitemap:", error);
    return { templates: [], documentTypes: [] };
  }
}

// Get file modification time
function getFileModTime(filePath: string): Date {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtime;
  } catch {
    return new Date();
  }
}

// Get all MDX document slugs dynamically with modification times
function getDocumentPages(): { slug: string; lastMod: Date }[] {
  const documentsDir = path.join(process.cwd(), "app/documents");
  const pages: { slug: string; lastMod: Date }[] = [];

  function scanDir(dir: string, basePath: string[] = []) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const folderName = basePath[basePath.length - 1];

      for (const entry of entries) {
        // Skip the catch-all route folder and special files
        if (entry.name === "[...slug]" || entry.name.startsWith(".")) continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isFile() && /\.(mdx|md)$/.test(entry.name)) {
          const fileNameWithoutExt = entry.name.replace(/\.(mdx|md)$/, "");
          const lastMod = getFileModTime(fullPath);

          // page.mdx or same-name-as-folder.mdx -> folder route
          if (entry.name === "page.mdx" || entry.name === "page.md" || fileNameWithoutExt === folderName) {
            if (basePath.length > 0) {
              pages.push({
                slug: `/documents/${basePath.join("/")}`,
                lastMod,
              });
            }
          } else {
            pages.push({
              slug: `/documents/${[...basePath, fileNameWithoutExt].join("/")}`,
              lastMod,
            });
          }
        } else if (entry.isDirectory()) {
          scanDir(fullPath, [...basePath, entry.name]);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dir}:`, error);
    }
  }

  scanDir(documentsDir);
  return pages;
}

// Determine priority based on path depth and type
function getDocPriority(slug: string): number {
  // Legal/terms pages get lower priority
  if (slug.includes("Terms-of-Use")) return 0.4;

  // Top-level documentation pages
  const depth = slug.split("/").length - 2; // Remove /documents/ from count
  if (depth === 1) return 0.8;
  if (depth === 2) return 0.7;
  return 0.6;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // Static public pages with high priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/documents`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/forms`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Public auth pages (indexable)
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic document pages from MDX files with real modification times
  const documentPages = getDocumentPages();
  const documentSitemap: MetadataRoute.Sitemap = documentPages.map((page) => ({
    url: `${baseUrl}${page.slug}`,
    lastModified: page.lastMod.toISOString(),
    changeFrequency: "monthly" as const,
    priority: getDocPriority(page.slug),
  }));

  // Dynamic form/template pages from API
  const { templates, documentTypes } = await getTemplatesForSitemap();

  // Document type (template group) pages
  const templateGroupsSitemap: MetadataRoute.Sitemap = documentTypes.map((docType) => ({
    url: `${baseUrl}/templates/${docType.id}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // Individual form pages
  const formsSitemap: MetadataRoute.Sitemap = templates.map((template) => ({
    url: `${baseUrl}/forms/${template.id}`,
    lastModified: template.updated_at || template.created_at || currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...templateGroupsSitemap, ...documentSitemap, ...formsSitemap];
}
