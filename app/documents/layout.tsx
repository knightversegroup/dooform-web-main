import { Sidebar } from "@/app/components/ui/Sidebar";
import { getDocNavItems } from "./getNavItems";
import { DocBreadcrumb } from "./DocBreadcrumb";

export default function DocumentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const categories = getDocNavItems();

    return (
        <div className="bg-background font-sans min-h-screen">
            <div className="container-main section-padding">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Sidebar - Left column */}
                    <aside className="w-full lg:w-64 xl:w-72 shrink-0">
                        <div className="lg:sticky lg:top-32">
                            <Sidebar categories={categories} />
                        </div>
                    </aside>

                    {/* Main content - Right column */}
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
        </div>
    );
}
