/**
 * Form fields container component for the fill step
 */

import { Scan } from "lucide-react";
import { FieldDefinition } from "@/lib/api/types";
import { GroupedSection, DateFormat } from "@/lib/utils/fieldTypes";
import { OCRScanner } from "@/components/ui/OCRScanner";
import { AddressSelection } from "@/lib/api/addressService";
import { FormField } from "./FormField";

interface FormFieldsProps {
  templateId: string;
  groupedSections: GroupedSection[];
  fieldDefinitions: Record<string, FieldDefinition>;
  formData: Record<string, string>;
  aliases: Record<string, string>;
  processing: boolean;
  showOCRScanner: boolean;
  onToggleOCRScanner: () => void;
  onOCRDataExtracted: (mappedFields: Record<string, string>) => void;
  onInputChange: (key: string, value: string) => void;
  onFieldFocus: (key: string) => void;
  onFieldBlur: () => void;
  onAddressSelect: (key: string, address: AddressSelection) => void;
  onDateFormatChange: (key: string, format: DateFormat) => void;
}

/**
 * Container component for form fields in the fill step
 */
export function FormFields({
  templateId,
  groupedSections,
  fieldDefinitions,
  formData,
  aliases,
  processing,
  showOCRScanner,
  onToggleOCRScanner,
  onOCRDataExtracted,
  onInputChange,
  onFieldFocus,
  onFieldBlur,
  onAddressSelect,
  onDateFormatChange,
}: FormFieldsProps) {
  const getDisplayLabel = (definition: FieldDefinition) => {
    const key = definition.placeholder.replace(/\{\{|\}\}/g, "");
    return aliases[key] || aliases[definition.placeholder] || definition.label || key;
  };

  return (
    <div className="flex flex-col items-start w-full">
      <div className="flex flex-col items-start justify-center px-4 py-2 w-full">
        {/* OCR Scanner Button */}
        <div className="mb-4 w-full">
          <button
            onClick={onToggleOCRScanner}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
              showOCRScanner
                ? "bg-[#000091] text-white"
                : "bg-[#f0f0f0] text-[#5b5b5b] hover:bg-[#e0e0e0]"
            }`}
            aria-expanded={showOCRScanner}
            aria-controls="ocr-scanner"
          >
            <Scan className="w-4 h-4" aria-hidden="true" />
            สแกนเอกสาร
          </button>
        </div>

        {/* OCR Scanner */}
        {showOCRScanner && (
          <div id="ocr-scanner" className="mb-6 w-full">
            <OCRScanner
              templateId={templateId}
              onDataExtracted={onOCRDataExtracted}
              onClose={onToggleOCRScanner}
            />
          </div>
        )}

        <div className="flex flex-col gap-4 items-start w-full">
          {groupedSections.length > 0 ? (
            groupedSections.map((section) => (
              <div key={section.name} className="w-full">
                {/* Section Label */}
                <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-[#171717] text-sm mb-3 mt-4 first:mt-0">
                  {section.name}
                </p>
                <div className="flex flex-col gap-4">
                  {section.fields.map((definition) => (
                    <FormField
                      key={definition.placeholder}
                      definition={definition}
                      value={formData[definition.placeholder.replace(/\{\{|\}\}/g, "")] || ""}
                      displayLabel={getDisplayLabel(definition)}
                      aliases={aliases}
                      disabled={false}
                      processing={processing}
                      fieldDefinitions={fieldDefinitions}
                      formData={formData}
                      onChange={onInputChange}
                      onFocus={onFieldFocus}
                      onBlur={onFieldBlur}
                      onAddressSelect={onAddressSelect}
                      onDateFormatChange={onDateFormatChange}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Fallback for templates without grouped sections
            Object.entries(fieldDefinitions).map(([placeholder, definition]) => (
              <FormField
                key={placeholder}
                definition={definition}
                value={formData[placeholder.replace(/\{\{|\}\}/g, "")] || ""}
                displayLabel={getDisplayLabel(definition)}
                aliases={aliases}
                disabled={false}
                processing={processing}
                fieldDefinitions={fieldDefinitions}
                formData={formData}
                onChange={onInputChange}
                onFocus={onFieldFocus}
                onBlur={onFieldBlur}
                onAddressSelect={onAddressSelect}
                onDateFormatChange={onDateFormatChange}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
