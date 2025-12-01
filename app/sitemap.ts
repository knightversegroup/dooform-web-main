import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const baseUrl = "https://dooform.com";

// Get all MDX document slugs dynamically
function getDocumentSlugs(): string[] {
  const documentsDir = path.join(process.cwd(), "app/documents");
  const slugs: string[] = [];

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

          // page.mdx or same-name-as-folder.mdx -> folder route
          if (
            entry.name === "page.mdx" ||
            entry.name === "page.md" ||
            fileNameWithoutExt === folderName
          ) {
            if (basePath.length > 0) {
              slugs.push(`/documents/${basePath.join("/")}`);
            }
          } else {
            slugs.push(
              `/documents/${[...basePath, fileNameWithoutExt].join("/")}`
            );
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
  return slugs;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date().toISOString();

  // Static public pages
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
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Dynamic document pages from MDX files
  const documentSlugs = getDocumentSlugs();
  const documentPages: MetadataRoute.Sitemap = documentSlugs.map((slug) => ({
    url: `${baseUrl}${slug}`,
    lastModified: currentDate,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...documentPages];
}
