"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getBreadcrumbItems } from "./config";

export function DocBreadcrumb() {
    const pathname = usePathname();
    const items = getBreadcrumbItems(pathname);

    return <Breadcrumb items={items} />;
}
