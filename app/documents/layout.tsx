import { Sidebar, SidebarItem } from "@/app/components/ui/Sidebar";

const documentItems: SidebarItem[] = [
    { label: "Getting Started", href: "/documents" },
    { label: "Creating Forms", href: "/documents/creating-forms" },
    { label: "Question Types", href: "/documents/question-types" },
    { label: "Form Settings", href: "/documents/form-settings" },
    { label: "Sharing", href: "/documents/sharing" },
    { label: "Managing Responses", href: "/documents/responses" },
    { label: "Analytics", href: "/documents/analytics" },
    { label: "API Integration", href: "/documents/api-integration" },
    { label: "Webhooks", href: "/documents/webhooks" },
    { label: "Import/Export", href: "/documents/import-export" },
    { label: "FAQ", href: "/documents/faq" },
];

export default function DocumentsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-background font-sans min-h-screen">
            <div className="container-main section-padding">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    {/* Sidebar - Left column */}
                    <aside className="w-full lg:w-64 xl:w-72 shrink-0">
                        <div className="lg:sticky lg:top-24">
                            <Sidebar title="Documents" items={documentItems} />
                        </div>
                    </aside>

                    {/* Main content - Right column */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
