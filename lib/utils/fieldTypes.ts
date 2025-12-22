// Field Types Utility for Placeholder Detection and Input Configuration
// Note: Types are now imported from API types to ensure consistency with backend
import type {
    DataType,
    Entity,
    InputType,
    FieldValidation,
    FieldDefinition,
    DateFormat,
    RadioOption,
} from '@/lib/api/types';

// Re-export types for convenience
export type { DataType, Entity, InputType, FieldValidation, FieldDefinition, DateFormat, RadioOption };

// NOTE: Dropdown options (name prefixes, provinces, weekdays, zodiac, lunar months, etc.)
// are now managed via Configurable Data Types in the console, not hardcoded here.

// Date format options
export const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string; example: string }[] = [
    { value: 'yyyy/mm/dd', label: 'yyyy/mm/dd', example: '2025/02/01' },
    { value: 'dd/mm/yyyy', label: 'dd/mm/yyyy', example: '01/02/2025' },
    { value: 'mm/dd/yyyy', label: 'mm/dd/yyyy', example: '02/01/2025' },
    { value: 'dd MMM yyyy', label: 'dd MMM yyyy', example: '01 Feb 2025' },
];

// Month names for formatting
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Format date from ISO (YYYY-MM-DD) to selected format
export function formatDateToDisplay(isoDate: string, format: DateFormat): string {
    if (!isoDate) return '';

    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;

    const [year, month, day] = parts;

    switch (format) {
        case 'yyyy/mm/dd':
            return `${year}/${month}/${day}`;
        case 'dd/mm/yyyy':
            return `${day}/${month}/${year}`;
        case 'mm/dd/yyyy':
            return `${month}/${day}/${year}`;
        case 'dd MMM yyyy':
            const monthIndex = parseInt(month, 10) - 1;
            const monthName = MONTH_NAMES_SHORT[monthIndex] || month;
            return `${day} ${monthName} ${year}`;
        default:
            return isoDate;
    }
}

