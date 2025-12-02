"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { ENTITY_LABELS } from "@/lib/utils/fieldTypes";
import type { Template, FieldDefinition, ConfigurableDataType, Entity } from "@/lib/api/types";

export interface Section {
    id: string;
    name: string;
    fields: string[];
    colorIndex: number;
}

interface TemplateContextType {
    template: Template | null;
    fieldDefinitions: Record<string, FieldDefinition> | null;
    aliases: Record<string, string>;
    dataTypes: ConfigurableDataType[];
    htmlContent: string;
    sections: Section[];
    loading: boolean;
    error: string | null;
    setTemplate: (template: Template | null) => void;
    setFieldDefinitions: (defs: Record<string, FieldDefinition> | null | ((prev: Record<string, FieldDefinition> | null) => Record<string, FieldDefinition> | null)) => void;
    setAliases: (aliases: Record<string, string>) => void;
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
    refetchTemplate: () => Promise<void>;
    refetchHtml: () => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | null>(null);

function parseAliases(template: Template): Record<string, string> {
    if (!template.aliases) return {};
    try {
        return typeof template.aliases === "string"
            ? JSON.parse(template.aliases)
            : template.aliases;
    } catch {
        return {};
    }
}

export function TemplateProvider({
    templateId,
    children
}: {
    templateId: string;
    children: ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    const [template, setTemplate] = useState<Template | null>(null);
    const [fieldDefinitions, setFieldDefinitions] = useState<Record<string, FieldDefinition> | null>(null);
    const [aliases, setAliases] = useState<Record<string, string>>({});
    const [dataTypes, setDataTypes] = useState<ConfigurableDataType[]>([]);
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [sections, setSections] = useState<Section[]>([]);
    const [sectionsInitialized, setSectionsInitialized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetchTemplate = useCallback(async () => {
        try {
            // Use getAllTemplates and find by ID (same as edit page)
            const response = await apiClient.getAllTemplates();
            const foundTemplate = response.templates?.find((t) => t.id === templateId);

            if (foundTemplate) {
                setTemplate(foundTemplate);
                setAliases(parseAliases(foundTemplate));

                // Fetch field definitions separately
                try {
                    const definitions = await apiClient.getFieldDefinitions(templateId);
                    setFieldDefinitions(definitions || {});
                } catch (e) {
                    console.warn("Failed to fetch field definitions:", e);
                }
            }
        } catch (err) {
            console.error("Failed to fetch template:", err);
        }
    }, [templateId]);

    const refetchHtml = useCallback(async () => {
        try {
            const html = await apiClient.getHTMLPreview(templateId);
            setHtmlContent(html || "");
        } catch (e) {
            console.warn("Failed to fetch HTML preview:", e);
        }
    }, [templateId]);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace(`/login?redirect=/forms/${templateId}/edit`);
        }
    }, [authLoading, isAuthenticated, router, templateId]);

