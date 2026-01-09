/**
 * Hook for managing debounced preview rendering
 */

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { FieldDefinition } from "@/lib/api/types";
import { GroupedSection } from "@/lib/utils/fieldTypes";
import {
  updatePreviewWithFormData,
  buildFieldColorMap,
  FieldColorMap,
} from "../utils/previewHelpers";

export interface UsePreviewRendererReturn {
  previewHtml: string;
  fieldColorMap: FieldColorMap;
  hasPreview: boolean;
}

/**
 * Custom hook for managing debounced preview rendering
 *
 * Uses React's useDeferredValue to debounce preview updates,
 * preventing excessive re-renders on every keystroke.
 *
 * @param htmlContent - Original HTML content with placeholders
 * @param formData - Current form data values
 * @param fieldDefinitions - Field definition metadata
 * @param groupedSections - Grouped sections for color mapping
 * @param activeField - Currently focused field key
 * @returns Preview HTML and related state
 *
 * @example
 * ```tsx
 * const { previewHtml, hasPreview } = usePreviewRenderer(
 *   htmlContent,
 *   formData,
 *   fieldDefinitions,
 *   groupedSections,
 *   activeField
 * );
 * ```
 */
export function usePreviewRenderer(
  htmlContent: string,
  formData: Record<string, string>,
  fieldDefinitions: Record<string, FieldDefinition>,
  groupedSections: GroupedSection[],
  activeField: string | null
): UsePreviewRendererReturn {
  const [previewHtml, setPreviewHtml] = useState("");

  // Check if preview is available
  const hasPreview = Boolean(htmlContent && htmlContent.trim().length > 0);

  // Build field color map from grouped sections
  const fieldColorMap = useMemo(() => {
    return buildFieldColorMap(groupedSections);
  }, [groupedSections]);

  // Use deferred value for form data to debounce preview updates
  // This prevents expensive preview calculations on every keystroke
  const deferredFormData = useDeferredValue(formData);

  // Update preview when deferred form data changes
  useEffect(() => {
    if (!hasPreview) {
      setPreviewHtml("");
      return;
    }

    const updatedHtml = updatePreviewWithFormData(
      htmlContent,
      deferredFormData,
      fieldDefinitions,
      fieldColorMap,
      activeField
    );

    setPreviewHtml(updatedHtml);
  }, [
    deferredFormData,
    htmlContent,
    hasPreview,
    activeField,
    fieldDefinitions,
    fieldColorMap,
  ]);

  return {
    previewHtml,
    fieldColorMap,
    hasPreview,
  };
}