// Parse displayed date back to ISO format (YYYY-MM-DD)
export function parseDateToISO(displayDate: string, format: DateFormat): string {
    if (!displayDate) return '';

    let year: string, month: string, day: string;

    switch (format) {
        case 'yyyy/mm/dd': {
            const parts = displayDate.split('/');
            if (parts.length !== 3) return displayDate;
            [year, month, day] = parts;
            break;
        }
        case 'dd/mm/yyyy': {
            const parts = displayDate.split('/');
            if (parts.length !== 3) return displayDate;
            [day, month, year] = parts;
            break;
        }
        case 'mm/dd/yyyy': {
            const parts = displayDate.split('/');
            if (parts.length !== 3) return displayDate;
            [month, day, year] = parts;
            break;
        }
        case 'dd MMM yyyy': {
            const parts = displayDate.split(' ');
            if (parts.length !== 3) return displayDate;
            day = parts[0];
            const monthName = parts[1];
            year = parts[2];
            const monthIndex = MONTH_NAMES_SHORT.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
            month = monthIndex >= 0 ? String(monthIndex + 1).padStart(2, '0') : '01';
            break;
        }
        default:
            return displayDate;
    }

    // Ensure proper padding
    year = year.padStart(4, '0');
    month = month.padStart(2, '0');
    day = day.padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Get placeholder pattern for date format
export function getDatePlaceholder(format: DateFormat): string {
    switch (format) {
        case 'yyyy/mm/dd':
            return 'yyyy/mm/dd';
        case 'dd/mm/yyyy':
            return 'dd/mm/yyyy';
        case 'mm/dd/yyyy':
            return 'mm/dd/yyyy';
        case 'dd MMM yyyy':
            return 'dd MMM yyyy';
        default:
            return 'yyyy/mm/dd';
    }
}

// Entity detection from prefix
function detectEntity(key: string): Entity {
    if (key.startsWith('m_')) return 'mother';
    if (key.startsWith('f_')) return 'father';
    if (key.startsWith('b_')) return 'informant';
    if (key.startsWith('r_')) return 'registrar';
    // Child/newborn fields (no prefix)
    if (['first_name', 'last_name', 'name_prefix', 'id_number', 'dob', 'place_of_birth'].includes(key)) {
        return 'child';
    }
    return 'general';
}

// Entity labels in Thai
export const ENTITY_LABELS: Record<Entity, string> = {
    child: 'เด็ก/ผู้เกิด',
    mother: 'มารดา',
    father: 'บิดา',
    informant: 'ผู้แจ้งเกิด',
    registrar: 'นายทะเบียน',
    general: 'ทั่วไป',
};

// NOTE: Data type labels are now loaded from Configurable Data Types in the console.
// Use the 'name' field from ConfigurableDataType instead of hardcoded labels.

// Auto-detect field type from placeholder name
export function detectFieldType(placeholder: string): FieldDefinition {
    // Remove {{ and }} from placeholder
    const key = placeholder.replace(/\{\{|\}\}/g, '');
    const lowerKey = key.toLowerCase();

    // Detect entity
    const entity = detectEntity(key);

    // Default definition
    const definition: FieldDefinition = {
        placeholder,
        dataType: 'text',
        entity,
        inputType: 'text',
    };

    // ID Number patterns - validation comes from configurable data types
    if (lowerKey.includes('_id') || lowerKey === 'id_number' || lowerKey === 'id') {
        definition.dataType = 'id_number';
        definition.inputType = 'text';
        // Validation is loaded from configurable data types, not hardcoded
        return definition;
    }

    // Name prefix patterns - options come from configurable data types
    if (lowerKey.includes('name_prefix') || lowerKey.includes('_prefix')) {
        definition.dataType = 'name_prefix';
        definition.inputType = 'select';
        // Options are loaded from configurable data types, not hardcoded
        return definition;
    }

    // Age patterns
    if (lowerKey.includes('_age') || lowerKey === 'age') {
        definition.dataType = 'number';
        definition.inputType = 'number';
        definition.validation = { min: 0, max: 150 };
        return definition;
    }

    // Date patterns
    if (lowerKey === 'dob' || lowerKey.includes('date') || lowerKey.includes('_date')) {
        definition.dataType = 'date';
        definition.inputType = 'date';
        return definition;
    }

    // Time patterns
    if (lowerKey === 'time' || lowerKey.includes('_time')) {
        definition.dataType = 'time';
        definition.inputType = 'time';
        return definition;
    }

    // Weekday patterns - options come from configurable data types
    if (lowerKey === 'weekday' || lowerKey.includes('weekday')) {
        definition.dataType = 'weekday';
        definition.inputType = 'select';
        // Options are loaded from configurable data types, not hardcoded
        return definition;
    }

    // Province patterns - options come from configurable data types
    if (lowerKey.includes('_prov') || lowerKey.includes('province')) {
        definition.dataType = 'province';
        definition.inputType = 'select';
        // Options are loaded from configurable data types, not hardcoded
        return definition;
    }

    // Subdistrict patterns (tambon/ตำบล/แขวง) - check BEFORE district to handle sub_district
    if (lowerKey.includes('subdistrict') || lowerKey.includes('sub_district') || lowerKey.includes('sub-district') ||
        lowerKey.includes('tambon') || lowerKey.includes('ตำบล') || lowerKey.includes('แขวง')) {
        definition.dataType = 'subdistrict';
        definition.inputType = 'text';
        return definition;
    }

    // District patterns (amphoe/เขต - more specific than address)
    // This runs after subdistrict check, so we don't need to exclude subdistrict patterns
    if (lowerKey.includes('district') || lowerKey.includes('amphoe') || lowerKey.includes('อำเภอ') || lowerKey.includes('เขต')) {
        definition.dataType = 'district';
        definition.inputType = 'text';
        return definition;
    }

    // Country patterns
    if (lowerKey.includes('_country') || lowerKey.includes('country')) {
        definition.dataType = 'country';
        definition.inputType = 'text';
        return definition;
    }

    // Address patterns
    if (lowerKey.includes('_address') || lowerKey.includes('address')) {
        definition.dataType = 'address';
        definition.inputType = 'textarea';
        return definition;
    }

    // Officer name pattern - must be before generic _name pattern
    if (lowerKey.includes('officer_name') || lowerKey === 'officer') {
        definition.dataType = 'officer_name';
        definition.inputType = 'select';
        return definition;
    }

    // Name patterns (first_name, last_name, etc.)
    if (lowerKey.includes('first_name') || lowerKey.includes('last_name') ||
        lowerKey.includes('maiden_name') || lowerKey.includes('_name')) {
        definition.dataType = 'name';
        definition.inputType = 'text';
        return definition;
    }

    // House code patterns
    if (lowerKey.includes('house_code') || lowerKey.includes('house_no')) {
        definition.dataType = 'house_code';
        definition.inputType = 'text';
        return definition;
    }

    // Zodiac patterns - options come from configurable data types
    if (lowerKey.includes('zodiac') || lowerKey === 'cn_zodiac') {
        definition.dataType = 'zodiac';
        definition.inputType = 'select';
        // Options are loaded from configurable data types, not hardcoded
        return definition;
    }

    // Lunar month patterns - options come from configurable data types
    if (lowerKey.includes('luna') || lowerKey === 'luna_m') {
        definition.dataType = 'lunar_month';
        definition.inputType = 'select';
        // Options are loaded from configurable data types, not hardcoded
        return definition;
    }

    // Registration office
    if (lowerKey.includes('regis_office') || lowerKey.includes('office')) {
        definition.dataType = 'text';
        definition.inputType = 'text';
        return definition;
    }

    // Place of birth
    if (lowerKey.includes('place_of_birth')) {
        definition.dataType = 'address';
        definition.inputType = 'text';
        return definition;
    }

    // Number patterns (4d_, n1, n2, $1, $2, etc.)
    if (/^4d_\d+$/.test(key) || /^n\d+$/.test(key) || /^\$\d+$/.test(key) || /^\$\d+_D$/.test(key)) {
        definition.dataType = 'number';
        definition.inputType = 'text';
        if (key.startsWith('4d_')) {
            definition.validation = { pattern: '^\\d{4}$', maxLength: 4 };
            definition.description = 'รหัส 4 หลัก';
        }
        return definition;
    }

    // Child number
    if (lowerKey === 'child_no') {
        definition.dataType = 'number';
        definition.inputType = 'number';
        definition.validation = { min: 1, max: 20 };
        return definition;
    }

    return definition;
}

// Generate field definitions for all placeholders
export function generateFieldDefinitions(placeholders: string[]): Record<string, FieldDefinition> {
    const definitions: Record<string, FieldDefinition> = {};

    placeholders.forEach((placeholder) => {
        const key = placeholder.replace(/\{\{|\}\}/g, '');
        definitions[key] = detectFieldType(placeholder);
    });

    return definitions;
}

// Group labels in Thai
export const GROUP_LABELS: Record<string, string> = {
    'dollar_numbers': 'ตัวเลข ($)',
    'dollar_numbers_D': 'ตัวเลข ($ - D)',
    'dollar_numbers_M': 'ตัวเลข ($ - M)',
    'n_numbers': 'ตัวเลข (n)',
    '4d_codes': 'รหัส 4 หลัก',
};

// Get group label (with fallback)
export function getGroupLabel(group: string): string {
    if (GROUP_LABELS[group]) {
        return GROUP_LABELS[group];
    }
    // Handle dynamic group names like dollar_numbers_X
    if (group.startsWith('dollar_numbers_')) {
        const suffix = group.replace('dollar_numbers_', '');
        return `ตัวเลข ($ - ${suffix})`;
    }
    return group;
}

// Group fields by entity, respecting the order field
export function groupFieldsByEntity(definitions: Record<string, FieldDefinition>, placeholderOrder?: string[]): Record<Entity, FieldDefinition[]> {
    const grouped: Record<Entity, FieldDefinition[]> = {
        child: [],
        mother: [],
        father: [],
        informant: [],
        registrar: [],
        general: [],
    };

    // Convert to array and sort by order field (if present), then by placeholderOrder, then by key
    const entries = Object.entries(definitions);

    // Sort primarily by order field
    entries.sort((a, b) => {
        const orderA = a[1].order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b[1].order ?? Number.MAX_SAFE_INTEGER;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // Fallback to placeholder order if order is the same
        if (placeholderOrder && placeholderOrder.length > 0) {
            const keyA = a[0];
            const keyB = b[0];
            const indexA = placeholderOrder.findIndex(p => p.replace(/\{\{|\}\}/g, '') === keyA);
            const indexB = placeholderOrder.findIndex(p => p.replace(/\{\{|\}\}/g, '') === keyB);
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
            }
        }

        // Final fallback: alphabetical
        return a[0].localeCompare(b[0]);
    });

    // Group by entity
    entries.forEach(([, def]) => {
        grouped[def.entity].push(def);
    });

    return grouped;
}

