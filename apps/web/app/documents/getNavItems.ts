import fs from "fs";
import path from "path";
import { DocItem, DocCategory, folderToLabel } from "./config";

// Extract title from MDX file content (first # heading)
function extractTitleFromMdx(filePath: string): string | null {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const match = content.match(/^#\s+(.+)$/m);
        return match ? match[1].trim() : null;
    } catch {
        return null;
    }
}

// Convert filename to label (e.g., "page1.mdx" -> "Page1", or use MDX title)
function fileToLabel(filename: string, filePath?: string): string {
    // Try to extract title from MDX content first
    if (filePath) {
        const mdxTitle = extractTitleFromMdx(filePath);
        if (mdxTitle) return mdxTitle;
    }

    // Fallback to filename
    const name = filename.replace(/\.(mdx|md|tsx|ts|jsx|js)$/, "");
    return folderToLabel(name);
}

// Check if folder has an index file (page.mdx or same-name.mdx)
function getFolderIndexFile(dirPath: string, folderName: string): string | null {
    try {
        const entries = fs.readdirSync(dirPath);
        // Check for page.mdx first
        const pageFile = entries.find(f => /^page\.(mdx|md)$/.test(f));
        if (pageFile) return path.join(dirPath, pageFile);
        // Check for same-name file (e.g., creating-forms/creating-forms.mdx)
        const sameNameFile = entries.find(f => f === `${folderName}.mdx` || f === `${folderName}.md`);
        if (sameNameFile) return path.join(dirPath, sameNameFile);
        return null;
    } catch {
        return null;
    }
}

// Scan a directory and build nested item structure
function scanDirectory(dirPath: string, basePath: string, currentFolderName?: string): DocItem[] {
    const items: DocItem[] = [];

    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            // Skip special folders
            if (entry.name.startsWith("[") || entry.name.startsWith(".")) {
                continue;
            }

            const fullPath = path.join(dirPath, entry.name);

            if (entry.isFile() && /\.(mdx|md)$/.test(entry.name)) {
                const fileNameWithoutExt = entry.name.replace(/\.(mdx|md)$/, "");

                // Skip page.mdx or same-name file as it's the folder's index page
                if (entry.name === "page.mdx" || entry.name === "page.md" || fileNameWithoutExt === currentFolderName) {
                    continue;
                }

                // Regular MDX file - add as item
                items.push({
                    label: fileToLabel(entry.name, fullPath),
                    href: `${basePath}/${fileNameWithoutExt}`,
                });
            } else if (entry.isDirectory()) {
                const subDirPath = path.join(dirPath, entry.name);
                const subBasePath = `${basePath}/${entry.name}`;

                // Check if folder has an index file
                const indexFile = getFolderIndexFile(subDirPath, entry.name);

                // Get children recursively
                const children = scanDirectory(subDirPath, subBasePath, entry.name);

                if (children.length > 0 || indexFile) {
                    items.push({
                        label: indexFile ? fileToLabel(entry.name, indexFile) : folderToLabel(entry.name),
                        href: indexFile ? subBasePath : undefined,
                        children: children.length > 0 ? children : undefined,
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
    }

    // Sort items: items with href first, then alphabetically
    return items.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return a.label.localeCompare(b.label);
    });
}

// Get navigation items organized by categories (top-level folders)
export function getDocNavItems(): DocCategory[] {
    const documentsDir = path.join(process.cwd(), "app/documents");
    const categories: DocCategory[] = [];

    try {
        const entries = fs.readdirSync(documentsDir, { withFileTypes: true });

        for (const entry of entries) {
            // Skip special folders and files
            if (!entry.isDirectory() || entry.name.startsWith("[") || entry.name.startsWith(".")) {
                continue;
            }

            const categoryPath = path.join(documentsDir, entry.name);
            const categoryBasePath = `/documents/${entry.name}`;

            // Scan for items in this category folder
            const items = scanDirectory(categoryPath, categoryBasePath, entry.name);

            // Check if the category folder itself has an index file
            const categoryIndexFile = getFolderIndexFile(categoryPath, entry.name);

            if (categoryIndexFile) {
                items.unshift({
                    label: "Overview",
                    href: categoryBasePath,
                    order: -1,
                });
            }

            if (items.length > 0) {
                categories.push({
                    category: folderToLabel(entry.name),
                    items: items,
                });
            }
        }
    } catch (error) {
        console.error("Error scanning documents directory:", error);
    }

    // Sort categories alphabetically
    return categories.sort((a, b) => a.category.localeCompare(b.category));
}

// Flat list for backward compatibility if needed
export function getDocNavItemsFlat(): DocItem[] {
    const categories = getDocNavItems();
    const flatItems: DocItem[] = [];

    function flatten(items: DocItem[]) {
        for (const item of items) {
            if (item.href) {
                flatItems.push(item);
            }
            if (item.children) {
                flatten(item.children);
            }
        }
    }

    for (const cat of categories) {
        flatten(cat.items);
    }

    return flatItems;
}
