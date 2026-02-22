/**
 * Review fields component for the review step
 */

import { memo } from "react";
import { FieldDefinition } from "@dooform/shared/api/types";
import { GroupedSection } from "@dooform/shared/utils/fieldTypes";

interface ReviewFieldsProps {
  groupedSections: GroupedSection[];
  fieldDefinitions: Record<string, FieldDefinition>;
  formData: Record<string, string>;
  aliases: Record<string, string>;
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
 * Single review field component
 */
const ReviewField = memo(function ReviewField({
  definition,
  value,
  displayLabel,
  childFields,
  formData,
  aliases,
}: {
  definition: FieldDefinition;
  value: string;
  displayLabel: string;
  childFields: FieldDefinition[];
  formData: Record<string, string>;
  aliases: Record<string, string>;
}) {
  const description = definition.description;

  // Get display value for radio groups
  let displayValue = value;
  if (definition.isRadioGroup && definition.radioOptions) {
    const selectedOption = definition.radioOptions.find(
      (opt) => opt.placeholder === value
    );
    displayValue = selectedOption?.label || value || "-";
  }

  return (
    <div className="flex flex-col gap-2 items-start w-full">
      <div className="flex flex-col gap-[2px] items-start w-full">
        <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-[#171717] text-base">
          {displayLabel}
        </p>
        {description && (
          <p className="font-['IBM_Plex_Sans_Thai',sans-serif] text-[#797979] text-sm">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-start w-full opacity-50">
        <div
          className="
            font-['IBM_Plex_Sans_Thai',sans-serif]
            bg-[#f0f0f0]
            border-b-2 border-[#5b5b5b] border-l-0 border-r-0 border-t-0
            px-4 py-[13px]
            text-base
            text-[#5b5b5b]
            w-full
            min-h-[48px]
          "
        >
          {displayValue || "-"}
        </div>
      </div>

      {/* Render child fields in review mode */}
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
                  <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-medium text-[#171717] text-sm">
                    {childLabel}
                  </p>
                </div>
                <div className="flex items-start w-full opacity-50">
                  <div
                    className="
                      font-['IBM_Plex_Sans_Thai',sans-serif]
                      bg-[#f0f0f0]
                      border-b-2 border-[#5b5b5b] border-l-0 border-r-0 border-t-0
                      px-4 py-[10px]
                      text-sm
                      text-[#5b5b5b]
                      w-full
                      min-h-[40px]
                    "
                  >
                    {childValue || "-"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

/**
 * Container component for review fields in the review step
 */
export function ReviewFields({
  groupedSections,
  fieldDefinitions,
  formData,
  aliases,
}: ReviewFieldsProps) {
  const getDisplayLabel = (definition: FieldDefinition) => {
    const key = definition.placeholder.replace(/\{\{|\}\}/g, "");
    return aliases[key] || aliases[definition.placeholder] || definition.label || key;
  };

  const renderReviewField = (definition: FieldDefinition) => {
    const key = definition.placeholder.replace(/\{\{|\}\}/g, "");
    const value = formData[key] || "";
    const childFields = definition.isRadioGroup
      ? getChildFieldsForRadioOption(definition, value, fieldDefinitions)
      : [];

    return (
      <ReviewField
        key={key}
        definition={definition}
        value={value}
        displayLabel={getDisplayLabel(definition)}
        childFields={childFields}
        formData={formData}
        aliases={aliases}
      />
    );
  };

  return (
    <div className="flex flex-col items-start w-full">
      <div className="flex flex-col items-start justify-center px-4 py-2 w-full">
        <div className="flex flex-col gap-4 items-start w-full">
          {groupedSections.length > 0 ? (
            groupedSections.map((section) => (
              <div key={section.name} className="w-full">
                <p className="font-['IBM_Plex_Sans_Thai',sans-serif] font-semibold text-[#171717] text-sm mb-3 mt-4 first:mt-0">
                  {section.name}
                </p>
                <div className="flex flex-col gap-4">
                  {section.fields.map(renderReviewField)}
                </div>
              </div>
            ))
          ) : (
            Object.entries(fieldDefinitions).map(([placeholder, definition]) =>
              renderReviewField(definition)
            )
          )}
        </div>
      </div>
    </div>
  );
}