// Group fields by saved group name (from canvas sections)
export interface GroupedSection {
    name: string;
    fields: FieldDefinition[];
    colorIndex: number;
}

export function groupFieldsBySavedGroup(definitions: Record<string, FieldDefinition>): GroupedSection[] {
    const groupMap: Record<string, { fields: FieldDefinition[]; minOrder: number; colorIndex: number }> = {};

    // Group fields by their saved group name
    // Group format can be "name|colorIndex" or just "name"
    // Skip hidden fields (merged_hidden_, radio_hidden_, radio_child_)
    Object.entries(definitions).forEach(([, def]) => {
        // Skip hidden fields - these should already be filtered, but double-check here
        if (def.group?.startsWith("merged_hidden_") ||
            def.group?.startsWith("radio_hidden_") ||
            def.group?.startsWith("radio_child_")) {
            return;
        }
        const rawGroup = def.group || "ทั่วไป";
        // Parse group format: "name|colorIndex" or just "name"
        const [groupName, colorStr] = rawGroup.includes("|")
            ? rawGroup.split("|")
            : [rawGroup, "0"];
        const colorIndex = parseInt(colorStr, 10) || 0;
        const order = def.order ?? 9999;

        if (!groupMap[groupName]) {
            groupMap[groupName] = { fields: [], minOrder: order, colorIndex };
        }

        groupMap[groupName].fields.push(def);

        if (order < groupMap[groupName].minOrder) {
            groupMap[groupName].minOrder = order;
        }
    });

    // Sort fields within each group by order
    Object.values(groupMap).forEach((group) => {
        group.fields.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
    });

    // Sort groups by their minimum order and return as array
    return Object.entries(groupMap)
        .sort(([, a], [, b]) => a.minOrder - b.minOrder)
        .map(([name, group]) => ({
            name,
            fields: group.fields,
            colorIndex: group.colorIndex,
        }));
}

