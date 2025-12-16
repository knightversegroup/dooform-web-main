"use client";

import { forwardRef, useState, useRef, useEffect } from "react";
import { Calendar, Type } from "lucide-react";
import { FieldDefinition, DateFormat } from "@/lib/api/types";

// Text case format options
type TextCaseFormat = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

const TEXT_CASE_OPTIONS: { value: TextCaseFormat; label: string }[] = [
    { value: 'none', label: 'ปกติ' },
    { value: 'capitalize', label: 'Aa Bb' },
    { value: 'uppercase', label: 'AA BB' },
    { value: 'lowercase', label: 'aa bb' },
];

// Format text based on case format
function formatTextCase(text: string, format: TextCaseFormat): string {
    if (!text) return text;
    switch (format) {
        case 'uppercase':
            return text.toUpperCase();
        case 'lowercase':
            return text.toLowerCase();
        case 'capitalize':
            // First convert to lowercase, then capitalize first letter of each word
            return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
        default:
            return text;
    }
}
import {
    validateField,
    DATA_TYPE_LABELS,
    DATE_FORMAT_OPTIONS,
    formatDateToDisplay,
    parseDateToISO,
    getDatePlaceholder,
} from "@/lib/utils/fieldTypes";
import { AddressAutocomplete, AddressSearchLevel } from "./AddressAutocomplete";
import { AddressSelection } from "@/lib/api/addressService";

interface SmartInputProps {
    definition: FieldDefinition;
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onAddressSelect?: (address: AddressSelection) => void;
    onDateFormatChange?: (format: DateFormat) => void;
    alias?: string;
    disabled?: boolean;
    showPlaceholderKey?: boolean;
    compact?: boolean;
    hideLabel?: boolean;
}

