"use client";

import { forwardRef, useState, useRef, useEffect } from "react";
import { Calendar, Type } from "lucide-react";
import { FieldDefinition, DateFormat, RadioOption, LocationOutputFormat } from "@/lib/api/types";

// Text case format options
type TextCaseFormat = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

const TEXT_CASE_OPTIONS: { value: TextCaseFormat; label: string }[] = [
    { value: 'none', label: 'ปกติ' },
    { value: 'capitalize', label: 'Aa Bb' },
    { value: 'uppercase', label: 'AA BB' },
    { value: 'lowercase', label: 'aa bb' },
];

// Location output format options (Sub-district → District → Province order)
const LOCATION_OUTPUT_FORMAT_OPTIONS: { value: LocationOutputFormat; label: string; description: string }[] = [
    { value: 'subdistrict', label: 'Sub-district', description: 'ตำบล/แขวง (name_eng3)' },
    { value: 'district', label: 'District', description: 'อำเภอ/เขต (name_eng2)' },
    { value: 'province', label: 'Province', description: 'จังหวัด (name_eng1)' },
    { value: 'district_subdistrict', label: 'Sub-district + District', description: 'name_eng3, name_eng2' },
    { value: 'province_district', label: 'District + Province', description: 'name_eng2, name_eng1' },
    { value: 'all_english', label: 'All (Sub-district → District → Province)', description: 'name_eng3, name_eng2, name_eng1' },
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
    DATE_FORMAT_OPTIONS,
    formatDateToDisplay,
    parseDateToISO,
    getDatePlaceholder,
} from "@/lib/utils/fieldTypes";
import { AddressAutocomplete, AddressSearchLevel } from "./AddressAutocomplete";
import { AddressSelection } from "@/lib/api/addressService";

// Parse digit format pattern into segments
// Format: Use 'X' for digit, 'A' for letter, other chars are separators
// Examples: "XX-X-XXX-XXXX" for license plate, "XXXXXX" for 6-digit OTP
interface DigitSegment {
    type: 'input' | 'separator';
    value: string; // For separator, the separator char(s). For input, 'X' or 'A' pattern
    charType: 'digit' | 'letter' | 'any'; // For input segments
    length: number; // For input segments, how many chars
}

function parseDigitFormat(format: string): DigitSegment[] {
    const segments: DigitSegment[] = [];
    let currentInput = '';
    let currentCharType: 'digit' | 'letter' | 'any' = 'digit';
    let currentSeparator = '';

    for (let i = 0; i < format.length; i++) {
        const char = format[i];

        if (char === 'X' || char === 'x') {
            // Digit placeholder
            if (currentSeparator) {
                segments.push({ type: 'separator', value: currentSeparator, charType: 'any', length: 0 });
                currentSeparator = '';
            }
            if (currentInput && currentCharType !== 'digit') {
                segments.push({ type: 'input', value: currentInput, charType: currentCharType, length: currentInput.length });
                currentInput = '';
            }
            currentInput += char;
            currentCharType = 'digit';
        } else if (char === 'A' || char === 'a') {
            // Letter placeholder
            if (currentSeparator) {
                segments.push({ type: 'separator', value: currentSeparator, charType: 'any', length: 0 });
                currentSeparator = '';
            }
            if (currentInput && currentCharType !== 'letter') {
                segments.push({ type: 'input', value: currentInput, charType: currentCharType, length: currentInput.length });
                currentInput = '';
            }
            currentInput += char;
            currentCharType = 'letter';
        } else {
            // Separator character
            if (currentInput) {
                segments.push({ type: 'input', value: currentInput, charType: currentCharType, length: currentInput.length });
                currentInput = '';
            }
            currentSeparator += char;
        }
    }

    // Push any remaining content
    if (currentInput) {
        segments.push({ type: 'input', value: currentInput, charType: currentCharType, length: currentInput.length });
    }
    if (currentSeparator) {
        segments.push({ type: 'separator', value: currentSeparator, charType: 'any', length: 0 });
    }

    return segments;
}