// Group fields by their group property (for number patterns like $1, $1_D, etc.)
export interface FieldGroup {
    name: string;
    label: string;
    fields: FieldDefinition[];
}

export function groupFieldsByGroup(definitions: Record<string, FieldDefinition>): {
    grouped: FieldGroup[];
    ungrouped: FieldDefinition[];
} {
    const groupMap = new Map<string, FieldDefinition[]>();
    const ungrouped: FieldDefinition[] = [];

    // Separate grouped and ungrouped fields
    Object.values(definitions).forEach((def) => {
        if (def.group) {
            if (!groupMap.has(def.group)) {
                groupMap.set(def.group, []);
            }
            groupMap.get(def.group)!.push(def);
        } else {
            ungrouped.push(def);
        }
    });

    // Sort fields within each group by groupOrder
    const grouped: FieldGroup[] = [];
    groupMap.forEach((fields, groupName) => {
        fields.sort((a, b) => (a.groupOrder || 0) - (b.groupOrder || 0));
        grouped.push({
            name: groupName,
            label: getGroupLabel(groupName),
            fields,
        });
    });

    // Sort groups by name
    grouped.sort((a, b) => a.name.localeCompare(b.name));

    return { grouped, ungrouped };
}

// Combined grouping: first by entity, then by group within each entity
export interface EntityWithGroups {
    entity: Entity;
    label: string;
    groups: FieldGroup[];
    ungroupedFields: FieldDefinition[];
}

