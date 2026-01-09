/**
 * Hook for loading template data and field definitions
 */

import { useState, useEffect, useCallback } from "react";
import { Template, FieldDefinition, ConfigurableDataType } from "@/lib/api/types";
import { apiClient } from "@/lib/api/client";
import { groupFieldsBySavedGroup, GroupedSection } from "@/lib/utils/fieldTypes";
import { logger } from "@/lib/utils/logger";

export interface UseTemplateLoaderReturn {
  template: Template | null;
  fieldDefinitions: Record<string, FieldDefinition>;
  groupedSections: GroupedSection[];
  htmlContent: string;
  hasPreview: boolean;
  loading: boolean;
  error: string | null;
  placeholders: string[];
  aliases: Record<string, string>;
}

/**
 * Enhance field definitions with configurable data type information
 */
function enhanceFieldDefinitions(
  definitions: Record<string, FieldDefinition>,
  dataTypes: ConfigurableDataType[]
): Record<string, FieldDefinition> {
  const enhanced: Record<string, FieldDefinition> = {};

  Object.entries(definitions).forEach(([key, def]) => {
    const enhancedDef = { ...def };
    const dataTypeConfig = dataTypes.find((dt) => dt.code === enhancedDef.dataType);

    // If inputType is 'digit' and no digitFormat, look it up from configurable data type
    if (enhancedDef.inputType === "digit" && !enhancedDef.digitFormat) {
      if (dataTypeConfig?.default_value) {
        enhancedDef.digitFormat = dataTypeConfig.default_value;
        logger.debug("TemplateLoader", `Applied digitFormat from dataTypeConfig: ${enhancedDef.digitFormat}`);
      }
    }

    // If inputType is 'location' and no locationOutputFormat, look it up from configurable data type
    if (enhancedDef.inputType === "location" && !enhancedDef.locationOutputFormat) {
      if (dataTypeConfig?.default_value) {
        enhancedDef.locationOutputFormat = dataTypeConfig.default_value as FieldDefinition["locationOutputFormat"];
      }
    }

    // If inputType is 'select', prefer options from configurable data type
    if (enhancedDef.inputType === "select" && dataTypeConfig?.options) {
      try {
        const parsedOptions = JSON.parse(dataTypeConfig.options);
        if (Array.isArray(parsedOptions) && parsedOptions.length > 0) {
          enhancedDef.validation = {
            ...enhancedDef.validation,
            options: parsedOptions,
          };
        }
      } catch (e) {
        logger.error("TemplateLoader", "Failed to parse options for data type:", dataTypeConfig.code, e);
      }
    }

    // Load validation rules from configurable data type
    if (dataTypeConfig?.validation) {
      try {
        const parsedValidation = JSON.parse(dataTypeConfig.validation);
        if (parsedValidation && typeof parsedValidation === "object") {
          enhancedDef.validation = {
            ...enhancedDef.validation,
            ...parsedValidation,
          };
        }
      } catch (e) {
        logger.error("TemplateLoader", "Failed to parse validation for data type:", dataTypeConfig.code, e);
      }
    }

    // Load data type label from configurable data type
    if (dataTypeConfig?.name) {
      enhancedDef.dataTypeLabel = dataTypeConfig.name;
    }

    enhanced[key] = enhancedDef;
  });

  return enhanced;
}

/**
 * Filter visible field definitions (exclude hidden merged/radio fields)
 */
function filterVisibleDefinitions(
  definitions: Record<string, FieldDefinition>
): Record<string, FieldDefinition> {
  const visible: Record<string, FieldDefinition> = {};

  Object.entries(definitions).forEach(([key, def]) => {
    // Filter out hidden merged fields, radio group hidden fields, and radio child fields
    if (
      def.group?.startsWith("merged_hidden_") ||
      def.group?.startsWith("radio_hidden_") ||
      def.group?.startsWith("radio_child_")
    ) {
      return;
    }
    visible[key] = def;
  });

  return visible;
}

/**
 * Custom hook for loading template data and field definitions
 *
 * @param templateId - The template ID to load
 * @returns Template data, field definitions, and loading state
 *
 * @example
 * ```tsx
 * const {
 *   template,
 *   fieldDefinitions,
 *   groupedSections,
 *   loading,
 *   error,
 * } = useTemplateLoader(templateId);
 * ```
 */
export function useTemplateLoader(templateId: string): UseTemplateLoaderReturn {
  const [template, setTemplate] = useState<Template | null>(null);
  const [fieldDefinitions, setFieldDefinitions] = useState<Record<string, FieldDefinition>>({});
  const [groupedSections, setGroupedSections] = useState<GroupedSection[]>([]);
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;

    const loadTemplate = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all templates and find the one we need
        const response = await apiClient.getAllTemplates();
        const foundTemplate = response.templates?.find((t) => t.id === templateId);

        if (!foundTemplate) {
          setError("ไม่พบเทมเพลตที่ต้องการ");
          return;
        }

        setTemplate(foundTemplate);

        // Fetch field definitions and configurable data types
        try {
          const [definitions, dataTypes] = await Promise.all([
            apiClient.getFieldDefinitions(templateId),
            apiClient.getConfigurableDataTypes(true).catch(() => [] as ConfigurableDataType[]),
          ]);

          // Enhance definitions with data type information
          const enhancedDefinitions = enhanceFieldDefinitions(definitions, dataTypes);
          setFieldDefinitions(enhancedDefinitions);

          // Filter visible definitions and group them
          const visibleDefinitions = filterVisibleDefinitions(enhancedDefinitions);
          const sections = groupFieldsBySavedGroup(visibleDefinitions);
          setGroupedSections(sections);
        } catch (err) {
          logger.error("TemplateLoader", "Failed to load field definitions:", err);
          setFieldDefinitions({});
          setGroupedSections([]);
        }

        // Try to load HTML preview
        try {
          const html = await apiClient.getHTMLPreview(templateId);
          setHtmlContent(html);
        } catch (err) {
          logger.error("TemplateLoader", "Failed to load HTML preview:", err);
          // Preview not available, continue without it
        }
      } catch (err) {
        logger.error("TemplateLoader", "Failed to load template:", err);
        setError(err instanceof Error ? err.message : "Failed to load template");
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  // Derived values
  const hasPreview = Boolean(htmlContent && htmlContent.trim().length > 0);
  const placeholders = template?.placeholders || [];
  const aliases = template?.aliases || {};

  return {
    template,
    fieldDefinitions,
    groupedSections,
    htmlContent,
    hasPreview,
    loading,
    error,
    placeholders,
    aliases,
  };
}
