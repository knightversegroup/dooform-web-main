import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import { useMDXComponents } from "@/mdx-components";

// Allow dynamic params that weren't generated at build time
export const dynamicParams = true;

interface PageProps {
    params: Promise<{
        slug: string[];
    }>;
}

// Get MDX content from file path
async function getMdxContent(slugPath: string[]) {
    const documentsDir = path.join(process.cwd(), "app/documents");
    const lastSegment = slugPath[slugPath.length - 1];

    // Try different file patterns
    const possiblePaths = [
        // Direct MDX file: /documents/general/page1 -> general/page1.mdx
        path.join(documentsDir, ...slugPath) + ".mdx",
        path.join(documentsDir, ...slugPath) + ".md",
        // Folder with page file: /documents/general/creating-forms -> general/creating-forms/page.mdx
        path.join(documentsDir, ...slugPath, "page.mdx"),
        path.join(documentsDir, ...slugPath, "page.md"),
        // Folder with same-name file: /documents/general/creating-forms -> general/creating-forms/creating-forms.mdx
        path.join(documentsDir, ...slugPath, `${lastSegment}.mdx`),
        path.join(documentsDir, ...slugPath, `${lastSegment}.md`),
    ];

    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            const source = fs.readFileSync(filePath, "utf-8");
            return { source, filePath };
        }
    }

    return null;
}

// Generate static params for all MDX files
export async function generateStaticParams() {
    const documentsDir = path.join(process.cwd(), "app/documents");
    const params: { slug: string[] }[] = [];

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
                    if (entry.name === "page.mdx" || entry.name === "page.md" || fileNameWithoutExt === folderName) {
                        // Only add if we're in a subfolder
                        if (basePath.length > 0) {
                            params.push({ slug: basePath });
                        }
                    } else {
                        // Add the file path (without extension) as a param
                        params.push({ slug: [...basePath, fileNameWithoutExt] });
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
    return params;
}

export default async function DocumentPage({ params }: PageProps) {
    const { slug } = await params;
    const mdxData = await getMdxContent(slug);

    if (!mdxData) {
        notFound();
    }

    const components = useMDXComponents({});

    const { content } = await compileMDX({
        source: mdxData.source,
        components,
        options: {
            parseFrontmatter: true,
        },
    });

    return <>{content}</>;
}