export function groupFieldsByEntityAndGroup(definitions: Record<string, FieldDefinition>): EntityWithGroups[] {
    // First group by entity
    const byEntity = groupFieldsByEntity(definitions);

    const result: EntityWithGroups[] = [];

    (Object.keys(byEntity) as Entity[]).forEach((entity) => {
        const entityFields = byEntity[entity];
        if (entityFields.length === 0) return;

        // Then group by group within this entity
        const groupMap = new Map<string, FieldDefinition[]>();
        const ungroupedFields: FieldDefinition[] = [];

        entityFields.forEach((def) => {
            if (def.group) {
                if (!groupMap.has(def.group)) {
                    groupMap.set(def.group, []);
                }
                groupMap.get(def.group)!.push(def);
            } else {
                ungroupedFields.push(def);
            }
        });

        // Convert map to array and sort
        const groups: FieldGroup[] = [];
        groupMap.forEach((fields, groupName) => {
            fields.sort((a, b) => (a.groupOrder || 0) - (b.groupOrder || 0));
            groups.push({
                name: groupName,
                label: getGroupLabel(groupName),
                fields,
            });
        });
        groups.sort((a, b) => a.name.localeCompare(b.name));

        result.push({
            entity,
            label: ENTITY_LABELS[entity],
            groups,
            ungroupedFields,
        });
    });

    return result;
}

// Import MergeableGroup type
import type { MergeableGroup } from '@/lib/api/types';

// Detect mergeable sequential field groups from placeholders
// e.g., $1, $2, ..., $13 -> suggests merging into one field
export function detectMergeableGroups(placeholders: string[]): MergeableGroup[] {
    const groups: MergeableGroup[] = [];

    // Pattern definitions for sequential fields
    const patterns = [
        { regex: /^\$(\d+)$/, prefix: '$', label: 'ตัวเลข' },
        { regex: /^n(\d+)$/, prefix: 'n', label: 'ตัวเลข n' },
        { regex: /^4d_(\d+)$/, prefix: '4d_', label: 'รหัส 4 หลัก' },
        { regex: /^d(\d+)$/, prefix: 'd', label: 'หลักที่' },
        { regex: /^num(\d+)$/, prefix: 'num', label: 'ตัวเลข' },
        { regex: /^digit(\d+)$/, prefix: 'digit', label: 'หลัก' },
    ];

    // Clean placeholder keys (remove {{ }})
    const cleanedPlaceholders = placeholders.map(p =>
        p.replace(/^\{\{/, '').replace(/\}\}$/, '')
    );

    for (const pattern of patterns) {
        // Find all placeholders matching this pattern
        const matches: { key: string; num: number }[] = [];

        for (const key of cleanedPlaceholders) {
            const match = key.match(pattern.regex);
            if (match) {
                matches.push({ key, num: parseInt(match[1], 10) });
            }
        }

        if (matches.length < 2) continue;

        // Sort by number
        matches.sort((a, b) => a.num - b.num);

        // Find consecutive sequences
        let sequenceStart = 0;
        for (let i = 1; i <= matches.length; i++) {
            // Check if sequence breaks or ends
            const isBreak = i === matches.length || matches[i].num !== matches[i - 1].num + 1;

            if (isBreak) {
                const sequenceLength = i - sequenceStart;

                // Only consider sequences of 3 or more
                if (sequenceLength >= 3) {
                    const startNum = matches[sequenceStart].num;
                    const endNum = matches[i - 1].num;
                    const fields = matches.slice(sequenceStart, i).map(m => m.key);

                    // Suggest separator based on field count
                    let suggestedSeparator = '';
                    if (sequenceLength === 13) {
                        suggestedSeparator = ''; // Likely ID number
                    } else if (sequenceLength === 10) {
                        suggestedSeparator = ''; // Likely phone number
                    }

                    groups.push({
                        pattern: `${pattern.prefix}${startNum}-${pattern.prefix}${endNum}`,
                        prefix: pattern.prefix,
                        startNum,
                        endNum,
                        fields,
                        suggestedLabel: `${pattern.label} ${sequenceLength} หลัก (${pattern.prefix}${startNum}-${pattern.prefix}${endNum})`,
                        suggestedSeparator,
                    });
                }

                sequenceStart = i;
            }
        }
    }

    return groups;
}

