import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dooform.com";

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

export default function sitemap(): MetadataRoute.Sitemap {
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

  // Image sitemap entries for OG images (helps Google discover dynamic images)
  const ogImagePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/api/og?page=home&title=Dooform`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  return [...staticPages, ...documentSitemap];
}
