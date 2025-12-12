"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    Settings,
    Database,
    Users,
    ArrowRight,
    GripVertical,
    ChevronDown,
    ChevronRight,
    Zap,
    FileText,
    Check,
} from "lucide-react";
import type { FieldDefinition, DataType, Entity } from "@/lib/api/types";
import { DATA_TYPE_LABELS, ENTITY_LABELS } from "@/lib/utils/fieldTypes";

// Node types for the flow
type NodeType = "trigger" | "placeholder" | "datatype" | "entity" | "output";

interface FlowNode {
    id: string;
    type: NodeType;
    label: string;
    placeholder?: string;
    dataType?: DataType;
    entity?: Entity;
    x: number;
    y: number;
    selected?: boolean;
}


// Entity colors
const ENTITY_COLORS: Record<Entity, { bg: string; border: string; text: string }> = {
    child: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700" },
    mother: { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-700" },
    father: { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-700" },
    informant: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700" },
    registrar: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700" },
    general: { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-700" },
};

// DataType colors
const DATATYPE_COLORS: Record<string, { bg: string; icon: string }> = {
    text: { bg: "bg-gray-100", icon: "📝" },
    id_number: { bg: "bg-purple-100", icon: "🆔" },
    date: { bg: "bg-blue-100", icon: "📅" },
    time: { bg: "bg-cyan-100", icon: "⏰" },
    number: { bg: "bg-green-100", icon: "🔢" },
    address: { bg: "bg-orange-100", icon: "📍" },
    province: { bg: "bg-teal-100", icon: "🗺️" },
    country: { bg: "bg-red-100", icon: "🌍" },
    name_prefix: { bg: "bg-yellow-100", icon: "👤" },
    name: { bg: "bg-lime-100", icon: "✍️" },
    weekday: { bg: "bg-violet-100", icon: "📆" },
    phone: { bg: "bg-emerald-100", icon: "📱" },
    email: { bg: "bg-sky-100", icon: "✉️" },
    house_code: { bg: "bg-stone-100", icon: "🏠" },
    zodiac: { bg: "bg-rose-100", icon: "🐉" },
    lunar_month: { bg: "bg-fuchsia-100", icon: "🌙" },
};

interface PlaceholderFlowMapperProps {
    fieldDefinitions: Record<string, FieldDefinition>;
    onFieldUpdate: (fieldKey: string, updates: Partial<FieldDefinition>) => void;
    aliases?: Record<string, string>;
}

// Individual Flow Node Component
function FlowNodeComponent({
    node,
    definition,
    alias,
    onDataTypeChange,
    onEntityChange,
    isExpanded,
    onToggleExpand,
}: {
    node: FlowNode;
    definition?: FieldDefinition;
    alias?: string;
    onDataTypeChange: (dataType: DataType) => void;
    onEntityChange: (entity: Entity) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}) {
    const [showDataTypeMenu, setShowDataTypeMenu] = useState(false);
    const [showEntityMenu, setShowEntityMenu] = useState(false);
    const dataTypeRef = useRef<HTMLDivElement>(null);
    const entityRef = useRef<HTMLDivElement>(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dataTypeRef.current && !dataTypeRef.current.contains(e.target as Node)) {
                setShowDataTypeMenu(false);
            }
            if (entityRef.current && !entityRef.current.contains(e.target as Node)) {
                setShowEntityMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const entityColor = definition?.entity ? ENTITY_COLORS[definition.entity] : ENTITY_COLORS.general;
    const dataTypeInfo = definition?.dataType ? DATATYPE_COLORS[definition.dataType] || DATATYPE_COLORS.text : DATATYPE_COLORS.text;

    return (
        <div className="flex items-stretch gap-0">
            {/* Left connector */}
            <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white shadow-sm" />
                <div className="w-8 h-0.5 bg-gradient-to-r from-gray-300 to-gray-200" />
            </div>

            {/* Main Placeholder Node */}
            <div
                className={`
                    flex-1 border-2 rounded-xl shadow-md transition-all duration-200
                    ${entityColor.bg} ${entityColor.border}
                    hover:shadow-lg hover:scale-[1.02]
                `}
            >
                {/* Node Header */}
                <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={onToggleExpand}
                >
                    <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${dataTypeInfo.bg}`}>
                            {dataTypeInfo.icon}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className={`font-medium ${entityColor.text} truncate`}>
                                {alias || node.label}
                            </span>
                            {alias && (
                                <span className="text-xs text-gray-400 font-mono truncate">
                                    ({node.label})
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* DataType Badge */}
                        <div ref={dataTypeRef} className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDataTypeMenu(!showDataTypeMenu);
                                }}
                                className={`
                                    px-2.5 py-1 rounded-lg text-xs font-medium
                                    ${dataTypeInfo.bg} hover:opacity-80
                                    flex items-center gap-1 transition-colors
                                `}
                            >
                                <Database className="w-3 h-3" />
                                {DATA_TYPE_LABELS[definition?.dataType || "text"]}
                                <ChevronDown className="w-3 h-3" />
                            </button>

                            {showDataTypeMenu && (
                                <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[180px] max-h-64 overflow-y-auto">
                                    {Object.entries(DATA_TYPE_LABELS).map(([value, label]) => (
                                        <button
                                            key={value}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDataTypeChange(value as DataType);
                                                setShowDataTypeMenu(false);
                                            }}
                                            className={`
                                                w-full px-3 py-2 text-left text-sm flex items-center gap-2
                                                hover:bg-gray-50 transition-colors
                                                ${definition?.dataType === value ? "bg-primary/10 text-primary" : ""}
                                            `}
                                        >
                                            <span>{DATATYPE_COLORS[value]?.icon || "📝"}</span>
                                            <span>{label}</span>
                                            {definition?.dataType === value && (
                                                <Check className="w-4 h-4 ml-auto text-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Entity Badge */}
                        <div ref={entityRef} className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEntityMenu(!showEntityMenu);
                                }}
                                className={`
                                    px-2.5 py-1 rounded-lg text-xs font-medium
                                    ${entityColor.bg} ${entityColor.text}
                                    border ${entityColor.border}
                                    flex items-center gap-1 hover:opacity-80 transition-colors
                                `}
                            >
                                <Users className="w-3 h-3" />
                                {ENTITY_LABELS[definition?.entity || "general"]}
                                <ChevronDown className="w-3 h-3" />
                            </button>

                            {showEntityMenu && (
                                <div className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[150px]">
                                    {(Object.keys(ENTITY_LABELS) as Entity[]).map((entity) => (
                                        <button
                                            key={entity}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEntityChange(entity);
                                                setShowEntityMenu(false);
                                            }}
                                            className={`
                                                w-full px-3 py-2 text-left text-sm flex items-center gap-2
                                                hover:bg-gray-50 transition-colors
                                                ${definition?.entity === entity ? "bg-primary/10 text-primary" : ""}
                                            `}
                                        >
                                            <div className={`w-3 h-3 rounded-full ${ENTITY_COLORS[entity].bg} ${ENTITY_COLORS[entity].border} border`} />
                                            <span>{ENTITY_LABELS[entity]}</span>
                                            {definition?.entity === entity && (
                                                <Check className="w-4 h-4 ml-auto text-primary" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Expand/Collapse */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand();
                            }}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="border-t border-gray-200/50 p-3 space-y-2 bg-white/30">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-500">
                                <Settings className="w-3 h-3" />
                                <span>Input:</span>
                                <span className="font-medium text-gray-700">{definition?.inputType || "text"}</span>
                            </div>
                            {definition?.validation && (
                                <div className="flex items-center gap-1.5 text-gray-500">
                                    <Zap className="w-3 h-3" />
                                    <span>Validation:</span>
                                    <span className="font-medium text-gray-700">
                                        {definition.validation.required ? "Required" : "Optional"}
                                    </span>
                                </div>
                            )}
                        </div>
                        {definition?.description && (
                            <p className="text-xs text-gray-500 italic">
                                {definition.description}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Right connector - Output */}
            <div className="flex items-center">
                <div className="w-8 h-0.5 bg-gradient-to-r from-gray-200 to-green-300" />
                <div className="w-3 h-3 rounded-full bg-green-400 border-2 border-white shadow-sm flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                </div>
            </div>
        </div>
    );
}

// Entity Group Component
function EntityGroup({
    entity,
    fields,
    aliases,
    onFieldUpdate,
    expandedFields,
    onToggleField,
}: {
    entity: Entity;
    fields: Array<{ key: string; definition: FieldDefinition }>;
    aliases?: Record<string, string>;
    onFieldUpdate: (fieldKey: string, updates: Partial<FieldDefinition>) => void;
    expandedFields: Set<string>;
    onToggleField: (key: string) => void;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const entityColor = ENTITY_COLORS[entity];

    return (
        <div className={`rounded-2xl border-2 ${entityColor.border} overflow-hidden`}>
            {/* Group Header */}
            <div
                className={`
                    flex items-center justify-between px-4 py-3 cursor-pointer
                    ${entityColor.bg} border-b ${entityColor.border}
                `}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entityColor.bg} border ${entityColor.border}`}>
                        <Users className={`w-5 h-5 ${entityColor.text}`} />
                    </div>
                    <div>
                        <h3 className={`font-semibold ${entityColor.text}`}>
                            {ENTITY_LABELS[entity]}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {fields.length} {fields.length === 1 ? "field" : "fields"}
                        </p>
                    </div>
                </div>
                <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                </button>
            </div>

            {/* Fields */}
            {!isCollapsed && (
                <div className="p-4 space-y-3 bg-white/50">
                    {fields.map(({ key, definition }) => (
                        <FlowNodeComponent
                            key={key}
                            node={{
                                id: key,
                                type: "placeholder",
                                label: key,
                                placeholder: definition.placeholder,
                                dataType: definition.dataType,
                                entity: definition.entity,
                                x: 0,
                                y: 0,
                            }}
                            definition={definition}
                            alias={aliases?.[key]}
                            onDataTypeChange={(dataType) => onFieldUpdate(key, { dataType })}
                            onEntityChange={(entity) => onFieldUpdate(key, { entity })}
                            isExpanded={expandedFields.has(key)}
                            onToggleExpand={() => onToggleField(key)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function PlaceholderFlowMapper({
    fieldDefinitions,
    onFieldUpdate,
    aliases,
}: PlaceholderFlowMapperProps) {
    const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"flow" | "list">("flow");

    const toggleField = useCallback((key: string) => {
        setExpandedFields((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    // Group fields by entity
    const fieldsByEntity = Object.entries(fieldDefinitions).reduce<Record<Entity, Array<{ key: string; definition: FieldDefinition }>>>(
        (acc, [key, definition]) => {
            // Skip hidden merged fields
            if (definition.group?.startsWith("merged_hidden_")) {
                return acc;
            }
            const entity = definition.entity || "general";
            if (!acc[entity]) {
                acc[entity] = [];
            }
            acc[entity].push({ key, definition });
            return acc;
        },
        {
            child: [],
            mother: [],
            father: [],
            informant: [],
            registrar: [],
            general: [],
        }
    );

    // Get entity order
    const entityOrder: Entity[] = ["child", "mother", "father", "informant", "registrar", "general"];

    const totalFields = Object.values(fieldsByEntity).reduce((sum, fields) => sum + fields.length, 0);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">
                            Placeholder Flow Mapper
                        </h3>
                        <p className="text-sm text-text-muted">
                            {totalFields} placeholders • {entityOrder.filter(e => fieldsByEntity[e].length > 0).length} entities
                        </p>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode("flow")}
                        className={`
                            px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                            ${viewMode === "flow" ? "bg-white shadow text-primary" : "text-gray-500 hover:text-gray-700"}
                        `}
                    >
                        Flow
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`
                            px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                            ${viewMode === "list" ? "bg-white shadow text-primary" : "text-gray-500 hover:text-gray-700"}
                        `}
                    >
                        List
                    </button>
                </div>
            </div>

            {/* Flow Diagram Header */}
            {viewMode === "flow" && (
                <div className="flex items-center justify-center gap-4 py-3 px-4 bg-gradient-to-r from-blue-50 via-white to-green-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>Template</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Database className="w-4 h-4 text-purple-600" />
                        </div>
                        <span>Placeholders</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Settings className="w-4 h-4 text-amber-600" />
                        </div>
                        <span>Data Types</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span>Output</span>
                    </div>
                </div>
            )}

            {/* Entity Groups */}
            <div className="space-y-4">
                {entityOrder.map((entity) => {
                    const fields = fieldsByEntity[entity];
                    if (fields.length === 0) return null;

                    return (
                        <EntityGroup
                            key={entity}
                            entity={entity}
                            fields={fields}
                            aliases={aliases}
                            onFieldUpdate={onFieldUpdate}
                            expandedFields={expandedFields}
                            onToggleField={toggleField}
                        />
                    );
                })}
            </div>

            {/* Empty State */}
            {totalFields === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No placeholders found</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Upload a template to start mapping placeholders
                    </p>
                </div>
            )}

            {/* Legend */}
            {totalFields > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500 font-medium">Entities:</span>
                    {entityOrder.map((entity) => {
                        const color = ENTITY_COLORS[entity];
                        if (fieldsByEntity[entity].length === 0) return null;
                        return (
                            <div key={entity} className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded-full ${color.bg} ${color.border} border`} />
                                <span className="text-xs text-gray-600">{ENTITY_LABELS[entity]}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PlaceholderFlowMapper;
