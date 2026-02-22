import { useState, useCallback, useMemo } from "react";
import { FieldDefinition } from "@dooform/shared/api/types";
import { AddressSelection } from "@dooform/shared/api/addressService";

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

function stripBraces(placeholder: string) {
  return placeholder.replace(/\{\{|\}\}/g, "");
}

export function useFormData(): UseFormDataReturn {
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleInputChange = useCallback((key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleOCRDataExtracted = useCallback(
    (mappedFields: Record<string, string>) => {
      setFormData((prev) => ({ ...prev, ...mappedFields }));
    },
    []
  );

  const handleAddressSelect = useCallback(
    (
      fieldKey: string,
      address: AddressSelection,
      fieldDefinitions: Record<string, FieldDefinition>
    ) => {
      setFormData((currentData) => {
        const updates: Record<string, string> = {};

        Object.entries(fieldDefinitions).forEach(([placeholder, def]) => {
          const key = stripBraces(placeholder);
          const lower = placeholder.toLowerCase();

          if (key === fieldKey || currentData[key]) return;

          if (
            def.dataType === "province" ||
            lower.includes("province") ||
            lower.includes("จังหวัด")
          ) {
            updates[key] = address.provinceEn;
          } else if (
            !lower.includes("subdistrict") &&
            !lower.includes("sub_district") &&
            (lower.includes("district") ||
              lower.includes("amphoe") ||
              lower.includes("อำเภอ") ||
              lower.includes("เขต"))
          ) {
            updates[key] = address.districtEn;
          } else if (
            lower.includes("subdistrict") ||
            lower.includes("sub_district") ||
            lower.includes("tambon") ||
            lower.includes("ตำบล") ||
            lower.includes("แขวง")
          ) {
            updates[key] = address.subDistrictEn;
          }
        });

        if (Object.keys(updates).length === 0) return currentData;
        return { ...currentData, ...updates };
      });
    },
    []
  );

  const initializeFormData = useCallback((placeholders: string[]) => {
    const data: Record<string, string> = {};
    placeholders.forEach((p) => { data[stripBraces(p)] = ""; });
    setFormData(data);
  }, []);

  const resetFormData = useCallback((placeholders: string[]) => {
    const data: Record<string, string> = {};
    placeholders.forEach((p) => { data[stripBraces(p)] = ""; });
    setFormData(data);
  }, []);

  const filledFieldsCount = useMemo(
    () => Object.values(formData).filter((v) => v.trim() !== "").length,
    [formData]
  );

  const totalFieldsCount = useMemo(
    () => Object.keys(formData).length,
    [formData]
  );

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