// Parse value back based on format (extract only input characters)
function parseValueFromFormat(value: string, segments: DigitSegment[]): string[] {
    const inputSegments = segments.filter(s => s.type === 'input');
    const values: string[] = [];
    let valueIndex = 0;

    // Try to parse with separators first
    let separatorPattern = '';
    for (const seg of segments) {
        if (seg.type === 'separator') {
            separatorPattern += seg.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        } else {
            separatorPattern += `(.{0,${seg.length}})`;
        }
    }

    const regex = new RegExp(`^${separatorPattern}$`);
    const match = value.match(regex);

    if (match) {
        // Value matches the format with separators
        for (let i = 1; i < match.length; i++) {
            values.push(match[i] || '');
        }
    } else {
        // Value doesn't have separators, just split by length
        const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');
        for (const seg of inputSegments) {
            values.push(cleanValue.slice(valueIndex, valueIndex + seg.length));
            valueIndex += seg.length;
        }
    }

    return values;
}

// Combine values with format separators
function combineValuesWithFormat(values: string[], segments: DigitSegment[]): string {
    let result = '';
    let inputIndex = 0;

    for (const seg of segments) {
        if (seg.type === 'separator') {
            result += seg.value;
        } else {
            result += values[inputIndex] || '';
            inputIndex++;
        }
    }

    return result;
}

// DigitBlockInput component - Individual character boxes grouped by separator
interface DigitBlockInputProps {
    format: string;
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    disabled?: boolean;
    compact?: boolean;
}