// Create a merged field definition from a group of fields
export function createMergedFieldDefinition(
    group: MergeableGroup,
    customLabel?: string,
    customSeparator?: string
): FieldDefinition {
    const separator = customSeparator ?? group.suggestedSeparator;
    const totalLength = group.fields.length;

    return {
        placeholder: `{{${group.fields[0]}}}`, // Use first field as the "main" placeholder
        dataType: 'text',
        entity: 'general',
        inputType: 'merged',
        label: customLabel || group.suggestedLabel,
        description: `รวม ${totalLength} ช่อง: ${group.pattern}`,
        group: group.prefix + '_merged',
        isMerged: true,
        mergedFields: group.fields,
        separator,
        mergePattern: group.pattern,
        validation: {
            minLength: totalLength,
            maxLength: totalLength * 2, // Allow some flexibility
        },
    };
}

// Split merged value back into individual field values
export function splitMergedValue(
    value: string,
    mergedFields: string[],
    separator: string = ''
): Record<string, string> {
    const result: Record<string, string> = {};

    if (separator) {
        // Split by separator
        const parts = value.split(separator);
        mergedFields.forEach((field, index) => {
            result[field] = parts[index] || '';
        });
    } else {
        // Split character by character
        const chars = value.split('');
        mergedFields.forEach((field, index) => {
            result[field] = chars[index] || '';
        });
    }

    return result;
}

// Join individual field values into merged value
export function joinMergedValues(
    values: Record<string, string>,
    mergedFields: string[],
    separator: string = ''
): string {
    return mergedFields.map(field => values[field] || '').join(separator);
}

// Validate a value against a field definition
export function validateField(value: string, definition: FieldDefinition): { valid: boolean; error?: string } {
    if (!definition.validation) {
        return { valid: true };
    }

    const { pattern, minLength, maxLength, min, max, options, required } = definition.validation;

    if (required && !value) {
        return { valid: false, error: 'กรุณากรอกข้อมูล' };
    }

    if (!value) {
        return { valid: true };
    }

    if (pattern) {
        const regex = new RegExp(pattern);
        if (!regex.test(value)) {
            return { valid: false, error: 'รูปแบบข้อมูลไม่ถูกต้อง' };
        }
    }

    if (minLength && value.length < minLength) {
        return { valid: false, error: `ต้องมีอย่างน้อย ${minLength} ตัวอักษร` };
    }

    if (maxLength && value.length > maxLength) {
        return { valid: false, error: `ต้องไม่เกิน ${maxLength} ตัวอักษร` };
    }

    if (min !== undefined || max !== undefined) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return { valid: false, error: 'กรุณากรอกตัวเลข' };
        }
        if (min !== undefined && numValue < min) {
            return { valid: false, error: `ค่าต้องไม่น้อยกว่า ${min}` };
        }
        if (max !== undefined && numValue > max) {
            return { valid: false, error: `ค่าต้องไม่เกิน ${max}` };
        }
    }

    if (options && options.length > 0 && !options.includes(value)) {
        return { valid: false, error: 'กรุณาเลือกจากตัวเลือกที่กำหนด' };
    }

    return { valid: true };
}

// ============================================================================
// Radio Group Utilities
// ============================================================================

/**
 * Create a radio group field definition from multiple checkbox placeholders.
 * This groups mutually exclusive options (like Male/Female) into a single radio input.
 *
 * @param groupId - Unique identifier for the radio group
 * @param label - Display label for the radio group
 * @param options - Array of radio options with placeholders and labels
 * @param baseDefinition - Optional base field definition to extend
 * @returns FieldDefinition configured as a radio group
 *
 * @example
 * // For Male/Female checkboxes where $1 = Male, $2 = Female
 * const radioGroup = createRadioGroupDefinition(
 *   'sex_selection',
 *   'เพศ / Sex',
 *   [
 *     { placeholder: '$1', label: 'ชาย / Male', value: '/' },
 *     { placeholder: '$2', label: 'หญิง / Female', value: '/' }
 *   ]
 * );
 */
export function createRadioGroupDefinition(
    groupId: string,
    label: string,
    options: RadioOption[],
    baseDefinition?: Partial<FieldDefinition>
): FieldDefinition {
    // Use the first option's placeholder as the master placeholder
    const masterPlaceholder = options[0]?.placeholder || groupId;

    return {
        placeholder: `{{${masterPlaceholder}}}`,
        dataType: 'text',
        entity: 'general',
        inputType: 'radio',
        label,
        isRadioGroup: true,
        radioGroupId: groupId,
        radioOptions: options,
        ...baseDefinition,
    };
}

