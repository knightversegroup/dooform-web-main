interface SectionProps {
    children: React.ReactNode;
    background?: "default" | "alt";
    className?: string;
}

export function Section({ children, background = "default", className = "" }: SectionProps) {
    const bgClass = background === "alt" ? "bg-surface-alt" : "bg-background";

    return (
        <section className={`${bgClass} font-sans ${className}`}>
            <div className="container-main section-padding">
                {children}
            </div>
        </section>
    );
}
