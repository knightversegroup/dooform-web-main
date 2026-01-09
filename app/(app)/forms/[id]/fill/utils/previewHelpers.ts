/**
 * Preview helper utilities for the form fill page
 *
 * Contains functions for updating the HTML preview with form values,
 * handling merged fields, radio groups, and date formatting.
 */

import { FieldDefinition } from "@/lib/api/types";
import {
  splitMergedValue,
  expandRadioGroupValue,
  formatDateToDisplay,
} from "@/lib/utils/fieldTypes";
import { SECTION_COLORS, getSectionColor } from "@/lib/constants/colors";

export interface FieldColorMap {
  [key: string]: { bg: string; text: string };
}

/**
 * Build a map of field keys to their section colors
 */
export function buildFieldColorMap(
  groupedSections: Array<{
    colorIndex: number;
    fields: FieldDefinition[];
  }>
): FieldColorMap {
  const map: FieldColorMap = {};

  groupedSections.forEach((section) => {
    const color = getSectionColor(section.colorIndex);
    section.fields.forEach((def) => {
      const key = def.placeholder.replace(/\{\{|\}\}/g, "");
      map[key] = color;
    });
  });

  return map;
}

/**
 * Prepare field data for display
 */
export function prepareFieldData(
  definition: FieldDefinition,
  formData: Record<string, string>,
  aliases: Record<string, string>
): {
  key: string;
  value: string;
  displayLabel: string;
} {
  const key = definition.placeholder.replace(/\{\{|\}\}/g, "");
  const value = formData[key] || "";
  const displayLabel =
    aliases[key] || aliases[definition.placeholder] || definition.label || key;

  return { key, value, displayLabel };
}

/**
 * Create highlighted markup for a field value
 */
function createHighlightedValue(
  value: string,
  color: { bg: string; text: string },
  isEmpty = false
): string {
  if (isEmpty) {
    return `<mark style="background-color: ${color.bg}; color: ${color.text}; padding: 2px 6px; border-radius: 4px; opacity: 0.7;">___</mark>`;
  }
  return `<mark style="background-color: ${color.bg}; color: ${color.text}; padding: 2px 6px; border-radius: 4px; font-weight: 500;">${value}</mark>`;
}

/**
 * Replace a placeholder in HTML with a value
 */
function replacePlaceholder(
  html: string,
  placeholder: string,
  value: string,
  isActive: boolean,
  color: { bg: string; text: string }
): string {
  const escapedPlaceholder = `{{${placeholder}}}`.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
  const regex = new RegExp(escapedPlaceholder, "gi");

  if (value) {
    if (isActive) {
      return html.replace(regex, createHighlightedValue(value, color));
    }
    return html.replace(regex, value);
  } else {
    if (isActive) {
      return html.replace(regex, createHighlightedValue("", color, true));
    }
    return html.replace(regex, "");
  }
}

/**
 * Update HTML preview with form data
 *
 * This is the main function that processes form data and updates the HTML preview.
 * It handles regular fields, merged fields, radio groups, and date formatting.
 */
export function updatePreviewWithFormData(
  htmlContent: string,
  formData: Record<string, string>,
  fieldDefinitions: Record<string, FieldDefinition>,
  fieldColorMap: FieldColorMap,
  activeField: string | null
): string {
  // Decode HTML entities first
  let updatedHtml = htmlContent
    .replace(/&#123;/g, "{")
    .replace(/&#125;/g, "}");

  const defaultColor = { bg: "#F3F4F6", text: "#374151" };

  // Process each form field
  Object.keys(formData).forEach((key) => {
    const definition = fieldDefinitions[key];
    const rawValue = formData[key] || "";
    const isActive = activeField === key;
    const sectionColor = fieldColorMap[key] || defaultColor;

    // Format date values for display (only for non-merged fields)
    let displayValue = rawValue;
    if (
      definition?.inputType === "date" &&
      rawValue &&
      !definition.isMerged
    ) {
      displayValue = formatDateToDisplay(
        rawValue,
        definition.dateFormat || "dd/mm/yyyy"
      );
    }

    if (definition?.isMerged && definition.mergedFields) {
      // Handle merged fields - split the value and update each sub-placeholder
      const splitValues = splitMergedValue(
        rawValue,
        definition.mergedFields,
        definition.separator || ""
      );

      definition.mergedFields.forEach((fieldKey) => {
        const fieldValue = splitValues[fieldKey] || "";
        const fieldColor = fieldColorMap[fieldKey] || sectionColor;

        updatedHtml = replacePlaceholder(
          updatedHtml,
          fieldKey,
          fieldValue,
          isActive,
          fieldColor
        );
      });
    } else if (definition?.isRadioGroup && definition.radioOptions) {
      // Handle radio groups - expand selected value to all placeholders
      const expandedValues = expandRadioGroupValue(
        rawValue,
        definition.radioOptions
      );

      definition.radioOptions.forEach((option) => {
        const fieldValue = expandedValues[option.placeholder] || "";
        const fieldColor = fieldColorMap[option.placeholder] || sectionColor;

        updatedHtml = replacePlaceholder(
          updatedHtml,
          option.placeholder,
          fieldValue,
          isActive,
          fieldColor
        );
      });
    } else {
      // Handle regular fields
      updatedHtml = replacePlaceholder(
        updatedHtml,
        key,
        displayValue,
        isActive,
        sectionColor
      );
    }
  });

  // Handle any remaining unmatched placeholders (fallback)
  updatedHtml = updatedHtml.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const formDataKey = Object.keys(formData).find(
      (k) => k.toLowerCase() === key.toLowerCase()
    );
    if (formDataKey && formData[formDataKey]) {
      let fallbackValue = formData[formDataKey];
      // Format date values in fallback replacement
      const fallbackDef = fieldDefinitions[formDataKey];
      if (fallbackDef?.inputType === "date" && fallbackValue) {
        fallbackValue = formatDateToDisplay(
          fallbackValue,
          fallbackDef.dateFormat || "dd/mm/yyyy"
        );
      }
      return fallbackValue;
    }
    return "";
  });

  return updatedHtml;
}

/**
 * Calculate form progress
 */
export function calculateProgress(formData: Record<string, string>): {
  filled: number;
  total: number;
  percentage: number;
} {
  const total = Object.keys(formData).length;
  const filled = Object.values(formData).filter((v) => v.trim() !== "").length;
  const percentage = total === 0 ? 0 : Math.round((filled / total) * 100);

  return { filled, total, percentage };
}
