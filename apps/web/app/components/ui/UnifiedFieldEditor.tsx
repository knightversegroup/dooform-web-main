"use client";

import { useState, useMemo, useCallback } from "react";
import {
    ChevronDown,
    ChevronRight,
    Edit3,
    Check,
    X,
    Sparkles,
    Loader2,
    GripVertical,
    Settings2,
} from "lucide-react";
import type {
    FieldDefinition,
    Entity,
    DataType,
    InputType,
    ConfigurableDataType,
    ConfigurableInputType,
    FieldTypeSuggestion,
} from "@/lib/api/types";
import { ENTITY_LABELS } from "@/lib/utils/fieldTypes";

// Dynamic section colors - must match canvas SECTION_COLORS
const SECTION_COLOR_PALETTE = [
    { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800", pill: "bg-amber-100 text-amber-700" },
    { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800", pill: "bg-blue-100 text-blue-700" },
    { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-800", pill: "bg-pink-100 text-pink-700" },
    { bg: "bg-green-50", border: "border-green-300", text: "text-green-800", pill: "bg-green-100 text-green-700" },
    { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-800", pill: "bg-indigo-100 text-indigo-700" },
    { bg: "bg-red-50", border: "border-red-300", text: "text-red-800", pill: "bg-red-100 text-red-700" },
    { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-800", pill: "bg-gray-100 text-gray-700" },
    { bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-800", pill: "bg-cyan-100 text-cyan-700" },
];

// Entity to color index mapping (for entity-based fallback)
const ENTITY_COLOR_MAP: Record<Entity, number> = {
    child: 2,
    mother: 4,
    father: 1,
    informant: 0,
    registrar: 3,
    general: 6,
};

interface FieldItem {
    key: string;
    definition: FieldDefinition;
    order: number;
}

interface SectionData {
    name: string;
    fields: FieldItem[];
    colorIndex: number;
}

interface UnifiedFieldEditorProps {
    fieldDefinitions: Record<string, FieldDefinition>;
    aliases: Record<string, string>;
    dataTypes?: ConfigurableDataType[];
    inputTypes?: ConfigurableInputType[];
    onAliasChange: (key: string, alias: string) => void;
    onFieldDefinitionChange: (key: string, updates: Partial<FieldDefinition>) => void;
    onSuggestFieldTypes?: () => Promise<FieldTypeSuggestion[]>;
    suggestingFieldTypes?: boolean;
    disabled?: boolean;
}

interface FieldRowProps {
    field: FieldItem;
    alias: string;
    color: typeof SECTION_COLOR_PALETTE[0];
    dataTypes?: ConfigurableDataType[];
    inputTypes?: ConfigurableInputType[];
    onAliasChange: (alias: string) => void;
    onFieldDefinitionChange: (updates: Partial<FieldDefinition>) => void;
    suggestion?: FieldTypeSuggestion;
    onApplySuggestion?: () => void;
    disabled?: boolean;
}

function FieldRow({
    field,
    alias,
    color,
    dataTypes,
    inputTypes,
    onAliasChange,
    onFieldDefinitionChange,
    suggestion,
    onApplySuggestion,
    disabled,
}: FieldRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(alias || field.key);
    const [showSettings, setShowSettings] = useState(false);

    const handleSaveAlias = () => {
        onAliasChange(editValue.trim() || field.key);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditValue(alias || field.key);
        setIsEditing(false);
    };

    const getDataTypeLabel = (code: string) => {
        const dt = dataTypes?.find(t => t.code === code);
        return dt?.name || code;
    };

    const getInputTypeLabel = (code: string) => {
        const it = inputTypes?.find(t => t.code === code);
        return it?.name || code;
    };

    return (
        <div className={`group border-b border-gray-100 last:border-b-0 ${suggestion ? 'bg-indigo-50/50' : ''}`}>
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50/50">
                <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 cursor-grab" />

                {/* Alias / Name */}
                <div className="flex-1 min-w-0">
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveAlias();
                                    if (e.key === "Escape") handleCancelEdit();
                                }}
                            />
                            <button
                                onClick={handleSaveAlias}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 truncate">
                                {alias || field.key}
                            </span>
                            <button
                                onClick={() => {
                                    setEditValue(alias || field.key);
                                    setIsEditing(true);
                                }}
                                disabled={disabled}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 rounded"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                    <p className="text-xs text-gray-400 font-mono truncate mt-0.5">
                        {field.key}
                    </p>
                </div>

                {/* Type badges */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${color.pill}`}>
                        {getDataTypeLabel(field.definition.dataType)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                        {getInputTypeLabel(field.definition.inputType)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                        {ENTITY_LABELS[field.definition.entity as Entity] || field.definition.entity}
                    </span>

                    {/* Settings button */}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-1 rounded transition-colors ${showSettings ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Settings2 className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* AI Suggestion indicator */}
                {suggestion && (
                    <button
                        onClick={onApplySuggestion}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                    >
                        <Sparkles className="w-3 h-3" />
                        ใช้
                    </button>
                )}
            </div>

            {/* Expanded settings panel */}
            {showSettings && (
                <div className="px-3 pb-3 pt-1 bg-gray-50/50 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-3">
                        {/* Data Type */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">ประเภทข้อมูล</label>
                            <select
                                value={field.definition.dataType}
                                onChange={(e) => onFieldDefinitionChange({ dataType: e.target.value as DataType })}
                                disabled={disabled}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                            >
                                {dataTypes?.map((dt) => (
                                    <option key={dt.code} value={dt.code}>
                                        {dt.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Input Type */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">ประเภท Input</label>
                            <select
                                value={field.definition.inputType}
                                onChange={(e) => onFieldDefinitionChange({ inputType: e.target.value as InputType })}
                                disabled={disabled}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                            >
                                {inputTypes?.map((it) => (
                                    <option key={it.code} value={it.code}>
                                        {it.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Entity */}
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">กลุ่มบุคคล</label>
                            <select
                                value={field.definition.entity}
                                onChange={(e) => onFieldDefinitionChange({ entity: e.target.value as Entity })}
                                disabled={disabled}
                                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                            >
                                {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* AI suggestion details */}
                    {suggestion && (
                        <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-xs font-medium text-indigo-700">AI แนะนำ</span>
                                <span className="text-xs text-indigo-500">
                                    ({Math.round(suggestion.confidence * 100)}% confidence)
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="px-1.5 py-0.5 bg-white rounded text-gray-600">
                                    {suggestion.suggested_alias}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                    {suggestion.data_type}
                                </span>
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                    {suggestion.input_type}
                                </span>
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                    {ENTITY_LABELS[suggestion.entity as Entity] || suggestion.entity}
                                </span>
                            </div>
                            {suggestion.reasoning && (
                                <p className="text-xs text-indigo-600 mt-1">{suggestion.reasoning}</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function UnifiedFieldEditor({
    fieldDefinitions,
    aliases,
    dataTypes,
    inputTypes,
    onAliasChange,
    onFieldDefinitionChange,
    onSuggestFieldTypes,
    suggestingFieldTypes,
    disabled,
}: UnifiedFieldEditorProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [suggestions, setSuggestions] = useState<FieldTypeSuggestion[]>([]);

    // Group fields by saved group name OR by entity if no group is saved
    // IMPORTANT: Sort all fields by order first to maintain document order
    const sections = useMemo<SectionData[]>(() => {
        // First, convert to array and sort by order to maintain document order
        const sortedFields = Object.entries(fieldDefinitions)
            .filter(([, def]) => !def.group?.startsWith("merged_hidden_"))
            .map(([key, def]) => ({
                key,
                definition: def,
                order: def.order ?? 9999,
            }))
            .sort((a, b) => a.order - b.order); // Sort by document order first!

        const fieldsWithGroups = sortedFields.filter(f => f.definition.group && !f.definition.group.startsWith("merged_hidden_"));
        const hasSavedGroups = fieldsWithGroups.length > 0;

        if (hasSavedGroups) {
            const groupMap: Record<string, { fields: FieldItem[]; minOrder: number; colorIndex: number }> = {};

            sortedFields.forEach((field) => {
                const rawGroup = field.definition.group || "ทั่วไป";
                const [groupName, colorStr] = rawGroup.includes("|")
                    ? rawGroup.split("|")
                    : [rawGroup, "0"];
                const colorIndex = parseInt(colorStr, 10) || 0;

                if (!groupMap[groupName]) {
                    groupMap[groupName] = { fields: [], minOrder: field.order, colorIndex };
                }

                groupMap[groupName].fields.push(field);

                if (field.order < groupMap[groupName].minOrder) {
                    groupMap[groupName].minOrder = field.order;
                }
            });

            // Fields are already sorted, no need to sort again
            return Object.entries(groupMap)
                .sort(([, a], [, b]) => a.minOrder - b.minOrder)
                .map(([name, group]) => ({
                    name,
                    fields: group.fields,
                    colorIndex: group.colorIndex % SECTION_COLOR_PALETTE.length,
                }));
        } else {
            const entityGroups: Record<Entity, FieldItem[]> = {
                child: [],
                mother: [],
                father: [],
                informant: [],
                registrar: [],
                general: [],
            };

            // Fields are already sorted by order, so they'll be added in document order
            sortedFields.forEach((field) => {
                const entity = field.definition.entity && entityGroups[field.definition.entity]
                    ? field.definition.entity
                    : "general";
                entityGroups[entity].push(field);
            });

            // Sort entity groups by the minimum order of their fields (first-come-first-serve)
            return (Object.entries(entityGroups) as [Entity, FieldItem[]][])
                .filter(([, fields]) => fields.length > 0)
                .map(([entity, fields]) => ({
                    name: ENTITY_LABELS[entity],
                    fields,
                    colorIndex: ENTITY_COLOR_MAP[entity] % SECTION_COLOR_PALETTE.length,
                    minOrder: fields.length > 0 ? fields[0].order : 9999,
                }))
                .sort((a, b) => a.minOrder - b.minOrder)
                .map(({ minOrder, ...rest }) => rest);
        }
    }, [fieldDefinitions]);

    // Initialize all sections as expanded
    useState(() => {
        setExpandedSections(new Set(sections.map(s => s.name)));
    });

    const toggleSection = useCallback((sectionName: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionName)) {
                next.delete(sectionName);
            } else {
                next.add(sectionName);
            }
            return next;
        });
    }, []);

    const handleSuggestFieldTypes = async () => {
        if (!onSuggestFieldTypes) return;
        try {
            const result = await onSuggestFieldTypes();
            setSuggestions(result);
        } catch (err) {
            console.error("Failed to get suggestions:", err);
        }
    };

    const getSuggestionForField = (fieldKey: string) => {
        return suggestions.find(s =>
            s.placeholder === fieldKey ||
            s.placeholder === `{{${fieldKey}}}` ||
            s.placeholder.replace(/\{\{|\}\}/g, '') === fieldKey
        );
    };

    const handleApplySuggestion = (fieldKey: string, suggestion: FieldTypeSuggestion) => {
        // Apply alias
        if (suggestion.suggested_alias) {
            onAliasChange(fieldKey, suggestion.suggested_alias);
        }
        // Apply field definition changes
        onFieldDefinitionChange(fieldKey, {
            dataType: suggestion.data_type as DataType,
            inputType: suggestion.input_type as InputType,
            entity: suggestion.entity as Entity,
        });
        // Remove from suggestions
        setSuggestions((prev) => prev.filter((s) => s !== suggestion));
    };

    const handleApplyAllSuggestions = () => {
        suggestions.forEach((suggestion) => {
            const fieldKey = suggestion.placeholder.replace(/\{\{|\}\}/g, '');
            if (fieldDefinitions[fieldKey]) {
                if (suggestion.suggested_alias) {
                    onAliasChange(fieldKey, suggestion.suggested_alias);
                }
                onFieldDefinitionChange(fieldKey, {
                    dataType: suggestion.data_type as DataType,
                    inputType: suggestion.input_type as InputType,
                    entity: suggestion.entity as Entity,
                });
            }
        });
        setSuggestions([]);
    };

    const totalFields = sections.reduce((sum, section) => sum + section.fields.length, 0);

    return (
        <div className="space-y-4">
            {/* Header with AI button */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    {sections.length} ส่วน • {totalFields} ช่อง
                </p>
                {onSuggestFieldTypes && (
                    <button
                        onClick={handleSuggestFieldTypes}
                        disabled={suggestingFieldTypes || disabled}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:bg-indigo-50 disabled:text-indigo-400 rounded-lg border border-indigo-200 transition-colors"
                    >
                        {suggestingFieldTypes ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                กำลังวิเคราะห์...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                AI แนะนำ
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* AI Suggestions Summary */}
            {suggestions.length > 0 && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-medium text-indigo-800">
                                AI แนะนำ {suggestions.length} รายการ
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleApplyAllSuggestions}
                                className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                            >
                                ใช้ทั้งหมด
                            </button>
                            <button
                                onClick={() => setSuggestions([])}
                                className="p-1 text-indigo-400 hover:text-indigo-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-indigo-600">
                        ดูคำแนะนำในแต่ละช่องด้านล่าง หรือกดปุ่ม &quot;ใช้&quot; เพื่อใช้ทีละรายการ
                    </p>
                </div>
            )}

            {/* Sections */}
            <div className="space-y-3">
                {sections.map((section) => {
                    const color = SECTION_COLOR_PALETTE[section.colorIndex];
                    const isExpanded = expandedSections.has(section.name);

                    return (
                        <div
                            key={section.name}
                            className={`rounded-xl border-2 overflow-hidden transition-all ${color.border}`}
                        >
                            {/* Section Header */}
                            <button
                                onClick={() => toggleSection(section.name)}
                                className={`w-full flex items-center justify-between px-4 py-3 ${color.bg} hover:brightness-95 transition-colors`}
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                        <ChevronDown className={`w-4 h-4 ${color.text}`} />
                                    ) : (
                                        <ChevronRight className={`w-4 h-4 ${color.text}`} />
                                    )}
                                    <span className={`text-sm font-semibold ${color.text}`}>
                                        {section.name}
                                    </span>
                                </div>
                                <span className={`text-xs ${color.text} opacity-70`}>
                                    {section.fields.length} ช่อง
                                </span>
                            </button>

                            {/* Section Content */}
                            {isExpanded && (
                                <div className="bg-white">
                                    {section.fields.map((field) => {
                                        const suggestion = getSuggestionForField(field.key);
                                        return (
                                            <FieldRow
                                                key={field.key}
                                                field={field}
                                                alias={aliases[field.key] || ""}
                                                color={color}
                                                dataTypes={dataTypes}
                                                inputTypes={inputTypes}
                                                onAliasChange={(alias) => onAliasChange(field.key, alias)}
                                                onFieldDefinitionChange={(updates) => onFieldDefinitionChange(field.key, updates)}
                                                suggestion={suggestion}
                                                onApplySuggestion={suggestion ? () => handleApplySuggestion(field.key, suggestion) : undefined}
                                                disabled={disabled}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {sections.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                    ยังไม่มีช่องกรอกข้อมูล
                </div>
            )}
        </div>
    );
}

export default UnifiedFieldEditor;
