"use client";

import { useRef, useEffect, useCallback } from "react";

interface DocumentPreviewProps {
    htmlContent: string;
    title?: string;
    showHeader?: boolean;
    className?: string;
}

export function DocumentPreview({
    htmlContent,
    title = "Document Preview",
    showHeader = true,
    className = "",
}: DocumentPreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const resizeIframe = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe?.contentDocument?.body) return;

        // Reset height first to get accurate scrollHeight
        iframe.style.height = "auto";

        // Get the actual content height
        const contentHeight = iframe.contentDocument.documentElement.scrollHeight;

        // Set minimum height and use content height if larger
        const minHeight = 800;
        iframe.style.height = `${Math.max(contentHeight, minHeight)}px`;
    }, []);

    useEffect(() => {
        // Resize when content changes
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            resizeIframe();

            // Also observe for dynamic content changes
            const doc = iframe.contentDocument;
            if (doc) {
                const observer = new MutationObserver(resizeIframe);
                observer.observe(doc.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                });

                // Cleanup observer on unmount
                return () => observer.disconnect();
            }
        };

        iframe.addEventListener("load", handleLoad);
        return () => iframe.removeEventListener("load", handleLoad);
    }, [resizeIframe]);

    // Check if HTML already has a complete document structure
    const hasDoctype = htmlContent.trim().toLowerCase().startsWith('<!doctype');
    const hasHtmlTag = /<html[\s>]/i.test(htmlContent);

    // Minimal styles that won't conflict with document styles
    const minimalStyles = `
        <style>
            /* Only base setup - won't override document styles */
            html, body {
                margin: 0;
                padding: 0;
                background: white;
            }
            body {
                padding: 15mm;
            }
            /* Highlight styles for active fields */
            mark {
                background-color: #fef08a;
                padding: 0 2px;
                border-radius: 2px;
            }
            mark.bg-yellow-300 {
                background-color: #fde047;
            }
        </style>
    `;

    // If HTML is already a complete document, inject minimal styles into head
    // Otherwise, wrap it properly
    let wrappedHtml: string;

    if (hasDoctype || hasHtmlTag) {
        // Inject our minimal styles into the existing document
        if (/<head[^>]*>/i.test(htmlContent)) {
            wrappedHtml = htmlContent.replace(
                /<head([^>]*)>/i,
                `<head$1>${minimalStyles}`
            );
        } else if (/<html[^>]*>/i.test(htmlContent)) {
            wrappedHtml = htmlContent.replace(
                /<html([^>]*)>/i,
                `<html$1><head>${minimalStyles}</head>`
            );
        } else {
            wrappedHtml = htmlContent;
        }
    } else {
        // Wrap fragment with minimal document structure
        wrappedHtml = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${minimalStyles}
</head>
<body>
${htmlContent}
</body>
</html>
        `.trim();
    }

    return (
        <div className={`h-full flex flex-col ${className}`}>
            {showHeader && title && (
                <h2 className="text-h4 text-foreground mb-4">{title}</h2>
            )}
            <div className="bg-white border border-border-default rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
                {showHeader && (
                    <div className="bg-surface-alt px-4 py-2 border-b border-border-default flex-shrink-0">
                        <span className="text-caption text-text-muted">
                            Document Preview
                        </span>
                    </div>
                )}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto bg-gray-100"
                >
                    <div className="p-4 min-h-full">
                        <div className="max-w-[210mm] mx-auto bg-white shadow-lg rounded-sm overflow-hidden">
                            <iframe
                                ref={iframeRef}
                                srcDoc={wrappedHtml}
                                className="w-full border-0 block"
                                style={{ minHeight: "297mm" }}
                                title={title}
                                sandbox="allow-same-origin"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
