import type { MDXComponents } from "mdx/types";
import Link from "next/link";

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        // Headings
        h1: ({ children, ...props }) => (
            <h1 className="text-h1 text-foreground mt-8 mb-4" {...props}>
                {children}
            </h1>
        ),
        h2: ({ children, id, ...props }) => (
            <h2 id={id} className="text-h2 text-foreground mt-12 mb-4" {...props}>
                {id ? (
                    <a href={`#${id}`} className="hover:text-primary">
                        {children}
                    </a>
                ) : (
                    children
                )}
            </h2>
        ),
        h3: ({ children, id, ...props }) => (
            <h3 id={id} className="text-h3 text-foreground mt-8 mb-3" {...props}>
                {id ? (
                    <a href={`#${id}`} className="hover:text-primary">
                        {children}
                    </a>
                ) : (
                    children
                )}
            </h3>
        ),
        h4: ({ children, ...props }) => (
            <h4 className="text-h4 text-foreground mt-6 mb-2" {...props}>
                {children}
            </h4>
        ),

        // Paragraphs and text
        p: ({ children, ...props }) => (
            <p className="text-body text-text-default mb-4" {...props}>
                {children}
            </p>
        ),
        strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
                {children}
            </strong>
        ),

        // Links
        a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith("http");
            if (isExternal) {
                return (
                    <a
                        href={href}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                    >
                        {children}
                    </a>
                );
            }
            return (
                <Link href={href || "#"} className="text-primary hover:underline" {...props}>
                    {children}
                </Link>
            );
        },

        // Lists
        ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside text-body text-text-default space-y-2 mb-6 ml-4" {...props}>
                {children}
            </ul>
        ),
        ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside text-body text-text-default space-y-3 mb-6 ml-4" {...props}>
                {children}
            </ol>
        ),
        li: ({ children, ...props }) => (
            <li className="text-text-default" {...props}>
                {children}
            </li>
        ),

        // Code
        code: ({ children, ...props }) => (
            <code
                className="bg-surface-alt text-primary px-1.5 py-0.5 rounded text-body-sm font-mono"
                {...props}
            >
                {children}
            </code>
        ),
        pre: ({ children, ...props }) => (
            <pre
                className="bg-surface-alt p-4 rounded-lg overflow-x-auto mb-6 text-body-sm font-mono"
                {...props}
            >
                {children}
            </pre>
        ),

        // Blockquote
        blockquote: ({ children, ...props }) => (
            <blockquote
                className="border-l-4 border-primary pl-4 my-6 text-text-muted italic"
                {...props}
            >
                {children}
            </blockquote>
        ),

        // Horizontal rule
        hr: (props) => <hr className="my-8 border-border-default" {...props} />,

        // Table
        table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-6">
                <table className="w-full text-body" {...props}>
                    {children}
                </table>
            </div>
        ),
        thead: ({ children, ...props }) => (
            <thead className="bg-surface-alt" {...props}>
                {children}
            </thead>
        ),
        th: ({ children, ...props }) => (
            <th className="px-4 py-3 text-left font-semibold text-foreground border-b border-border-default" {...props}>
                {children}
            </th>
        ),
        td: ({ children, ...props }) => (
            <td className="px-4 py-3 text-text-default border-b border-border-default" {...props}>
                {children}
            </td>
        ),

        ...components,
    };
}
