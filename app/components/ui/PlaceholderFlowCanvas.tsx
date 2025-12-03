"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    type NodeTypes,
    type Edge,
    type Node as FlowNode,
    BackgroundVariant,
    MarkerType,
    Handle,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
    X,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
    Play,
    Flag,
    Plus,
    GripVertical,
    Trash2,
    Edit3,
    Loader2,
    Wand2,
    FileText,
} from "lucide-react";
import type { FieldDefinition, DataType, Entity, ConfigurableDataType } from "@/lib/api/types";
import { ENTITY_LABELS } from "@/lib/utils/fieldTypes";
import { apiClient } from "@/lib/api/client";
import { EntityRulesToolbar } from "./EntityRulesToolbar";

// Dropdown Portal Component
function DropdownPortal({
    children,
    targetRef,
    isOpen,
    onClose,
}: {
    children: React.ReactNode;
    targetRef: React.RefObject<HTMLButtonElement | null>;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && targetRef.current) {
            const rect = targetRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                left: rect.right - 140,
            });
        }
    }, [isOpen, targetRef]);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (
                targetRef.current && !targetRef.current.contains(target) &&
                dropdownRef.current && !dropdownRef.current.contains(target)
            ) {
                onClose();
            }
        };

        // Close on scroll/zoom/pan (but not when scrolling inside dropdown)
        const handleWheel = (e: WheelEvent) => {
            if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
                return; // Allow scrolling inside dropdown
            }
            onClose();
        };

        const handleScroll = () => {
            onClose();
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("wheel", handleWheel, true);
        window.addEventListener("resize", handleScroll);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("wheel", handleWheel, true);
            window.removeEventListener("resize", handleScroll);
        };
    }, [isOpen, onClose, targetRef]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={dropdownRef}
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] min-w-[140px] max-h-[250px] overflow-y-auto"
            style={{ top: position.top, left: position.left }}
            onWheel={(e) => e.stopPropagation()}
        >
            {children}
        </div>,
        document.body
    );
}

// Types
interface FieldInfo {
    key: string;
    label: string;
    dataType: DataType;
    entity: Entity;
}

// Field Row Component with Portal Dropdown
function FieldRow({
    field,
    index,
    dragOverIndex,
    draggingField,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onDataTypeChange,
    onRemove,
    dataTypes,
}: {
    field: FieldInfo;
    index: number;
    dragOverIndex: number | null;
    draggingField: string | null;
    onDragStart: (e: React.DragEvent, fieldKey: string, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent, toIndex: number) => void;
    onDragEnd: () => void;
    onDataTypeChange: (fieldKey: string, dataType: string) => void;
    onRemove: (fieldKey: string) => void;
    dataTypes: ConfigurableDataType[];
}) {
    const [showDataTypeMenu, setShowDataTypeMenu] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Get label for current dataType from API data
    const getDataTypeLabel = (code: string) => {
        const dynamicType = dataTypes.find(dt => dt.code === code);
        return dynamicType?.name || code;
    };

    return (
        <div
            className={`nodrag relative ${dragOverIndex === index ? "border-t-2 border-blue-500" : ""}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move"; onDragOver(e, index); }}
            onDragLeave={onDragLeave}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(e, index); }}
        >
            <div
                draggable
                onDragStart={(e) => { e.stopPropagation(); onDragStart(e, field.key, index); }}
                onDragEnd={onDragEnd}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className={`nodrag flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-grab transition-colors group ${
                    draggingField === field.key ? "opacity-40" : ""
                }`}
            >
                <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="flex-1 text-xs text-gray-700 truncate">{field.label}</span>

                <button
                    ref={buttonRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowDataTypeMenu(!showDataTypeMenu);
                    }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                >
                    {getDataTypeLabel(field.dataType)}
                    <ChevronDown className="w-2.5 h-2.5" />
                </button>

                <DropdownPortal
                    targetRef={buttonRef}
                    isOpen={showDataTypeMenu}
                    onClose={() => setShowDataTypeMenu(false)}
                >
                    {dataTypes.length > 0 ? (
                        dataTypes.map((dt) => (
                            <button
                                key={dt.code}
                                onClick={() => {
                                    onDataTypeChange(field.key, dt.code);
                                    setShowDataTypeMenu(false);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${
                                    field.dataType === dt.code ? "bg-blue-50 text-blue-600" : "text-gray-600"
                                }`}
                            >
                                <span>{dt.name}</span>
                                {field.dataType === dt.code && <Check className="w-3 h-3" />}
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400">
                            กำลังโหลดประเภทข้อมูล...
                        </div>
                    )}
                </DropdownPortal>

                <button
                    onClick={() => onRemove(field.key)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all"
                >
                    <X className="w-3 h-3 text-gray-400" />
                </button>
            </div>
        </div>
    );
}

