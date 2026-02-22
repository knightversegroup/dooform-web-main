import { useState, useEffect } from "react";
import { Template, FieldDefinition, ConfigurableDataType } from "@dooform/shared/api/types";
import { apiClient } from "@dooform/shared/api/client";
import { groupFieldsBySavedGroup, GroupedSection } from "@dooform/shared/utils/fieldTypes";
import { logger } from "@dooform/shared/utils/logger";

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

const HIDDEN_GROUP_PREFIXES = ["merged_hidden_", "radio_hidden_", "radio_child_"];

function enhanceFieldDefinitions(
  definitions: Record<string, FieldDefinition>,
  dataTypes: ConfigurableDataType[]
): Record<string, FieldDefinition> {
  const enhanced: Record<string, FieldDefinition> = {};

  Object.entries(definitions).forEach(([key, def]) => {
    const enhancedDef = { ...def };
    const dtConfig = dataTypes.find((dt) => dt.code === enhancedDef.dataType);

    if (enhancedDef.inputType === "digit" && !enhancedDef.digitFormat && dtConfig?.default_value) {
      enhancedDef.digitFormat = dtConfig.default_value;
    }

    if (enhancedDef.inputType === "location" && !enhancedDef.locationOutputFormat && dtConfig?.default_value) {
      enhancedDef.locationOutputFormat = dtConfig.default_value as FieldDefinition["locationOutputFormat"];
    }

    if (enhancedDef.inputType === "select" && dtConfig?.options) {
      try {
        const parsed = JSON.parse(dtConfig.options);
        if (Array.isArray(parsed) && parsed.length > 0) {
          enhancedDef.validation = { ...enhancedDef.validation, options: parsed };
        }
      } catch (e) {
        logger.error("TemplateLoader", "Failed to parse options:", dtConfig.code, e);
      }
    }

    if (dtConfig?.validation) {
      try {
        const parsed = JSON.parse(dtConfig.validation);
        if (parsed && typeof parsed === "object") {
          enhancedDef.validation = { ...enhancedDef.validation, ...parsed };
        }
      } catch (e) {
        logger.error("TemplateLoader", "Failed to parse validation:", dtConfig.code, e);
      }
    }

    if (dtConfig?.name) {
      enhancedDef.dataTypeLabel = dtConfig.name;
    }

    enhanced[key] = enhancedDef;
  });

  return enhanced;
}

function filterVisibleDefinitions(
  definitions: Record<string, FieldDefinition>
): Record<string, FieldDefinition> {
  const visible: Record<string, FieldDefinition> = {};

  Object.entries(definitions).forEach(([key, def]) => {
    if (HIDDEN_GROUP_PREFIXES.some((prefix) => def.group?.startsWith(prefix))) return;
    visible[key] = def;
  });

  return visible;
}

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

        const response = await apiClient.getAllTemplates();
        const foundTemplate = response.templates?.find((t) => t.id === templateId);

        if (!foundTemplate) {
          setError("ไม่พบเทมเพลตที่ต้องการ");
          return;
        }

        setTemplate(foundTemplate);

        try {
          const [definitions, dataTypes] = await Promise.all([
            apiClient.getFieldDefinitions(templateId),
            apiClient.getConfigurableDataTypes(true).catch(() => [] as ConfigurableDataType[]),
          ]);

          const enhanced = enhanceFieldDefinitions(definitions, dataTypes);
          setFieldDefinitions(enhanced);

          const visible = filterVisibleDefinitions(enhanced);
          setGroupedSections(groupFieldsBySavedGroup(visible));
        } catch (err) {
          logger.error("TemplateLoader", "Failed to load field definitions:", err);
          setFieldDefinitions({});
          setGroupedSections([]);
        }

        try {
          const html = await apiClient.getHTMLPreview(templateId);
          setHtmlContent(html);
        } catch (err) {
          logger.error("TemplateLoader", "Failed to load HTML preview:", err);
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

  const hasPreview = Boolean(htmlContent?.trim().length);
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
