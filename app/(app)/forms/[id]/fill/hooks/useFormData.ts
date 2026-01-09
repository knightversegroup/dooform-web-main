/**
 * Hook for managing form data state
 */

import { useState, useCallback, useMemo } from "react";
import { FieldDefinition } from "@/lib/api/types";
import { AddressSelection } from "@/lib/api/addressService";
import { DateFormat } from "@/lib/utils/fieldTypes";

export interface UseFormDataReturn {
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleInputChange: (key: string, value: string) => void;
  handleOCRDataExtracted: (mappedFields: Record<string, string>) => void;
  handleAddressSelect: (
    fieldKey: string,
    address: AddressSelection,
    fieldDefinitions: Record<string, FieldDefinition>
  ) => void;
  initializeFormData: (placeholders: string[]) => void;
  resetFormData: (placeholders: string[]) => void;
  filledFieldsCount: number;
  totalFieldsCount: number;
  progressPercentage: number;
}

/**
 * Custom hook for managing form data in the form fill page
 *
 * @returns Form data state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   formData,
 *   handleInputChange,
 *   handleOCRDataExtracted,
 *   progressPercentage,
 * } = useFormData();
 * ```
 */
export function useFormData(): UseFormDataReturn {
  const [formData, setFormData] = useState<Record<string, string>>({});

  /**
   * Handle input value change
   */
  const handleInputChange = useCallback((key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  /**
   * Handle OCR data extraction - merge extracted fields into form data
   */
  const handleOCRDataExtracted = useCallback(
    (mappedFields: Record<string, string>) => {
      setFormData((prev) => ({
        ...prev,
        ...mappedFields,
      }));
    },
    []
  );

  /**
   * Handle address selection - auto-fill related address fields
   * Uses a single state update to avoid race conditions
   */
  const handleAddressSelect = useCallback(
    (
      fieldKey: string,
      address: AddressSelection,
      fieldDefinitions: Record<string, FieldDefinition>
    ) => {
      setFormData((currentData) => {
        const updates: Record<string, string> = {};

        Object.entries(fieldDefinitions).forEach(([placeholder, def]) => {
          const key = placeholder.replace(/\{\{|\}\}/g, "");
          const lowerPlaceholder = placeholder.toLowerCase();

          // Skip the triggering field and fields that already have values
          if (key === fieldKey || currentData[key]) return;

          // Match province fields
          if (
            def.dataType === "province" ||
            lowerPlaceholder.includes("province") ||
            lowerPlaceholder.includes("จังหวัด")
          ) {
            updates[key] = address.provinceEn;
          }
          // Match district fields (check subdistrict first to avoid false positives)
          else if (
            !lowerPlaceholder.includes("subdistrict") &&
            !lowerPlaceholder.includes("sub_district") &&
            (lowerPlaceholder.includes("district") ||
              lowerPlaceholder.includes("amphoe") ||
              lowerPlaceholder.includes("อำเภอ") ||
              lowerPlaceholder.includes("เขต"))
          ) {
            updates[key] = address.districtEn;
          }
          // Match subdistrict fields
          else if (
            lowerPlaceholder.includes("subdistrict") ||
            lowerPlaceholder.includes("sub_district") ||
            lowerPlaceholder.includes("tambon") ||
            lowerPlaceholder.includes("ตำบล") ||
            lowerPlaceholder.includes("แขวง")
          ) {
            updates[key] = address.subDistrictEn;
          }
        });

        // Only return new object if there are updates
        if (Object.keys(updates).length === 0) {
          return currentData;
        }

        return {
          ...currentData,
          ...updates,
        };
      });
    },
    []
  );

  /**
   * Initialize form data from placeholders
   */
  const initializeFormData = useCallback((placeholders: string[]) => {
    const initialData: Record<string, string> = {};
    placeholders.forEach((p) => {
      const key = p.replace(/\{\{|\}\}/g, "");
      initialData[key] = "";
    });
    setFormData(initialData);
  }, []);

  /**
   * Reset form data to empty values
   */
  const resetFormData = useCallback((placeholders: string[]) => {
    const resetData: Record<string, string> = {};
    placeholders.forEach((p) => {
      const key = p.replace(/\{\{|\}\}/g, "");
      resetData[key] = "";
    });
    setFormData(resetData);
  }, []);

  /**
   * Calculate progress statistics
   */
  const filledFieldsCount = useMemo(() => {
    return Object.values(formData).filter((v) => v.trim() !== "").length;
  }, [formData]);

  const totalFieldsCount = useMemo(() => {
    return Object.keys(formData).length;
  }, [formData]);

  const progressPercentage = useMemo(() => {
    if (totalFieldsCount === 0) return 0;
    return Math.round((filledFieldsCount / totalFieldsCount) * 100);
  }, [filledFieldsCount, totalFieldsCount]);

  return {
    formData,
    setFormData,
    handleInputChange,
    handleOCRDataExtracted,
    handleAddressSelect,
    initializeFormData,
    resetFormData,
    filledFieldsCount,
    totalFieldsCount,
    progressPercentage,
  };
}