    // Fetch data only when authenticated
    useEffect(() => {
        if (authLoading || !isAuthenticated) {
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch template using getAllTemplates (same as edit page)
                const response = await apiClient.getAllTemplates();
                const foundTemplate = response.templates?.find((t) => t.id === templateId);

                if (!foundTemplate) {
                    setError("ไม่พบเทมเพลตที่ต้องการ");
                    setLoading(false);
                    return;
                }

                setTemplate(foundTemplate);
                setAliases(parseAliases(foundTemplate));

                // Fetch field definitions separately (same as edit page)
                try {
                    const definitions = await apiClient.getFieldDefinitions(templateId);
                    setFieldDefinitions(definitions || {});
                } catch (e) {
                    console.warn("Failed to fetch field definitions:", e);
                    // Fallback to template's field_definitions if API fails
                    try {
                        const fallback = foundTemplate.field_definitions
                            ? JSON.parse(foundTemplate.field_definitions)
                            : {};
                        setFieldDefinitions(fallback);
                    } catch {
                        setFieldDefinitions({});
                    }
                }

                // Fetch data types (non-critical)
                try {
                    const types = await apiClient.getConfigurableDataTypes(true);
                    setDataTypes(types);
                } catch (e) {
                    console.warn("Failed to fetch data types:", e);
                }

                // Fetch HTML preview (non-critical)
                try {
                    const html = await apiClient.getHTMLPreview(templateId);
                    setHtmlContent(html || "");
                } catch (e) {
                    console.warn("Failed to fetch HTML preview:", e);
                }
            } catch (err) {
                console.error("Failed to fetch template:", err);
                setError(err instanceof Error ? err.message : "Failed to load template");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [templateId, authLoading, isAuthenticated]);

    // Initialize sections from field definitions - use saved groups or fall back to entity
    useEffect(() => {
        if (!fieldDefinitions || sectionsInitialized || Object.keys(fieldDefinitions).length === 0) return;

        // Check if any field has a saved group (not starting with merged_hidden_)
        const fieldsWithGroups = Object.entries(fieldDefinitions)
            .filter(([, def]) => def.group && !def.group.startsWith("merged_hidden_"));

        const hasSavedGroups = fieldsWithGroups.length > 0;

        if (hasSavedGroups) {
            // Restore sections from saved group names
            // Group format can be "sectionName|colorIndex" or just "sectionName"
            const groupMap: Record<string, { fields: string[]; minOrder: number; colorIndex: number }> = {};

            Object.entries(fieldDefinitions)
                .filter(([, def]) => !def.group?.startsWith("merged_hidden_"))
                .forEach(([key, def]) => {
                    const rawGroup = def.group || "ทั่วไป";
                    // Parse group format: "name|colorIndex" or just "name"
                    const [groupName, colorStr] = rawGroup.includes("|")
                        ? rawGroup.split("|")
                        : [rawGroup, "0"];
                    const colorIndex = parseInt(colorStr, 10) || 0;

                    if (!groupMap[groupName]) {
                        groupMap[groupName] = { fields: [], minOrder: def.order ?? Infinity, colorIndex };
                    }
                    groupMap[groupName].fields.push(key);
                    if ((def.order ?? Infinity) < groupMap[groupName].minOrder) {
                        groupMap[groupName].minOrder = def.order ?? Infinity;
                    }
                });

            // Sort fields within each group by order
            Object.values(groupMap).forEach((group) => {
                group.fields.sort((a, b) => {
                    const orderA = fieldDefinitions[a]?.order ?? 0;
                    const orderB = fieldDefinitions[b]?.order ?? 0;
                    return orderA - orderB;
                });
            });

            // Sort groups by their minimum order
            const sortedGroups = Object.entries(groupMap)
                .sort(([, a], [, b]) => a.minOrder - b.minOrder);

            const initialSections: Section[] = sortedGroups.map(([name, group], index) => ({
                id: `section-${name.replace(/\s+/g, "-")}-${index}`,
                name,
                fields: group.fields,
                colorIndex: group.colorIndex,
            }));

            setSections(initialSections);
        } else {
            // Fall back to entity-based grouping
            const entityGroups: Record<Entity, string[]> = {
                child: [], mother: [], father: [], informant: [], registrar: [], general: [],
            };

            Object.entries(fieldDefinitions)
                .filter(([, def]) => !def.group?.startsWith("merged_hidden_"))
                .forEach(([key, def]) => {
                    const entity = def.entity && entityGroups[def.entity] ? def.entity : "general";
                    entityGroups[entity].push(key);
                });

            const initialSections: Section[] = [];
            let colorIndex = 0;
            (Object.entries(entityGroups) as [Entity, string[]][]).forEach(([entity, fields]) => {
                if (fields.length > 0) {
                    initialSections.push({
                        id: `section-${entity}`,
                        name: ENTITY_LABELS[entity],
                        fields,
                        colorIndex: colorIndex++
                    });
                }
            });

            setSections(initialSections);
        }

        setSectionsInitialized(true);
    }, [fieldDefinitions, sectionsInitialized]);

    // Show loading while checking auth
    if (authLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">กำลังตรวจสอบ...</p>
                </div>
            </div>
        );
    }

    return (
        <TemplateContext.Provider
            value={{
                template,
                fieldDefinitions,
                aliases,
                dataTypes,
                htmlContent,
                sections,
                loading,
                error,
                setTemplate,
                setFieldDefinitions,
                setAliases,
                setSections,
                refetchTemplate,
                refetchHtml,
            }}
        >
            {children}
        </TemplateContext.Provider>
    );
}

export function useTemplate() {
    const context = useContext(TemplateContext);
    if (!context) {
        throw new Error("useTemplate must be used within TemplateProvider");
    }
    return context;
}
