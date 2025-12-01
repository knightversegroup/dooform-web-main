"use client";

import { forwardRef, useState } from "react";
import { FieldDefinition } from "@/lib/api/types";
import {
    validateField,
    DATA_TYPE_LABELS,
} from "@/lib/utils/fieldTypes";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { AddressSelection } from "@/lib/api/addressService";

interface SmartInputProps {
    definition: FieldDefinition;
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onAddressSelect?: (address: AddressSelection) => void;
    alias?: string;
    disabled?: boolean;
    showPlaceholderKey?: boolean;
    compact?: boolean;
}

export const SmartInput = forwardRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, SmartInputProps>(
    ({ definition, value, onChange, onFocus, onBlur, onAddressSelect, alias, disabled, showPlaceholderKey = true, compact = false }, ref) => {
        const [touched, setTouched] = useState(false);
        const [error, setError] = useState<string | null>(null);

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

            // Date input
            if (inputType === 'date') {
                return (
                    <input
                        ref={ref as React.Ref<HTMLInputElement>}
                        type="date"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        disabled={disabled}
                        className={baseInputClass}
                    />
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

            // Address input with autocomplete
            if (dataType === 'address' || dataType === 'province') {
                return (
                    <AddressAutocomplete
                        value={value}
                        onChange={handleChange}
                        onAddressSelect={onAddressSelect}
                        placeholder={dataType === 'province' ? 'พิมพ์ชื่อจังหวัด...' : 'พิมพ์ชื่อตำบล อำเภอ หรือจังหวัด...'}
                        disabled={disabled}
                    />
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
                <div className="flex items-center justify-between">
                    <label className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-foreground truncate`}>
                        {label}
                    </label>
                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-text-muted px-1.5 py-0.5 bg-surface-alt rounded flex-shrink-0`}>
                        {DATA_TYPE_LABELS[definition.dataType] || definition.dataType}
                    </span>
                </div>

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
