import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { FieldDefinition } from "@dooform/shared/api/types";
import { GroupedSection } from "@dooform/shared/utils/fieldTypes";
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

export function usePreviewRenderer(
  htmlContent: string,
  formData: Record<string, string>,
  fieldDefinitions: Record<string, FieldDefinition>,
  groupedSections: GroupedSection[],
  activeField: string | null
): UsePreviewRendererReturn {
  const [previewHtml, setPreviewHtml] = useState("");

  const hasPreview = Boolean(htmlContent?.trim().length);

  const fieldColorMap = useMemo(
    () => buildFieldColorMap(groupedSections),
    [groupedSections]
  );

  const deferredFormData = useDeferredValue(formData);

  useEffect(() => {
    if (!hasPreview) {
      setPreviewHtml("");
      return;
    }

    setPreviewHtml(
      updatePreviewWithFormData(
        htmlContent,
        deferredFormData,
        fieldDefinitions,
        fieldColorMap,
        activeField
      )
    );
  }, [deferredFormData, htmlContent, hasPreview, activeField, fieldDefinitions, fieldColorMap]);

  return { previewHtml, fieldColorMap, hasPreview };
}
