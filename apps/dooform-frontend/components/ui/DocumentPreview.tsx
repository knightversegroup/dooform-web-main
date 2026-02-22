"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";

type PageOrientation = 'portrait' | 'landscape' | 'auto';

interface DocumentPreviewProps {
    htmlContent: string;
    title?: string;
    showHeader?: boolean;
    className?: string;
    orientation?: PageOrientation;
}

export function DocumentPreview({
    htmlContent,
    title = "Document Preview",
    showHeader = true,
    className = "",
    orientation = "auto",
}: DocumentPreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Detect page orientation from HTML content
    const detectedOrientation = useMemo(() => {
        if (orientation !== 'auto') {
            return orientation;
        }

        // Check for landscape indicators in HTML/CSS

        // Check for @page with landscape orientation
        if (/@page\s*{[^}]*size\s*:\s*[^;]*landscape/i.test(htmlContent)) {
            return 'landscape';
        }

        // Check for mso-page-orientation (Microsoft Office format)
        if (/mso-page-orientation\s*:\s*landscape/i.test(htmlContent)) {
            return 'landscape';
        }

        // Check for size specification with landscape dimensions (width > height)
        // e.g., "size: 297mm 210mm" or "size: 11in 8.5in"
        const sizeMatch = htmlContent.match(/size\s*:\s*(\d+(?:\.\d+)?)\s*(mm|cm|in|pt)\s+(\d+(?:\.\d+)?)\s*(mm|cm|in|pt)/i);
        if (sizeMatch) {
            const width = parseFloat(sizeMatch[1]);
            const height = parseFloat(sizeMatch[3]);
            // Convert to same unit for comparison
            if (sizeMatch[2] === sizeMatch[4] && width > height) {
                return 'landscape';
            }
        }

        // Check for explicit width styles suggesting landscape
        // Word exports often have style="width:841.9pt" for A4 landscape
        const widthMatch = htmlContent.match(/style\s*=\s*["'][^"']*width\s*:\s*(\d+(?:\.\d+)?)\s*(pt|px|mm|cm)/i);
        if (widthMatch) {
            const widthValue = parseFloat(widthMatch[1]);
            const unit = widthMatch[2].toLowerCase();
            // A4 landscape width is ~841pt or ~297mm
            if ((unit === 'pt' && widthValue > 700) || (unit === 'mm' && widthValue > 250)) {
                return 'landscape';
            }
        }

        return 'portrait';
    }, [htmlContent, orientation]);

    // Get dimensions based on orientation
    const { pageWidth, pageHeight } = useMemo(() => {
        if (detectedOrientation === 'landscape') {
            return { pageWidth: '297mm', pageHeight: '210mm' };
        }
        return { pageWidth: '210mm', pageHeight: '297mm' };
    }, [detectedOrientation]);

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
                    <div className="p-4 min-h-full flex justify-center">
                        <div
                            className="bg-white shadow-lg rounded-sm overflow-hidden flex-shrink-0"
                            style={{ width: pageWidth, minWidth: pageWidth }}
                        >
                            <iframe
                                ref={iframeRef}
                                srcDoc={wrappedHtml}
                                className="w-full border-0 block"
                                style={{ minHeight: pageHeight }}
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