function DigitBlockInput({ format, value, onChange, onFocus, onBlur, disabled, compact }: DigitBlockInputProps) {
    const segments = parseDigitFormat(format);

    // Calculate total input count for refs
    const totalInputs = segments.reduce((sum, seg) => sum + (seg.type === 'input' ? seg.length : 0), 0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Parse value into individual characters
    const getAllChars = (): string[] => {
        const chars: string[] = [];
        let valueIndex = 0;
        const cleanValue = value.replace(/[^a-zA-Z0-9]/g, '');

        for (const seg of segments) {
            if (seg.type === 'input') {
                for (let i = 0; i < seg.length; i++) {
                    chars.push(cleanValue[valueIndex] || '');
                    valueIndex++;
                }
            }
        }
        return chars;
    };

    const charValues = getAllChars();

    // Combine all character values back to format string
    const combineCharsToFormat = (chars: string[]): string => {
        let result = '';
        let charIndex = 0;

        for (const seg of segments) {
            if (seg.type === 'separator') {
                result += seg.value;
            } else {
                for (let i = 0; i < seg.length; i++) {
                    result += chars[charIndex] || '';
                    charIndex++;
                }
            }
        }
        return result;
    };

    const handleCharChange = (globalIndex: number, newValue: string, charType: 'digit' | 'letter' | 'any') => {
        // Filter based on char type
        let filtered = newValue.slice(-1); // Only take last character (for overwrite)
        if (charType === 'digit') {
            filtered = filtered.replace(/\D/g, '');
        } else if (charType === 'letter') {
            filtered = filtered.replace(/[^a-zA-Z]/g, '').toUpperCase();
        }

        // Update chars array
        const newChars = [...charValues];
        newChars[globalIndex] = filtered;

        // Combine and emit
        const combined = combineCharsToFormat(newChars);
        onChange(combined);

        // Auto-focus next input if this one is filled
        if (filtered && globalIndex < totalInputs - 1) {
            setTimeout(() => {
                inputRefs.current[globalIndex + 1]?.focus();
            }, 0);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, globalIndex: number) => {
        // Handle backspace to go to previous input
        if (e.key === 'Backspace') {
            if (charValues[globalIndex] === '' && globalIndex > 0) {
                e.preventDefault();
                inputRefs.current[globalIndex - 1]?.focus();
            } else if (charValues[globalIndex] !== '') {
                // Clear current and stay
                const newChars = [...charValues];
                newChars[globalIndex] = '';
                const combined = combineCharsToFormat(newChars);
                onChange(combined);
                e.preventDefault();
            }
        }
        // Handle arrow keys
        if (e.key === 'ArrowLeft' && globalIndex > 0) {
            e.preventDefault();
            inputRefs.current[globalIndex - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && globalIndex < totalInputs - 1) {
            e.preventDefault();
            inputRefs.current[globalIndex + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, globalIndex: number) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const cleanText = pastedText.replace(/[^a-zA-Z0-9]/g, '');

        const newChars = [...charValues];
        let textIndex = 0;
        let charIndex = 0;
        let currentGlobalIndex = 0;

        // Find the segment and position for globalIndex
        for (const seg of segments) {
            if (seg.type === 'input') {
                for (let i = 0; i < seg.length; i++) {
                    if (currentGlobalIndex >= globalIndex && textIndex < cleanText.length) {
                        const char = cleanText[textIndex];
                        if (seg.charType === 'digit' && /\d/.test(char)) {
                            newChars[currentGlobalIndex] = char;
                            textIndex++;
                        } else if (seg.charType === 'letter' && /[a-zA-Z]/.test(char)) {
                            newChars[currentGlobalIndex] = char.toUpperCase();
                            textIndex++;
                        } else if (seg.charType === 'any') {
                            newChars[currentGlobalIndex] = char;
                            textIndex++;
                        } else {
                            textIndex++; // Skip incompatible
                            i--; // Retry this position
                        }
                    }
                    currentGlobalIndex++;
                }
                charIndex++;
            }
        }

        const combined = combineCharsToFormat(newChars);
        onChange(combined);
    };

    const boxSize = compact ? 'w-8 h-9 text-sm' : 'w-10 h-11 text-base';
    const inputClass = `text-center font-mono ${boxSize} text-foreground bg-background border border-border-default rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all disabled:opacity-50 disabled:bg-surface-alt`;

    let globalInputIndex = 0;

    return (
        <div className="flex items-center gap-3 flex-wrap">
            {segments.map((segment, segIdx) => {
                if (segment.type === 'separator') {
                    return (
                        <span key={`sep-${segIdx}`} className="text-text-muted font-bold text-lg px-1">
                            {segment.value === ' ' ? '' : segment.value}
                        </span>
                    );
                }

                // Render a group of individual character inputs
                const groupInputs: React.ReactNode[] = [];
                const startIndex = globalInputIndex;

                for (let i = 0; i < segment.length; i++) {
                    const currentIndex = globalInputIndex;
                    const placeholder = segment.charType === 'digit' ? '0' : segment.charType === 'letter' ? 'A' : '?';
                    groupInputs.push(
                        <input
                            key={`char-${currentIndex}`}
                            ref={(el) => { inputRefs.current[currentIndex] = el; }}
                            type="text"
                            value={charValues[currentIndex] || ''}
                            onChange={(e) => handleCharChange(currentIndex, e.target.value, segment.charType)}
                            onKeyDown={(e) => handleKeyDown(e, currentIndex)}
                            onPaste={(e) => handlePaste(e, currentIndex)}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            disabled={disabled}
                            placeholder={placeholder}
                            maxLength={1}
                            inputMode={segment.charType === 'digit' ? 'numeric' : 'text'}
                            className={inputClass}
                        />
                    );
                    globalInputIndex++;
                }

                return (
                    <div key={`group-${segIdx}`} className="flex items-center gap-1 bg-surface-alt/30 p-1 rounded-lg">
                        {groupInputs}
                    </div>
                );
            })}
        </div>
    );
}

interface SmartInputProps {
    definition: FieldDefinition;
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onAddressSelect?: (address: AddressSelection) => void;
    onDateFormatChange?: (format: DateFormat) => void;
    onLocationOutputFormatChange?: (format: LocationOutputFormat) => void;
    alias?: string;
    disabled?: boolean;
    showPlaceholderKey?: boolean;
    compact?: boolean;
    hideLabel?: boolean;
}

export const SmartInput = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, SmartInputProps>(
    ({ definition, value, onChange, onFocus, onBlur, onAddressSelect, onDateFormatChange, onLocationOutputFormatChange, alias, disabled, showPlaceholderKey = true, compact = false, hideLabel = false }, ref) => {
        const [touched, setTouched] = useState(false);
        const [error, setError] = useState<string | null>(null);
        const [dateFormat, setDateFormat] = useState<DateFormat>(definition.dateFormat || 'dd/mm/yyyy');
        const [showDatePicker, setShowDatePicker] = useState(false);
        const [textCaseFormat, setTextCaseFormat] = useState<TextCaseFormat>('none');
        const [locationOutputFormat, setLocationOutputFormat] = useState<LocationOutputFormat>(definition.locationOutputFormat || 'district');
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

            // Radio group input (for mutually exclusive options like Male/Female)
            if (inputType === 'radio' && definition.isRadioGroup && definition.radioOptions) {
                // value format: "placeholder_key" (e.g., "$1" or "$2")
                // The selected placeholder gets "/" and others get ""
                return (
                    <div className="flex flex-col gap-2 py-2">
                        {definition.radioOptions.map((option) => {
                            const isSelected = value === option.placeholder;
                            return (
                                <label
                                    key={option.placeholder}
                                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name={definition.radioGroupId || definition.placeholder}
                                        checked={isSelected}
                                        onChange={() => handleChange(option.placeholder)}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        disabled={disabled}
                                        className="w-5 h-5 text-primary border-border-default focus:ring-primary focus:ring-offset-0 cursor-pointer"
                                    />
                                    <span className="text-sm text-foreground">
                                        {option.label}
                                    </span>
                                    <span className="text-xs text-text-muted font-mono ml-auto">
                                        {`{{${option.placeholder}}}`}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                );
            }

            // Digit block input (for OTP, license plates, ID segments, etc.)
            if (inputType === 'digit') {
                // Use digitFormat from definition, or default to 6-digit OTP format
                const format = definition.digitFormat || 'XXXXXX';
                return (
                    <DigitBlockInput
                        format={format}
                        value={value}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        compact={compact}
                    />
                );
            }

            // Location input with output format selector
            if (inputType === 'location') {
                // Determine search level based on output format
                const getSearchLevel = (format: LocationOutputFormat): AddressSearchLevel => {
                    switch (format) {
                        case 'province':
                            return 'province';
                        case 'district':
                        case 'province_district':
                            return 'district';
                        case 'subdistrict':
                        case 'district_subdistrict':
                        case 'all_english':
                        default:
                            return 'subdistrict';
                    }
                };

                const searchLevel = getSearchLevel(locationOutputFormat);

                const getPlaceholderText = (format: LocationOutputFormat): string => {
                    switch (format) {
                        case 'province':
                            return 'Search Province...';
                        case 'district':
                        case 'province_district':
                            return 'Search District...';
                        case 'subdistrict':
                        case 'district_subdistrict':
                        case 'all_english':
                        default:
                            return 'Search Sub-district...';
                    }
                };

                const handleLocationChange = (newValue: string) => {
                    const formattedValue = formatTextCase(newValue, textCaseFormat);
                    handleChange(formattedValue);
                };

                const handleLocationSelect = (address: AddressSelection) => {
                    // Format the value based on the selected output format with labels
                    let selectedValue = '';
                    switch (locationOutputFormat) {
                        case 'province':
                            selectedValue = formatTextCase(address.provinceEn, textCaseFormat) + ' Province';
                            break;
                        case 'district':
                            selectedValue = formatTextCase(address.districtEn, textCaseFormat) + ' District';
                            break;
                        case 'subdistrict':
                            selectedValue = formatTextCase(address.subDistrictEn, textCaseFormat) + ' Sub-district';
                            break;
                        case 'province_district':
                            // District → Province order
                            selectedValue = `${formatTextCase(address.districtEn, textCaseFormat)} District, ${formatTextCase(address.provinceEn, textCaseFormat)} Province`;
                            break;
                        case 'district_subdistrict':
                            // Sub-district → District order
                            selectedValue = `${formatTextCase(address.subDistrictEn, textCaseFormat)} Sub-district, ${formatTextCase(address.districtEn, textCaseFormat)} District`;
                            break;
                        case 'all_english':
                        default:
                            selectedValue = `${formatTextCase(address.subDistrictEn, textCaseFormat)} Sub-district, ${formatTextCase(address.districtEn, textCaseFormat)} District, ${formatTextCase(address.provinceEn, textCaseFormat)} Province`;
                            break;
                    }
                    handleChange(selectedValue);
                    onAddressSelect?.(address);
                };

                return (
                    <div className="flex gap-2 items-start">
                        <div className="flex-1">
                            <AddressAutocomplete
                                value={value}
                                onChange={handleLocationChange}
                                onAddressSelect={handleLocationSelect}
                                placeholder={getPlaceholderText(locationOutputFormat)}
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
                                if (value) {
                                    handleChange(formatTextCase(value, newFormat));
                                }
                            }}
                            disabled={disabled}
                            className={`${compact ? 'p-1.5 text-xs' : 'p-2 text-xs'} text-text-muted bg-surface-alt border border-border-default rounded-lg focus:outline-none focus:border-primary transition-colors disabled:opacity-50 min-w-[70px]`}
                            title="Text case format"
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
                    // Format the address values based on text case (use English names)
                    const formattedAddress: AddressSelection = {
                        ...address,
                        province: formatTextCase(address.province, textCaseFormat),
                        provinceEn: formatTextCase(address.provinceEn, textCaseFormat),
                        district: formatTextCase(address.district, textCaseFormat),
                        districtEn: formatTextCase(address.districtEn, textCaseFormat),
                        subDistrict: formatTextCase(address.subDistrict, textCaseFormat),
                        subDistrictEn: formatTextCase(address.subDistrictEn, textCaseFormat),
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
                            {definition.dataTypeLabel || definition.dataType}
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