/**
 * Expand a radio group selection into individual placeholder values.
 * The selected placeholder gets the checked value (e.g., "/"), others get empty string.
 *
 * @param selectedPlaceholder - The placeholder key that was selected
 * @param radioOptions - All options in the radio group
 * @returns Record mapping each placeholder to its value
 *
 * @example
 * // If user selects Male ($1):
 * const values = expandRadioGroupValue('$1', [
 *   { placeholder: '$1', label: 'Male', value: '/' },
 *   { placeholder: '$2', label: 'Female', value: '/' }
 * ]);
 * // Result: { '$1': '/', '$2': '' }
 */
export function expandRadioGroupValue(
    selectedPlaceholder: string,
    radioOptions: RadioOption[]
): Record<string, string> {
    const result: Record<string, string> = {};

    for (const option of radioOptions) {
        result[option.placeholder] = option.placeholder === selectedPlaceholder
            ? (option.value || '/')
            : '';
    }

    return result;
}

/**
 * Get the selected option from a radio group based on current form values.
 * Useful for determining which radio should be checked when loading existing data.
 *
 * @param formValues - Current form values record
 * @param radioOptions - All options in the radio group
 * @returns The placeholder key of the selected option, or empty string if none selected
 */
export function getRadioGroupSelectedValue(
    formValues: Record<string, string>,
    radioOptions: RadioOption[]
): string {
    for (const option of radioOptions) {
        const value = formValues[option.placeholder];
        // Check if this option is selected (has a truthy value like "/" or "✓")
        if (value && value.trim() !== '') {
            return option.placeholder;
        }
    }
    return '';
}

/**
 * Detect potential radio groups from existing checkbox field definitions.
 * This looks for pairs/groups of checkboxes that might be mutually exclusive.
 *
 * @param definitions - Field definitions to analyze
 * @returns Array of suggested radio group configurations
 */
export function detectPotentialRadioGroups(
    definitions: Record<string, FieldDefinition>
): Array<{
    groupId: string;
    placeholders: string[];
    suggestion: string;
}> {
    const checkboxFields = Object.entries(definitions)
        .filter(([_, def]) => def.inputType === 'checkbox')
        .map(([key, def]) => ({ key, def }));

    const suggestions: Array<{
        groupId: string;
        placeholders: string[];
        suggestion: string;
    }> = [];

    // Look for common patterns that suggest mutual exclusivity
    const patterns = [
        { keywords: ['male', 'female', 'ชาย', 'หญิง', 'sex', 'เพศ'], suggestion: 'เพศ / Sex' },
        { keywords: ['yes', 'no', 'ใช่', 'ไม่ใช่'], suggestion: 'ใช่/ไม่ใช่' },
        { keywords: ['married', 'single', 'divorced', 'สมรส', 'โสด'], suggestion: 'สถานภาพ' },
        { keywords: ['alive', 'deceased', 'มีชีวิต', 'เสียชีวิต'], suggestion: 'สถานะ' },
    ];

    // Group checkboxes by their numeric suffix (e.g., $1, $2 might be related)
    const dollarGroups = new Map<string, string[]>();
    for (const { key } of checkboxFields) {
        const match = key.match(/^\$(\d+)$/);
        if (match) {
            const num = parseInt(match[1], 10);
            // Group consecutive numbers
            const groupKey = Math.floor((num - 1) / 2).toString();
            if (!dollarGroups.has(groupKey)) {
                dollarGroups.set(groupKey, []);
            }
            dollarGroups.get(groupKey)!.push(key);
        }
    }

    // Add suggestions for dollar-prefixed pairs
    for (const [groupKey, placeholders] of dollarGroups) {
        if (placeholders.length === 2) {
            suggestions.push({
                groupId: `dollar_radio_${groupKey}`,
                placeholders: placeholders.sort(),
                suggestion: `Radio group for ${placeholders.join(', ')}`,
            });
        }
    }

    return suggestions;
}
