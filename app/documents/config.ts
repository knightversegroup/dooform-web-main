export interface DocItem {
    label: string;
    href?: string;
    description?: string;
    order?: number;
    children?: DocItem[];
}

export interface DocCategory {
    category: string;
    order?: number;
    items: DocItem[];
}

export interface DocsConfig {
    title: string;
    basePath: string;
}

export const docsConfig: DocsConfig = {
    title: "Documents",
    basePath: "/documents",
};

// Convert folder name to readable label (e.g., "creating-forms" -> "Creating Forms")
export function folderToLabel(folder: string): string {
    return folder
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

// Convert pathname to label for breadcrumb
export function pathnameToLabel(pathname: string): string {
    if (pathname === "/documents") return "Getting Started";
    const segment = pathname.split("/").pop() || "";
    return folderToLabel(segment);
}

interface BreadcrumbItem {
    label: string;
    href?: string;
}

// Helper function to get breadcrumb items from path
export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    if (pathname.startsWith("/documents")) {
        items.push({ label: docsConfig.title, href: docsConfig.basePath });

        if (pathname !== docsConfig.basePath) {
            // Split the path after /documents/ and create breadcrumb for each segment
            const segments = pathname.replace("/documents/", "").split("/");
            let currentPath = "/documents";

            segments.forEach((segment, index) => {
                currentPath += `/${segment}`;
                const isLast = index === segments.length - 1;

                items.push({
                    label: folderToLabel(segment),
                    href: isLast ? undefined : currentPath,
                });
            });
        } else {
            items.push({ label: "Getting Started" });
        }
    }

    return items;
}

// Helper to get current page title
export function getPageTitle(pathname: string): string {
    return pathnameToLabel(pathname);
}
