"use client";

import { use } from "react";
import { TemplateProvider } from "./TemplateContext";

export default function FormLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id: templateId } = use(params);

    return (
        <TemplateProvider templateId={templateId}>
            {children}
        </TemplateProvider>
    );
}
