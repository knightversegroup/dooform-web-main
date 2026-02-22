import { DocBreadcrumb } from "./DocBreadcrumb";

export default function DocumentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-background font-sans min-h-screen">
            <div className="container-main section-padding">
                <main className="flex-1 min-w-0">
                    <article className="font-sans">
                        <DocBreadcrumb />
                        <div className="mt-6">
                            {children}
                        </div>
                    </article>
                </main>
            </div>
        </div>
    );
}