// Section colors
const SECTION_COLORS = [
    { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E" },
    { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF" },
    { bg: "#FCE7F3", border: "#EC4899", text: "#9D174D" },
    { bg: "#D1FAE5", border: "#10B981", text: "#065F46" },
    { bg: "#E0E7FF", border: "#6366F1", text: "#3730A3" },
    { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B" },
];

interface Section {
    id: string;
    name: string;
    fields: string[];
    colorIndex: number;
}

interface SectionNodeData {
    section: Section;
    sectionIndex: number;
    totalSections: number;
    fields: FieldInfo[];
    allFields: FieldInfo[];
    onAddField: (sectionId: string, fieldKey: string) => void;
    onRemoveField: (sectionId: string, fieldKey: string) => void;
    onRenameSection: (sectionId: string, name: string) => void;
    onDeleteSection: (sectionId: string) => void;
    onReorderField: (sectionId: string, fromIndex: number, toIndex: number) => void;
    onMoveFieldToSection: (fromSectionId: string, toSectionId: string, fieldKey: string, toIndex: number) => void;
    onDataTypeChange: (fieldKey: string, dataType: string) => void;
    onMoveSection: (sectionId: string, direction: "left" | "right") => void;
    dataTypes: ConfigurableDataType[];
}

// Section Node Component
function SectionNode({ data }: { data: SectionNodeData }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(data.section.name);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggingField, setDraggingField] = useState<string | null>(null);

    const color = SECTION_COLORS[data.section.colorIndex % SECTION_COLORS.length];

    const unassignedFields = data.allFields.filter(
        (f) => !data.section.fields.includes(f.key)
    );

    const handleSaveName = () => {
        if (editName.trim()) {
            data.onRenameSection(data.section.id, editName.trim());
        }
        setIsEditing(false);
    };

    const handleDragStart = (e: React.DragEvent, fieldKey: string, index: number) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", JSON.stringify({
            fieldKey,
            fromIndex: index,
            sectionId: data.section.id
        }));
        setDraggingField(fieldKey);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();

        try {
            const rawData = e.dataTransfer.getData("text/plain");
            if (!rawData) {
                setDragOverIndex(null);
                setDraggingField(null);
                return;
            }

            const { fieldKey, fromIndex, sectionId: fromSectionId } = JSON.parse(rawData);

            if (fromSectionId === data.section.id) {
                // Same section - reorder
                if (fromIndex !== toIndex) {
                    data.onReorderField(data.section.id, fromIndex, toIndex);
                }
            } else {
                // Different section - move field
                data.onMoveFieldToSection(fromSectionId, data.section.id, fieldKey, toIndex);
            }
        } catch (err) {
            console.error("Drop error:", err);
        }

        setDragOverIndex(null);
        setDraggingField(null);
    };

    return (
        <div
            className="bg-white rounded-2xl shadow-md border-2 min-w-[280px] max-w-[320px] overflow-hidden nopan"
            style={{ borderColor: color.border }}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="!w-4 !h-4 !-left-2 !border-2 !border-white"
                style={{ backgroundColor: color.border }}
            />

            {/* Header */}
            <div
                className="px-3 py-2.5 flex items-center gap-1"
                style={{ backgroundColor: color.bg }}
            >
                <button
                    onClick={() => data.onMoveSection(data.section.id, "left")}
                    disabled={data.sectionIndex === 0}
                    className={`p-1 rounded transition-colors ${
                        data.sectionIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/50"
                    }`}
                >
                    <ChevronLeft className="w-4 h-4" style={{ color: color.text }} />
                </button>

                {isEditing ? (
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                        className="flex-1 px-2 py-1 text-sm font-semibold rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        style={{ color: color.text }}
                        autoFocus
                    />
                ) : (
                    <span className="flex-1 text-sm font-semibold text-center" style={{ color: color.text }}>
                        {data.section.name}
                    </span>
                )}

                <button
                    onClick={() => data.onMoveSection(data.section.id, "right")}
                    disabled={data.sectionIndex === data.totalSections - 1}
                    className={`p-1 rounded transition-colors ${
                        data.sectionIndex === data.totalSections - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/50"
                    }`}
                >
                    <ChevronRight className="w-4 h-4" style={{ color: color.text }} />
                </button>

                <button onClick={() => setIsEditing(true)} className="p-1 rounded hover:bg-white/50 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" style={{ color: color.text }} />
                </button>
                <button onClick={() => data.onDeleteSection(data.section.id)} className="p-1 rounded hover:bg-white/50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: color.text }} />
                </button>
            </div>

            {/* Fields */}
            <div
                className="nodrag px-2 py-2 space-y-1"
                onWheel={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    // Only set drag over if not over a specific field
                    if (e.target === e.currentTarget) {
                        setDragOverIndex(data.fields.length);
                    }
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDrop(e, data.fields.length);
                }}
            >
                {data.fields.length === 0 ? (
                    <div
                        className={`text-center py-4 text-gray-400 text-xs border-2 border-dashed rounded-lg transition-colors ${
                            dragOverIndex !== null ? "border-blue-400 bg-blue-50" : "border-transparent"
                        }`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = "move";
                            setDragOverIndex(0);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDrop(e, 0);
                        }}
                    >
                        {dragOverIndex !== null ? "วางที่นี่" : "ยังไม่มีช่องกรอกข้อมูล"}
                    </div>
                ) : (
                    <>
                        {data.fields.map((field, index) => (
                            <FieldRow
                                key={field.key}
                                field={field}
                                index={index}
                                dragOverIndex={dragOverIndex}
                                draggingField={draggingField}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragLeave={() => setDragOverIndex(null)}
                                onDrop={handleDrop}
                                onDragEnd={() => { setDraggingField(null); setDragOverIndex(null); }}
                                onDataTypeChange={data.onDataTypeChange}
                                onRemove={(fieldKey) => data.onRemoveField(data.section.id, fieldKey)}
                                dataTypes={data.dataTypes}
                            />
                        ))}
                        {/* Drop zone at bottom */}
                        <div
                            className={`h-8 border-2 border-dashed rounded-lg transition-colors ${
                                dragOverIndex === data.fields.length ? "border-blue-400 bg-blue-50" : "border-transparent"
                            }`}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = "move";
                                setDragOverIndex(data.fields.length);
                            }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDrop(e, data.fields.length);
                            }}
                        />
                    </>
                )}
            </div>

            {/* Add Field */}
            <div className="px-2 pb-2 relative">
                <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-dashed border-gray-300"
                >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่มช่อง
                </button>

                {showAddMenu && unassignedFields.length > 0 && (
                    <div
                        className="absolute left-2 right-2 bottom-full mb-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[100] max-h-[200px] overflow-y-auto"
                        onWheel={(e) => e.stopPropagation()}
                    >
                        {unassignedFields.map((field) => (
                            <button
                                key={field.key}
                                onClick={() => { data.onAddField(data.section.id, field.key); setShowAddMenu(false); }}
                                className="w-full px-3 py-1.5 text-left text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-between"
                            >
                                <span className="truncate">{field.label}</span>
                                <span className="text-[10px] text-gray-400 ml-2">{ENTITY_LABELS[field.entity]}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-4 !-right-2 !border-2 !border-white"
                style={{ backgroundColor: color.border }}
            />
        </div>
    );
}

function StartNode() {
    return (
        <div className="bg-gray-900 text-white rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
            <Play className="w-5 h-5" fill="white" />
            <span className="text-sm font-medium">เริ่มต้น</span>
            <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-white !border-2 !border-gray-900" />
        </div>
    );
}

function EndNode() {
    return (
        <div className="bg-green-600 text-white rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
            <Handle type="target" position={Position.Left} className="!w-4 !h-4 !-left-2 !bg-white !border-2 !border-green-600" />
            <Flag className="w-5 h-5" />
            <span className="text-sm font-medium">เสร็จสิ้น</span>
            <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !bg-white !border-2 !border-green-600" />
        </div>
    );
}

// Preview Node Component
function PreviewNode({ data }: { data: { html: string; loading: boolean } }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const resizeIframe = () => {
            if (iframe.contentDocument?.body) {
                const contentHeight = iframe.contentDocument.documentElement.scrollHeight;
                iframe.style.height = `${contentHeight + 50}px`;
            }
        };

        const handleLoad = () => {
            resizeIframe();
        };

        iframe.addEventListener("load", handleLoad);
        return () => iframe.removeEventListener("load", handleLoad);
    }, []);

    // A4 size: 210mm x 297mm ≈ 794px x 1123px at 96dpi
    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden" style={{ width: 794 }}>
            <Handle
                type="target"
                position={Position.Left}
                className="!w-4 !h-4 !-left-2 !bg-gray-400 !border-2 !border-white"
            />

            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-700">ตัวอย่างเอกสาร (A4)</p>
            </div>

            {/* Preview Content - A4 size */}
            <div className="bg-gray-100 p-4 nodrag">
                {data.loading ? (
                    <div className="flex items-center justify-center" style={{ height: 1123 }}>
                        <div className="text-center">
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                            <p className="text-xs text-gray-500">กำลังโหลด...</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow-md" style={{ width: 762, minHeight: 1123 }}>
                        <iframe
                            ref={iframeRef}
                            srcDoc={data.html}
                            className="w-full border-0 block"
                            style={{ minHeight: 1123 }}
                            title="Preview"
                            sandbox="allow-same-origin"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

const nodeTypes: NodeTypes = {
    sectionNode: SectionNode,
    startNode: StartNode,
    endNode: EndNode,
    previewNode: PreviewNode,
};

// Entity colors for highlighting
const ENTITY_HIGHLIGHT_COLORS: Record<Entity, { bg: string; accent: string }> = {
    child: { bg: "#fce7f3", accent: "#db2777" },
    mother: { bg: "#f3e8ff", accent: "#9333ea" },
    father: { bg: "#dbeafe", accent: "#2563eb" },
    informant: { bg: "#fef3c7", accent: "#d97706" },
    registrar: { bg: "#dcfce7", accent: "#16a34a" },
    general: { bg: "#f3f4f6", accent: "#4b5563" },
};

interface PlaceholderFlowCanvasProps {
    templateId: string;
    fieldDefinitions: Record<string, FieldDefinition>;
    onFieldUpdate: (fieldKey: string, updates: Partial<FieldDefinition>) => void;
    aliases?: Record<string, string>;
    isOpen: boolean;
    onClose: () => void;
}

export function PlaceholderFlowCanvas({
    templateId,
    fieldDefinitions,
    onFieldUpdate,
    aliases,
    isOpen,
    onClose,
}: PlaceholderFlowCanvasProps) {
    const [sections, setSections] = useState<Section[]>([]);
    const [dataTypes, setDataTypes] = useState<ConfigurableDataType[]>([]);
    const [loadingDataTypes, setLoadingDataTypes] = useState(false);
    const [showRulesToolbar, setShowRulesToolbar] = useState(false);
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [loadingHtml, setLoadingHtml] = useState(false);

    // Fetch data types from API
    useEffect(() => {
        if (!isOpen) return;

        const fetchDataTypes = async () => {
            setLoadingDataTypes(true);
            try {
                const types = await apiClient.getConfigurableDataTypes(true);
                setDataTypes(types);
            } catch (error) {
                console.error("Failed to fetch data types:", error);
            } finally {
                setLoadingDataTypes(false);
            }
        };

        fetchDataTypes();
    }, [isOpen]);

    // Fetch HTML preview
    useEffect(() => {
        if (!isOpen || !templateId) return;

        const fetchHtml = async () => {
            setLoadingHtml(true);
            try {
                const html = await apiClient.getHTMLPreview(templateId);
                setHtmlContent(html || "");
            } catch (error) {
                console.error("Failed to fetch HTML preview:", error);
                setHtmlContent("<p style='padding: 20px; color: #666;'>ไม่สามารถโหลดตัวอย่างได้</p>");
            } finally {
                setLoadingHtml(false);
            }
        };

        fetchHtml();
    }, [isOpen, templateId]);

    // Create highlighted HTML
    const highlightedHtml = useMemo(() => {
        if (!htmlContent) return "";

        let html = htmlContent;

        // Highlight placeholders based on entity
        Object.entries(fieldDefinitions).forEach(([key, def]) => {
            const rawEntity = def.entity || "general";
            const entity = ENTITY_HIGHLIGHT_COLORS[rawEntity as Entity] ? (rawEntity as Entity) : "general";
            const color = ENTITY_HIGHLIGHT_COLORS[entity];

            const regex = new RegExp(`(\\{\\{${key}\\}\\})`, "gi");
            html = html.replace(
                regex,
                `<mark style="background-color: ${color.bg}; color: ${color.accent}; padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">${aliases?.[key] || key}</mark>`
            );
        });

        // Highlight any remaining placeholders that weren't in fieldDefinitions (fallback)
        const fallbackColor = ENTITY_HIGHLIGHT_COLORS.general;
        html = html.replace(
            /\{\{([^}]+)\}\}/g,
            `<mark style="background-color: ${fallbackColor.bg}; color: ${fallbackColor.accent}; padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">$1</mark>`
        );

        // Wrap HTML
        const styles = `
            <style>
                html, body { margin: 0; padding: 0; background: white; font-family: 'IBM Plex Sans Thai', sans-serif; }
                body { padding: 10mm; font-size: 12px; }
                mark { white-space: nowrap; }
            </style>
        `;

        if (html.includes("<!DOCTYPE") || html.includes("<html")) {
            return html.replace(/<head([^>]*)>/i, `<head$1>${styles}`);
        }

        return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${styles}</head><body>${html}</body></html>`;
    }, [htmlContent, fieldDefinitions, aliases]);

    const allFields = useMemo<FieldInfo[]>(() => {
        return Object.entries(fieldDefinitions)
            .filter(([, def]) => !def.group?.startsWith("merged_hidden_"))
            .map(([key, def]) => ({
                key,
                label: aliases?.[key] || key,
                dataType: def.dataType || "text",
                entity: def.entity || "general",
            }));
    }, [fieldDefinitions, aliases]);

    useEffect(() => {
        if (!isOpen || sections.length > 0) return;

        const entityGroups: Record<Entity, string[]> = {
            child: [], mother: [], father: [], informant: [], registrar: [], general: [],
        };

        allFields.forEach((field) => {
            const entity = field.entity && entityGroups[field.entity] ? field.entity : "general";
            entityGroups[entity].push(field.key);
        });

        const initialSections: Section[] = [];
        let colorIndex = 0;

        (Object.entries(entityGroups) as [Entity, string[]][]).forEach(([entity, fields]) => {
            if (fields.length > 0) {
                initialSections.push({ id: `section-${entity}`, name: ENTITY_LABELS[entity], fields, colorIndex: colorIndex++ });
            }
        });

        setSections(initialSections);
    }, [isOpen, allFields, sections.length]);

    const addSection = useCallback(() => {
        setSections((prev) => [...prev, { id: `section-${Date.now()}`, name: `ส่วนที่ ${prev.length + 1}`, fields: [], colorIndex: prev.length }]);
    }, []);

    const deleteSection = useCallback((sectionId: string) => {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
    }, []);

    const renameSection = useCallback((sectionId: string, name: string) => {
        setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, name } : s)));
    }, []);

    const addFieldToSection = useCallback((sectionId: string, fieldKey: string) => {
        setSections((prev) => {
            const updated = prev.map((s) => ({ ...s, fields: s.fields.filter((f) => f !== fieldKey) }));
            return updated.map((s) => s.id === sectionId ? { ...s, fields: [...s.fields, fieldKey] } : s);
        });
    }, []);

    const removeFieldFromSection = useCallback((sectionId: string, fieldKey: string) => {
        setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, fields: s.fields.filter((f) => f !== fieldKey) } : s));
    }, []);

    const reorderField = useCallback((sectionId: string, fromIndex: number, toIndex: number) => {
        setSections((prev) => prev.map((s) => {
            if (s.id !== sectionId) return s;
            const fields = [...s.fields];
            const [removed] = fields.splice(fromIndex, 1);
            fields.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, removed);
            return { ...s, fields };
        }));
    }, []);

    const moveFieldToSection = useCallback((fromSectionId: string, toSectionId: string, fieldKey: string, toIndex: number) => {
        setSections((prev) => {
            return prev.map((s) => {
                if (s.id === fromSectionId) {
                    // Remove from source section
                    return { ...s, fields: s.fields.filter((f) => f !== fieldKey) };
                }
                if (s.id === toSectionId) {
                    // Add to target section at specific index
                    const newFields = [...s.fields];
                    newFields.splice(toIndex, 0, fieldKey);
                    return { ...s, fields: newFields };
                }
                return s;
            });
        });
    }, []);

    const moveSection = useCallback((sectionId: string, direction: "left" | "right") => {
        setSections((prev) => {
            const index = prev.findIndex((s) => s.id === sectionId);
            if (index === -1) return prev;
            const newIndex = direction === "left" ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= prev.length) return prev;
            const newSections = [...prev];
            const [removed] = newSections.splice(index, 1);
            newSections.splice(newIndex, 0, removed);
            return newSections;
        });
    }, []);

    const handleDataTypeChange = useCallback((fieldKey: string, dataType: string) => {
        onFieldUpdate(fieldKey, { dataType: dataType as DataType });
    }, [onFieldUpdate]);

    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    useEffect(() => {
        const nodeWidth = 300;
        const nodeGap = 150;
        const startX = 100;
        const startY = 100;

        const newNodes: FlowNode[] = [];
        const newEdges: Edge[] = [];

        newNodes.push({ id: "start", type: "startNode", position: { x: startX, y: startY + 100 }, data: {}, draggable: false });

        sections.forEach((section, index) => {
            const sectionFields = section.fields.map((key) => allFields.find((f) => f.key === key)).filter(Boolean) as FieldInfo[];

            newNodes.push({
                id: section.id,
                type: "sectionNode",
                position: { x: startX + 200 + index * (nodeWidth + nodeGap), y: startY },
                data: {
                    section, sectionIndex: index, totalSections: sections.length, fields: sectionFields, allFields,
                    onAddField: addFieldToSection, onRemoveField: removeFieldFromSection, onRenameSection: renameSection,
                    onDeleteSection: deleteSection, onReorderField: reorderField, onMoveFieldToSection: moveFieldToSection,
                    onDataTypeChange: handleDataTypeChange, onMoveSection: moveSection, dataTypes,
                },
                draggable: true,
            });
        });

        const endX = startX + 200 + sections.length * (nodeWidth + nodeGap);
        newNodes.push({ id: "end", type: "endNode", position: { x: endX, y: startY + 100 }, data: {}, draggable: false });

        // Add preview node on the right
        const previewX = endX + 200;
        newNodes.push({
            id: "preview",
            type: "previewNode",
            position: { x: previewX, y: startY - 50 },
            data: { html: highlightedHtml, loading: loadingHtml },
            draggable: true,
        });

        if (sections.length > 0) {
            newEdges.push({ id: "start-to-first", source: "start", target: sections[0].id, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" }, style: { stroke: "#94A3B8", strokeWidth: 2 } });
            for (let i = 0; i < sections.length - 1; i++) {
                newEdges.push({ id: `edge-${i}`, source: sections[i].id, target: sections[i + 1].id, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" }, style: { stroke: "#94A3B8", strokeWidth: 2 } });
            }
            newEdges.push({ id: "last-to-end", source: sections[sections.length - 1].id, target: "end", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" }, style: { stroke: "#94A3B8", strokeWidth: 2 } });
        } else {
            newEdges.push({ id: "start-to-end", source: "start", target: "end", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" }, style: { stroke: "#94A3B8", strokeWidth: 2 } });
        }

        // Connect end to preview
        newEdges.push({ id: "end-to-preview", source: "end", target: "preview", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e" }, style: { stroke: "#22c55e", strokeWidth: 2 } });

        setNodes(newNodes);
        setEdges(newEdges);
    }, [sections, allFields, addFieldToSection, removeFieldFromSection, renameSection, deleteSection, reorderField, moveFieldToSection, handleDataTypeChange, moveSection, setNodes, setEdges, dataTypes, highlightedHtml, loadingHtml]);

    const assignedFieldKeys = sections.flatMap((s) => s.fields);
    const unassignedCount = allFields.filter((f) => !assignedFieldKeys.includes(f.key)).length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-gray-50">
            <div className="absolute top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50">
                <div>
                    <h2 className="font-semibold text-gray-900">Form Flow Editor</h2>
                    <p className="text-xs text-gray-500">สร้างส่วนและจัดกลุ่มช่องกรอกข้อมูล • ลากส่วนเพื่อเรียงลำดับ</p>
                </div>
                <div className="flex items-center gap-3">
                    {loadingDataTypes && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            กำลังโหลด...
                        </span>
                    )}
                    {unassignedCount > 0 && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{unassignedCount} ช่องยังไม่ได้จัดกลุ่ม</span>
                    )}
                    <button
                        onClick={() => setShowRulesToolbar(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
                    >
                        <Wand2 className="w-4 h-4" />
                        กฎจัดกลุ่ม
                    </button>
                    <button onClick={addSection} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        <Plus className="w-4 h-4" />
                        เพิ่มส่วน
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            <div className="absolute inset-0 top-14">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.3}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#E2E8F0" />
                    <Controls showInteractive={false} className="!bg-white !border !border-gray-200 !rounded-lg !shadow-sm" />
                </ReactFlow>
            </div>

            {/* Entity Rules Toolbar */}
            <EntityRulesToolbar
                fieldDefinitions={fieldDefinitions}
                sections={sections}
                onMoveFieldToSection={(fieldKey: string, sectionId: string) => {
                    // Remove field from all sections first, then add to target
                    setSections((prev) => {
                        const updated = prev.map((s) => ({
                            ...s,
                            fields: s.fields.filter((f) => f !== fieldKey),
                        }));
                        return updated.map((s) =>
                            s.id === sectionId
                                ? { ...s, fields: [...s.fields, fieldKey] }
                                : s
                        );
                    });
                }}
                isOpen={showRulesToolbar}
                onClose={() => setShowRulesToolbar(false)}
            />
        </div>
    );
}

export default PlaceholderFlowCanvas;
