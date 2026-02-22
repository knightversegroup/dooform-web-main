"use client";

import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiClient } from "@dooform/shared/api/client";
import { useAuth } from "@dooform/shared/auth/hooks";
import { ENTITY_LABELS } from "@dooform/shared/utils/fieldTypes";
import type { Template, FieldDefinition, ConfigurableDataType, Entity } from "@dooform/shared/api/types";

export interface Section {
    id: string;
    name: string;
    fields: string[];
    colorIndex: number;
}

export interface TemplateContextType {
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
    setAliases: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
    refetchTemplate: () => Promise<void>;
    refetchHtml: () => Promise<void>;
}

export const TemplateContext = createContext<TemplateContextType | null>(null);

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
    const { isLoading: authLoading } = useAuth();

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
                    // Reset sections so they get re-initialized from new field definitions
                    setSectionsInitialized(false);
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

    // Note: Auth check removed from TemplateContext - individual pages handle their own auth
    // This allows /forms/[id] to be publicly accessible while /forms/[id]/edit and /forms/[id]/fill
    // can implement their own auth checks

    // Fetch data (public template data is accessible without auth)
    useEffect(() => {
        if (authLoading) {
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
                    // field_definitions is now an object, not a JSON string
                    const fallback = foundTemplate.field_definitions || {};
                    setFieldDefinitions(fallback);
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
    }, [templateId, authLoading]);

    // Initialize sections from field definitions - use saved groups or fall back to entity
    // IMPORTANT: Sort all fields by order first to maintain document order
    useEffect(() => {
        if (!fieldDefinitions || sectionsInitialized || Object.keys(fieldDefinitions).length === 0) return;

        // First, convert to array and sort by order to maintain document order
        const sortedFields = Object.entries(fieldDefinitions)
            .filter(([, def]) => !def.group?.startsWith("merged_hidden_"))
            .map(([key, def]) => ({ key, def, order: def.order ?? 9999 }))
            .sort((a, b) => a.order - b.order); // Sort by document order first!

        const fieldsWithGroups = sortedFields.filter(f => f.def.group && !f.def.group.startsWith("merged_hidden_"));
        const hasSavedGroups = fieldsWithGroups.length > 0;

        if (hasSavedGroups) {
            // Restore sections from saved group names
            const groupMap: Record<string, { fields: string[]; minOrder: number; colorIndex: number }> = {};

            sortedFields.forEach(({ key, def, order }) => {
                const rawGroup = def.group || "ทั่วไป";
                const [groupName, colorStr] = rawGroup.includes("|")
                    ? rawGroup.split("|")
                    : [rawGroup, "0"];
                const colorIndex = parseInt(colorStr, 10) || 0;

                if (!groupMap[groupName]) {
                    groupMap[groupName] = { fields: [], minOrder: order, colorIndex };
                }
                groupMap[groupName].fields.push(key);
                if (order < groupMap[groupName].minOrder) {
                    groupMap[groupName].minOrder = order;
                }
            });

            // Fields are already sorted, no need to sort again
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
            const entityGroups: Record<Entity, { fields: string[]; minOrder: number }> = {
                child: { fields: [], minOrder: 9999 },
                mother: { fields: [], minOrder: 9999 },
                father: { fields: [], minOrder: 9999 },
                informant: { fields: [], minOrder: 9999 },
                registrar: { fields: [], minOrder: 9999 },
                general: { fields: [], minOrder: 9999 },
            };

            // Fields are already sorted by order, so they'll be added in document order
            sortedFields.forEach(({ key, def, order }) => {
                const entity = def.entity && entityGroups[def.entity] ? def.entity : "general";
                entityGroups[entity].fields.push(key);
                if (order < entityGroups[entity].minOrder) {
                    entityGroups[entity].minOrder = order;
                }
            });

            // Sort entity groups by minimum order (first-come-first-serve)
            const sortedEntityGroups = (Object.entries(entityGroups) as [Entity, { fields: string[]; minOrder: number }][])
                .filter(([, group]) => group.fields.length > 0)
                .sort(([, a], [, b]) => a.minOrder - b.minOrder);

            const initialSections: Section[] = sortedEntityGroups.map(([entity, group], index) => ({
                id: `section-${entity}`,
                name: ENTITY_LABELS[entity],
                fields: group.fields,
                colorIndex: index,
            }));

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

