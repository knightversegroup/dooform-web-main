/**
 * Memoized form field component
 */

import { memo } from "react";
import { FieldDefinition } from "@dooform/shared/api/types";
import { SmartInput } from "@/components/ui/SmartInput";
import { AddressSelection } from "@dooform/shared/api/addressService";
import { DateFormat } from "@dooform/shared/utils/fieldTypes";

interface FormFieldProps {
  definition: FieldDefinition;
  value: string;
  displayLabel: string;
  aliases: Record<string, string>;
  disabled: boolean;
  processing: boolean;
  fieldDefinitions: Record<string, FieldDefinition>;
  formData: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onFocus: (key: string) => void;
  onBlur: () => void;
  onAddressSelect: (key: string, address: AddressSelection) => void;
  onDateFormatChange: (key: string, format: DateFormat) => void;
}

/**
 * Get child fields for a selected radio option
 */
function getChildFieldsForRadioOption(
  definition: FieldDefinition,
  selectedOption: string,
  fieldDefinitions: Record<string, FieldDefinition>
): FieldDefinition[] {
  if (!definition.isRadioGroup || !definition.radioOptions) return [];

  const option = definition.radioOptions.find(
    (opt) => opt.placeholder === selectedOption
  );
  if (!option?.childFields) return [];

  return option.childFields
    .map((childKey) => fieldDefinitions[childKey])
    .filter(Boolean);
}

/**
 * Memoized form field component for efficient re-rendering
 */
export const FormField = memo(function FormField({
  definition,
  value,
  displayLabel,
  aliases,
  disabled,
  processing,
  fieldDefinitions,
  formData,
  onChange,
  onFocus,
  onBlur,
  onAddressSelect,
  onDateFormatChange,
}: FormFieldProps) {
  const key = definition.placeholder.replace(/\{\{|\}\}/g, "");
  const description = definition.description;

  // Get child fields if this is a radio group with a selected option
  const childFields = definition.isRadioGroup
    ? getChildFieldsForRadioOption(definition, value, fieldDefinitions)
    : [];

  return (
    <div className="flex flex-col gap-2 items-start w-full">
      <div className="flex flex-col gap-[2px] items-start w-full">
        <p className="font-semibold text-[#171717] text-base">
          {displayLabel}
        </p>
        {description && (
          <p className="text-[#797979] text-sm">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-start w-full">
        <SmartInput
          definition={definition}
          value={value}
          onChange={(val) => !disabled && onChange(key, val)}
          onFocus={() => onFocus(key)}
          onBlur={onBlur}
          onAddressSelect={(address) => onAddressSelect(key, address)}
          onDateFormatChange={(format) => onDateFormatChange(key, format)}
          alias={aliases[definition.placeholder]}
          disabled={disabled || processing}
          showPlaceholderKey={false}
          compact={false}
          hideLabel={true}
        />
      </div>

      {/* Render child fields when radio option is selected */}
      {childFields.length > 0 && (
        <div className="ml-6 pl-4 border-l-2 border-blue-200 w-full space-y-3 mt-2">
          {childFields.map((childDef) => {
            const childKey = childDef.placeholder.replace(/\{\{|\}\}/g, "");
            const childValue = formData[childKey] || "";
            const childLabel =
              aliases[childKey] ||
              aliases[childDef.placeholder] ||
              childDef.label ||
              childKey;

            return (
              <div
                key={childKey}
                className="flex flex-col gap-2 items-start w-full"
              >
                <div className="flex flex-col gap-[2px] items-start w-full">
                  <p className="font-medium text-[#171717] text-sm">
                    {childLabel}
                  </p>
                  {childDef.description && (
                    <p className="text-[#797979] text-xs">
                      {childDef.description}
                    </p>
                  )}
                </div>
                <div className="flex items-start w-full">
                  <SmartInput
                    definition={childDef}
                    value={childValue}
                    onChange={(val) => !disabled && onChange(childKey, val)}
                    onFocus={() => onFocus(childKey)}
                    onBlur={onBlur}
                    onAddressSelect={(address) =>
                      onAddressSelect(childKey, address)
                    }
                    onDateFormatChange={(format) =>
                      onDateFormatChange(childKey, format)
                    }
                    alias={aliases[childDef.placeholder]}
                    disabled={disabled || processing}
                    showPlaceholderKey={false}
                    compact={true}
                    hideLabel={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