export const SmartInput = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, SmartInputProps>(
    ({ definition, value, onChange, onFocus, onBlur, onAddressSelect, onDateFormatChange, alias, disabled, showPlaceholderKey = true, compact = false, hideLabel = false }, ref) => {
        const [touched, setTouched] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [dateFormat, setDateFormat] = useState<DateFormat>(definition.dateFormat || 'dd/mm/yyyy');
        const [showDatePicker, setShowDatePicker] = useState(false);
        const [textCaseFormat, setTextCaseFormat] = useState<TextCaseFormat>('none');
        const datePickerRef = useRef<HTMLInputElement>(null);

        const label = alias || definition.placeholder.replace(/\{\{|\}\}/g, '');
        const placeholder = `กรอก ${label}`;

        const handleChange = (newValue: string) => {
            onChange(newValue);
            if (touched) {
                const validation = validateField(newValue, definition);
                setError(validation.error || null);
            }
        };

        const handleBlur = () => {
            setTouched(true);
            const validation = validateField(value, definition);
            setError(validation.error || null);
            onBlur?.();
        };

        const handleFocus = () => {
            onFocus?.();
        };

        const baseInputClass = `w-full ${compact ? 'p-2 text-sm' : 'p-2.5 text-sm'} text-foreground bg-background border rounded-xl focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted disabled:opacity-50 disabled:bg-surface-alt ${error ? "border-red-500" : "border-border-default"
            }`;

        const renderInput = () => {
            const { inputType, validation, dataType } = definition;

            // Select input
            if (inputType === 'select' && validation?.options) {
                return (
                    <select
                        ref={ref as React.Ref<HTMLSelectElement>}
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        className={baseInputClass}
                    >
                        <option value="">-- เลือก{label} --</option>
                        {validation.options.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                );
            }

            // Textarea input
            if (inputType === 'textarea') {
                return (
                    <textarea
                        ref={ref as React.Ref<HTMLTextAreaElement>}
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        placeholder={placeholder}
                        rows={3}
                        className={`${baseInputClass} resize-none`}
                    />
                );
            }

            // Date input with format selector
            if (inputType === 'date') {
                const displayValue = formatDateToDisplay(value, dateFormat);

                const openDatePicker = () => {
                    if (datePickerRef.current && !disabled) {
                        datePickerRef.current.showPicker?.();
                        datePickerRef.current.focus();
                        datePickerRef.current.click();
                    }
                };

                return (
                    <div className="flex gap-2 items-center">
                        {/* Date display/input with calendar picker */}
                        <div className="relative flex-1">
                            <input
                                ref={ref as React.Ref<HTMLInputElement>}
                                type="text"
                                value={displayValue}
                                onChange={(e) => {
                                    const isoValue = parseDateToISO(e.target.value, dateFormat);
                                    handleChange(isoValue);
                                }}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                disabled={disabled}
                                placeholder={getDatePlaceholder(dateFormat)}
                                className={`${baseInputClass} pr-10`}
                            />
                            {/* Calendar button */}
                            <button
                                type="button"
                                onClick={openDatePicker}
                                disabled={disabled}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#007398] transition-colors disabled:opacity-50"
                            >
                                <Calendar className="w-4 h-4" />
                            </button>
                            {/* Hidden date picker for calendar selection */}
                            <input
                                ref={datePickerRef}
                                type="date"
                                value={value}
                                onChange={(e) => handleChange(e.target.value)}
                                className="absolute top-0 right-0 w-0 h-0 opacity-0 pointer-events-none"
                                disabled={disabled}
                                tabIndex={-1}
                            />
                        </div>

                        {/* Format selector dropdown */}
                        <select
                            value={dateFormat}
                            onChange={(e) => {
                                const newFormat = e.target.value as DateFormat;
                                setDateFormat(newFormat);
                                onDateFormatChange?.(newFormat);
                            }}
                            disabled={disabled}
                            className={`${compact ? 'p-1.5 text-xs' : 'p-2 text-xs'} text-text-muted bg-surface-alt border border-border-default rounded-lg focus:outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-[100px]`}
                        >
                            {DATE_FORMAT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            }

            // Time input
            if (inputType === 'time') {
                return (
                    <input
                        ref={ref as React.Ref<HTMLInputElement>}
                        type="time"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        className={baseInputClass}
                    />
                );
            }

            // Number input
            if (inputType === 'number') {
                return (
                    <input
                        ref={ref as React.Ref<HTMLInputElement>}
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        placeholder={placeholder}
                        min={validation?.min}
                        max={validation?.max}
                        className={baseInputClass}
                    />
                );
            }

            // Checkbox input
            if (inputType === 'checkbox') {
                // Use defaultValue from definition, fallback to '/' if not set
                const checkedValue = definition.defaultValue || '/';
                const isChecked = value === checkedValue || value === 'true' || value === '1' || value === '✓' || value === 'yes';
                return (
                    <label className="flex items-center gap-3 cursor-pointer py-2">
                        <input
                            ref={ref as React.Ref<HTMLInputElement>}
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleChange(e.target.checked ? checkedValue : '')}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            disabled={disabled}
                            className="w-5 h-5 rounded border-border-default text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-foreground">
                            {isChecked ? 'ใช่ / Yes' : 'ไม่ใช่ / No'}
                        </span>
                    </label>
                );
            }

            // ID Number input (special formatting)
            if (dataType === 'id_number') {
                return (
                    <input
                        ref={ref as React.Ref<HTMLInputElement>}
                        type="text"
                        value={value}
                        onChange={(e) => {
                            // Only allow digits
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 13);
                            handleChange(digits);
                        }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        placeholder="X-XXXX-XXXXX-XX-X"
                        maxLength={13}
                        inputMode="numeric"
                        className={baseInputClass}
                    />
                );
            }

            // Address input with autocomplete and text case format
            // Check BOTH dataType AND placeholder pattern to handle cases where dataType hasn't been updated yet
            const placeholderLower = definition.placeholder.toLowerCase();
            const isAddressField = dataType === 'address' || dataType === 'province' || dataType === 'district' || dataType === 'subdistrict' ||
                placeholderLower.includes('province') || placeholderLower.includes('_prov') ||
                placeholderLower.includes('district') || placeholderLower.includes('amphoe') ||
                placeholderLower.includes('subdistrict') || placeholderLower.includes('sub_district') || placeholderLower.includes('tambon');

            if (isAddressField) {
                // Determine search level based on dataType and placeholder name
                let searchLevel: AddressSearchLevel = 'full';

                // Check subdistrict FIRST (before district) to handle sub_district pattern
                if (dataType === 'subdistrict' || placeholderLower.includes('subdistrict') || placeholderLower.includes('sub_district') || placeholderLower.includes('sub-district') || placeholderLower.includes('tambon') || placeholderLower.includes('ตำบล') || placeholderLower.includes('แขวง')) {
                    searchLevel = 'subdistrict';
                } else if (dataType === 'province' || placeholderLower.includes('province') || placeholderLower.includes('_prov')) {
                    searchLevel = 'province';
                } else if (dataType === 'district' || placeholderLower.includes('district') || placeholderLower.includes('amphoe') || placeholderLower.includes('อำเภอ') || placeholderLower.includes('เขต')) {
                    searchLevel = 'district';
                }

                const searchLevelPlaceholders: Record<AddressSearchLevel, string> = {
                    'full': 'พิมพ์ชื่อตำบล อำเภอ หรือจังหวัด...',
                    'province': 'พิมพ์ชื่อจังหวัด...',
                    'district': 'พิมพ์ชื่ออำเภอ/เขต...',
                    'subdistrict': 'พิมพ์ชื่อตำบล/แขวง...',
                };

                const handleAddressChange = (newValue: string) => {
                    const formattedValue = formatTextCase(newValue, textCaseFormat);
                    handleChange(formattedValue);
                };

                const handleAddressSelectWithFormat = (address: AddressSelection) => {
                    // Format the address values based on text case
                    const formattedAddress: AddressSelection = {
                        ...address,
                        province: formatTextCase(address.province, textCaseFormat),
                        district: formatTextCase(address.district, textCaseFormat),
                        subDistrict: formatTextCase(address.subDistrict, textCaseFormat),
                    };
                    onAddressSelect?.(formattedAddress);
                };

                return (
                    <div className="flex gap-2 items-start">
                        <div className="flex-1">
                            <AddressAutocomplete
                                value={value}
                                onChange={handleAddressChange}
                                onAddressSelect={handleAddressSelectWithFormat}
                                placeholder={searchLevelPlaceholders[searchLevel]}
                                searchLevel={searchLevel}
                                disabled={disabled}
                            />
                        </div>
                        {/* Text case format selector */}
                        <select
                            value={textCaseFormat}
                            onChange={(e) => {
                                const newFormat = e.target.value as TextCaseFormat;
                                setTextCaseFormat(newFormat);
                                // Apply new format to current value
                                if (value) {
                                    handleChange(formatTextCase(value, newFormat));
                                }
                            }}
                            disabled={disabled}
                            className={`${compact ? 'p-1.5 text-xs' : 'p-2 text-xs'} text-text-muted bg-surface-alt border border-border-default rounded-lg focus:outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-[70px]`}
                            title="รูปแบบตัวอักษร"
                        >
                            {TEXT_CASE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            }

            // Merged field input - single input that splits into multiple fields
            if (inputType === 'merged' && definition.isMerged && definition.mergedFields) {
                const fieldCount = definition.mergedFields.length;
                const separator = definition.separator || '';

                return (
                    <div className="space-y-2">
                        <input
                            ref={ref as React.Ref<HTMLInputElement>}
                            type="text"
                            value={value}
                            onChange={(e) => {
                                let newValue = e.target.value;
                                // If no separator, just limit to field count characters
                                if (!separator) {
                                    newValue = newValue.slice(0, fieldCount);
                                }
                                handleChange(newValue);
                            }}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            disabled={disabled}
                            placeholder={separator
                                ? `กรอก ${fieldCount} ค่า คั่นด้วย "${separator}"`
                                : `กรอก ${fieldCount} ตัวอักษร`
                            }
                            maxLength={separator ? undefined : fieldCount}
                            className={baseInputClass}
                        />
                        {/* Preview of how the value will be split */}
                        {value && (
                            <div className="flex flex-wrap gap-1">
                                {definition.mergedFields.map((field, idx) => {
                                    let fieldValue = '';
                                    if (separator) {
                                        const parts = value.split(separator);
                                        fieldValue = parts[idx] || '';
                                    } else {
                                        fieldValue = value[idx] || '';
                                    }
                                    return (
                                        <span
                                            key={field}
                                            className={`px-2 py-0.5 text-xs rounded ${
                                                fieldValue
                                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                                            }`}
                                        >
                                            {field}: {fieldValue || '?'}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            }

            // Default text input
            return (
                <input
                    ref={ref as React.Ref<HTMLInputElement>}
                    type="text"
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    disabled={disabled}
                    placeholder={placeholder}
                    maxLength={validation?.maxLength}
                    className={baseInputClass}
                />
            );
        };

        return (
            <div className={`flex flex-col ${compact ? 'gap-0.5' : 'gap-1'} w-full`}>
                {!hideLabel && (
                    <div className="flex items-center justify-between">
                        <label className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-foreground truncate`}>
                            {label}
                        </label>
                        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-text-muted px-1.5 py-0.5 bg-surface-alt rounded flex-shrink-0`}>
                            {DATA_TYPE_LABELS[definition.dataType] || definition.dataType}
                        </span>
                    </div>
                )}

                {renderInput()}

                {!compact && (
                    <div className="flex items-center justify-between">
                        {error ? (
                            <span className="text-xs text-red-500">{error}</span>
                        ) : definition.description ? (
                            <span className="text-xs text-text-muted">{definition.description}</span>
                        ) : (
                            <span />
                        )}
                        {showPlaceholderKey && alias && (
                            <span className="text-xs text-text-muted font-mono">
                                {definition.placeholder}
                            </span>
                        )}
                    </div>
                )}
                {compact && error && (
                    <span className="text-xs text-red-500">{error}</span>
                )}
            </div>
        );
    }
);

SmartInput.displayName = "SmartInput";
