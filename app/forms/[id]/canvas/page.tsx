"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import {
    ReactFlow,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    BackgroundVariant,
    type Edge,
    type Node as FlowNode,
    type NodeTypes,
    MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createPortal } from "react-dom";
import {
    ArrowLeft,
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
    X,
    Save,
    CheckCircle,
    Palette,
} from "lucide-react";
import type { DataType, ConfigurableDataType, Entity } from "@/lib/api/types";
import { ENTITY_LABELS } from "@/lib/utils/fieldTypes";
// Section type is imported from context
import { EntityRulesToolbar } from "@/app/components/ui/EntityRulesToolbar";
import { useTemplate, type Section } from "../TemplateContext";


// Section colors - user selectable
export const SECTION_COLORS = [
    { bg: "#FEF3C7", border: "#F59E0B", text: "#92400E", name: "เหลือง" },
    { bg: "#DBEAFE", border: "#3B82F6", text: "#1E40AF", name: "น้ำเงิน" },
    { bg: "#FCE7F3", border: "#EC4899", text: "#9D174D", name: "ชมพู" },
    { bg: "#D1FAE5", border: "#10B981", text: "#065F46", name: "เขียว" },
    { bg: "#E0E7FF", border: "#6366F1", text: "#3730A3", name: "ม่วง" },
    { bg: "#FEE2E2", border: "#EF4444", text: "#991B1B", name: "แดง" },
    { bg: "#F3F4F6", border: "#6B7280", text: "#374151", name: "เทา" },
    { bg: "#CFFAFE", border: "#06B6D4", text: "#155E75", name: "ฟ้า" },
];

interface FieldInfo {
    key: string;
    label: string;
    dataType: DataType;
    entity: Entity;
}

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
            setPosition({ top: rect.bottom + 4, left: rect.right - 140 });
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
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose, targetRef]);

    if (!isOpen) return null;

    return createPortal(
        <div
            ref={dropdownRef}
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] min-w-[140px] max-h-[250px] overflow-y-auto"
            style={{ top: position.top, left: position.left }}
        >
            {children}
        </div>,
        document.body
    );
}

// Field Row Component
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

    const getDataTypeLabel = (code: string) => {
        const dynamicType = dataTypes.find(dt => dt.code === code);
        return dynamicType?.name || code;
    };

    return (
        <div
            className={`nodrag relative ${dragOverIndex === index ? "border-t-2 border-blue-500" : ""}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(e, index); }}
            onDragLeave={onDragLeave}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(e, index); }}
        >
            <div
                draggable
                onDragStart={(e) => { e.stopPropagation(); onDragStart(e, field.key, index); }}
                onDragEnd={onDragEnd}
                className={`nodrag flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-grab transition-colors group ${draggingField === field.key ? "opacity-40" : ""}`}
            >
                <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="flex-1 text-xs text-gray-700 truncate">{field.label}</span>
                <button
                    ref={buttonRef}
                    onClick={(e) => { e.stopPropagation(); setShowDataTypeMenu(!showDataTypeMenu); }}
                    className="text-[10px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                >
                    {getDataTypeLabel(field.dataType)}
                    <ChevronDown className="w-2.5 h-2.5" />
                </button>
                <DropdownPortal targetRef={buttonRef} isOpen={showDataTypeMenu} onClose={() => setShowDataTypeMenu(false)}>
                    {dataTypes.map((dt) => (
                        <button
                            key={dt.code}
                            onClick={() => { onDataTypeChange(field.key, dt.code); setShowDataTypeMenu(false); }}
                            className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${field.dataType === dt.code ? "bg-blue-50 text-blue-600" : "text-gray-600"}`}
                        >
                            <span>{dt.name}</span>
                            {field.dataType === dt.code && <Check className="w-3 h-3" />}
                        </button>
                    ))}
                </DropdownPortal>
                <button onClick={() => onRemove(field.key)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200">
                    <X className="w-3 h-3 text-gray-400" />
                </button>
            </div>
        </div>
    );
}

// Section Node Data
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
    onColorChange: (sectionId: string, colorIndex: number) => void;
    dataTypes: ConfigurableDataType[];
}

// Section Node Component
function SectionNode({ data }: { data: SectionNodeData }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(data.section.name);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [draggingField, setDraggingField] = useState<string | null>(null);

    const color = SECTION_COLORS[data.section.colorIndex % SECTION_COLORS.length];
    const unassignedFields = data.allFields.filter((f) => !data.section.fields.includes(f.key));

    const handleSaveName = () => {
        if (editName.trim()) data.onRenameSection(data.section.id, editName.trim());
        setIsEditing(false);
    };

    const handleDragStart = (e: React.DragEvent, fieldKey: string, index: number) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ fieldKey, fromIndex: index, sectionId: data.section.id }));
        setDraggingField(fieldKey);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        try {
            const { fieldKey, fromIndex, sectionId: fromSectionId } = JSON.parse(e.dataTransfer.getData("text/plain"));
            if (fromSectionId === data.section.id) {
                if (fromIndex !== toIndex) data.onReorderField(data.section.id, fromIndex, toIndex);
            } else {
                data.onMoveFieldToSection(fromSectionId, data.section.id, fieldKey, toIndex);
            }
        } catch (err) { console.error("Drop error:", err); }
        setDragOverIndex(null);
        setDraggingField(null);
    };

    return (
        <div className="bg-white rounded-2xl shadow-md border-2 min-w-[280px] max-w-[320px] overflow-hidden" style={{ borderColor: color.border }}>
            <Handle type="target" position={Position.Left} className="!w-4 !h-4 !-left-2 !border-2 !border-white" style={{ backgroundColor: color.border }} />

            {/* Header */}
            <div className="px-3 py-2.5 flex items-center gap-1" style={{ backgroundColor: color.bg }}>
                <button onClick={() => data.onMoveSection(data.section.id, "left")} disabled={data.sectionIndex === 0} className={`p-1 rounded ${data.sectionIndex === 0 ? "opacity-30" : "hover:bg-white/50"}`}>
                    <ChevronLeft className="w-4 h-4" style={{ color: color.text }} />
                </button>
                {isEditing ? (
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === "Enter" && handleSaveName()} className="flex-1 px-2 py-1 text-sm font-semibold rounded border" autoFocus />
                ) : (
                    <span className="flex-1 text-sm font-semibold text-center" style={{ color: color.text }}>{data.section.name}</span>
                )}
                <button onClick={() => data.onMoveSection(data.section.id, "right")} disabled={data.sectionIndex === data.totalSections - 1} className={`p-1 rounded ${data.sectionIndex === data.totalSections - 1 ? "opacity-30" : "hover:bg-white/50"}`}>
                    <ChevronRight className="w-4 h-4" style={{ color: color.text }} />
                </button>
                <div className="relative">
                    <button onClick={() => setShowColorPicker(!showColorPicker)} className="p-1 rounded hover:bg-white/50">
                        <Palette className="w-3.5 h-3.5" style={{ color: color.text }} />
                    </button>
                    {showColorPicker && (
                        <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border p-2 z-[100] grid grid-cols-4 gap-1 min-w-[120px]">
                            {SECTION_COLORS.map((c, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { data.onColorChange(data.section.id, idx); setShowColorPicker(false); }}
                                    className={`w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 ${data.section.colorIndex === idx ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                                    style={{ backgroundColor: c.bg, borderColor: c.border }}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    )}
                </div>
                <button onClick={() => setIsEditing(true)} className="p-1 rounded hover:bg-white/50"><Edit3 className="w-3.5 h-3.5" style={{ color: color.text }} /></button>
                <button onClick={() => data.onDeleteSection(data.section.id)} className="p-1 rounded hover:bg-white/50"><Trash2 className="w-3.5 h-3.5" style={{ color: color.text }} /></button>
            </div>

            {/* Fields */}
            <div className="nodrag px-2 py-2 space-y-1">
                {data.fields.length === 0 ? (
                    <div className={`text-center py-4 text-gray-400 text-xs border-2 border-dashed rounded-lg ${dragOverIndex !== null ? "border-blue-400 bg-blue-50" : "border-transparent"}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOverIndex(0); }}
                        onDrop={(e) => { e.preventDefault(); handleDrop(e, 0); }}
                    >
                        {dragOverIndex !== null ? "วางที่นี่" : "ยังไม่มีช่องกรอกข้อมูล"}
                    </div>
                ) : (
                    <>
                        {data.fields.map((field, index) => (
                            <FieldRow key={field.key} field={field} index={index} dragOverIndex={dragOverIndex} draggingField={draggingField}
                                onDragStart={handleDragStart} onDragOver={(_, i) => setDragOverIndex(i)} onDragLeave={() => setDragOverIndex(null)}
                                onDrop={handleDrop} onDragEnd={() => { setDraggingField(null); setDragOverIndex(null); }}
                                onDataTypeChange={data.onDataTypeChange} onRemove={(key) => data.onRemoveField(data.section.id, key)} dataTypes={data.dataTypes}
                            />
                        ))}
                    </>
                )}
            </div>

            {/* Add Field */}
            <div className="px-2 pb-2 relative">
                <button onClick={() => setShowAddMenu(!showAddMenu)} className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Plus className="w-3.5 h-3.5" />เพิ่มช่อง
                </button>
                {showAddMenu && unassignedFields.length > 0 && (
                    <div className="absolute left-2 right-2 bottom-full mb-1 bg-white rounded-lg shadow-xl border py-1 z-[100] max-h-[200px] overflow-y-auto">
                        {unassignedFields.map((field) => (
                            <button key={field.key} onClick={() => { data.onAddField(data.section.id, field.key); setShowAddMenu(false); }}
                                className="w-full px-3 py-1.5 text-left text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-between">
                                <span className="truncate">{field.label}</span>
                                <span className="text-[10px] text-gray-400 ml-2">{ENTITY_LABELS[field.entity]}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Right} className="!w-4 !h-4 !-right-2 !border-2 !border-white" style={{ backgroundColor: color.border }} />
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
        const handleLoad = () => {
            if (iframe.contentDocument?.body) {
                const contentHeight = iframe.contentDocument.documentElement.scrollHeight;
                iframe.style.height = `${contentHeight + 50}px`;
            }
        };
        iframe.addEventListener("load", handleLoad);
        return () => iframe.removeEventListener("load", handleLoad);
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden" style={{ width: 794 }}>
            <Handle type="target" position={Position.Left} className="!w-4 !h-4 !-left-2 !bg-gray-400 !border-2 !border-white" />
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-semibold text-gray-700">ตัวอย่างเอกสาร (A4)</p>
            </div>
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
                        <iframe ref={iframeRef} srcDoc={data.html} className="w-full border-0 block" style={{ minHeight: 1123 }} title="Preview" sandbox="allow-same-origin" />
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

export default function CanvasPage() {
    const router = useRouter();
    const {
        template,
        fieldDefinitions,
        aliases,
        dataTypes,
        htmlContent,
        sections,
        loading,
        error,
        setFieldDefinitions,
        setSections,
    } = useTemplate();

    const [showRulesToolbar, setShowRulesToolbar] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const allFields = useMemo<FieldInfo[]>(() => {
        if (!fieldDefinitions) return [];
        return Object.entries(fieldDefinitions)
            .filter(([, def]) => !def.group?.startsWith("merged_hidden_"))
            .map(([key, def]) => ({
                key,
                label: aliases?.[key] || key,
                dataType: def.dataType || "text",
                entity: def.entity || "general",
            }));
    }, [fieldDefinitions, aliases]);

    // Section handlers
    const addSection = useCallback(() => {
        setSections((prev) => [...prev, { id: `section-${Date.now()}`, name: `ส่วนที่ ${prev.length + 1}`, fields: [], colorIndex: prev.length }]);
    }, [setSections]);

    const deleteSection = useCallback((sectionId: string) => {
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
    }, [setSections]);

    const renameSection = useCallback((sectionId: string, name: string) => {
        setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, name } : s)));
    }, [setSections]);

    const addFieldToSection = useCallback((sectionId: string, fieldKey: string) => {
        setSections((prev) => {
            const updated = prev.map((s) => ({ ...s, fields: s.fields.filter((f) => f !== fieldKey) }));
            return updated.map((s) => s.id === sectionId ? { ...s, fields: [...s.fields, fieldKey] } : s);
        });
    }, [setSections]);

    const removeFieldFromSection = useCallback((sectionId: string, fieldKey: string) => {
        setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, fields: s.fields.filter((f) => f !== fieldKey) } : s));
    }, [setSections]);

    const reorderField = useCallback((sectionId: string, fromIndex: number, toIndex: number) => {
        setSections((prev) => prev.map((s) => {
            if (s.id !== sectionId) return s;
            const fields = [...s.fields];
            const [removed] = fields.splice(fromIndex, 1);
            fields.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, removed);
            return { ...s, fields };
        }));
    }, [setSections]);

    const moveFieldToSection = useCallback((fromSectionId: string, toSectionId: string, fieldKey: string, toIndex: number) => {
        setSections((prev) => prev.map((s) => {
            if (s.id === fromSectionId) return { ...s, fields: s.fields.filter((f) => f !== fieldKey) };
            if (s.id === toSectionId) {
                const newFields = [...s.fields];
                newFields.splice(toIndex, 0, fieldKey);
                return { ...s, fields: newFields };
            }
            return s;
        }));
    }, [setSections]);

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
    }, [setSections]);

    const changeSectionColor = useCallback((sectionId: string, colorIndex: number) => {
        setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, colorIndex } : s));
    }, [setSections]);

    const handleDataTypeChange = useCallback((fieldKey: string, dataType: string) => {
        setFieldDefinitions((prev) => {
            if (!prev) return prev;
            return { ...prev, [fieldKey]: { ...prev[fieldKey], dataType: dataType as DataType } };
        });
    }, [setFieldDefinitions]);

    // Save sections to database
    const handleSave = useCallback(async () => {
        if (!template || !fieldDefinitions) return;

        setSaving(true);
        setSaveSuccess(false);

        try {
            // Build updated field definitions with order and group based on sections
            // Group format: "sectionName|colorIndex" to preserve color choice
            const updatedDefinitions = { ...fieldDefinitions };
            let globalOrder = 0;

            sections.forEach((section) => {
                const groupValue = `${section.name}|${section.colorIndex}`;
                section.fields.forEach((fieldKey) => {
                    if (updatedDefinitions[fieldKey]) {
                        updatedDefinitions[fieldKey] = {
                            ...updatedDefinitions[fieldKey],
                            order: globalOrder++,
                            group: groupValue, // Store section name and color
                        };
                    }
                });
            });

            // Save to backend
            await apiClient.updateFieldDefinitions(template.id, updatedDefinitions);

            // Update local state
            setFieldDefinitions(updatedDefinitions);
            setSaveSuccess(true);

            // Hide success message after 3 seconds
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save:", err);
            alert("บันทึกไม่สำเร็จ: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setSaving(false);
        }
    }, [template, fieldDefinitions, sections, setFieldDefinitions]);

    // Create highlighted HTML - use section colors
    const highlightedHtml = useMemo(() => {
        if (!htmlContent || !fieldDefinitions) return "";
        let html = htmlContent;

        // Build a map of field -> section color
        const fieldColorMap: Record<string, { bg: string; text: string }> = {};
        sections.forEach((section) => {
            const sectionColor = SECTION_COLORS[section.colorIndex % SECTION_COLORS.length];
            section.fields.forEach((fieldKey) => {
                fieldColorMap[fieldKey] = { bg: sectionColor.bg, text: sectionColor.text };
            });
        });

        Object.entries(fieldDefinitions).forEach(([key]) => {
            // Use section color if field is in a section, otherwise use default gray
            const color = fieldColorMap[key] || { bg: "#F3F4F6", text: "#374151" };
            const regex = new RegExp(`(\\{\\{${key}\\}\\})`, "gi");
            html = html.replace(regex, `<mark style="background-color: ${color.bg}; color: ${color.text}; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-weight: 500;">${aliases?.[key] || key}</mark>`);
        });

        const styles = `<style>html, body { margin: 0; padding: 0; background: white; } body { padding: 10mm; font-size: 12px; } mark { white-space: nowrap; }</style>`;
        if (html.includes("<!DOCTYPE") || html.includes("<html")) {
            return html.replace(/<head([^>]*)>/i, `<head$1>${styles}`);
        }
        return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${styles}</head><body>${html}</body></html>`;
    }, [htmlContent, fieldDefinitions, aliases, sections]);

    // Nodes and edges
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
                    onDataTypeChange: handleDataTypeChange, onMoveSection: moveSection, onColorChange: changeSectionColor, dataTypes,
                },
                draggable: true,
            });
        });

        const endX = startX + 200 + sections.length * (nodeWidth + nodeGap);
        newNodes.push({ id: "end", type: "endNode", position: { x: endX, y: startY + 100 }, data: {}, draggable: false });

        const previewX = endX + 200;
        newNodes.push({ id: "preview", type: "previewNode", position: { x: previewX, y: startY - 50 }, data: { html: highlightedHtml, loading: false }, draggable: true });

        if (sections.length > 0) {
            newEdges.push({ id: "start-to-first", source: "start", target: sections[0].id, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" }, style: { stroke: "#94A3B8", strokeWidth: 2 } });
            for (let i = 0; i < sections.length - 1; i++) {
                newEdges.push({ id: `edge-${i}`, source: sections[i].id, target: sections[i + 1].id, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" }, style: { stroke: "#94A3B8", strokeWidth: 2 } });
            }
            newEdges.push({ id: "last-to-end", source: sections[sections.length - 1].id, target: "end", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" }, style: { stroke: "#94A3B8", strokeWidth: 2 } });
        } else {
            newEdges.push({ id: "start-to-end", source: "start", target: "end", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" }, style: { stroke: "#94A3B8", strokeWidth: 2 } });
        }
        newEdges.push({ id: "end-to-preview", source: "end", target: "preview", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, color: "#22c55e" }, style: { stroke: "#22c55e", strokeWidth: 2 } });

        setNodes(newNodes);
        setEdges(newEdges);
    }, [sections, allFields, highlightedHtml, dataTypes, addFieldToSection, removeFieldFromSection, renameSection, deleteSection, reorderField, moveFieldToSection, handleDataTypeChange, moveSection, changeSectionColor, setNodes, setEdges]);

    const assignedFieldKeys = sections.flatMap((s) => s.fields);
    const unassignedCount = allFields.filter((f) => !assignedFieldKeys.includes(f.key)).length;

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                    <p className="text-gray-500">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-6 h-6 text-red-500" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button
                        onClick={() => router.push(`/forms/${template?.id}/edit`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        กลับไปหน้าแก้ไข
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push(`/forms/${template?.id}/edit`)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h2 className="font-semibold text-gray-900">Form Flow Editor</h2>
                        <p className="text-xs text-gray-500">{template?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {unassignedCount > 0 && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">{unassignedCount} ช่องยังไม่ได้จัดกลุ่ม</span>
                    )}
                    <button onClick={() => setShowRulesToolbar(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200">
                        <Wand2 className="w-4 h-4" />กฎจัดกลุ่ม
                    </button>
                    <button onClick={addSection} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300">
                        <Plus className="w-4 h-4" />เพิ่มส่วน
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-lg"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : saveSuccess ? (
                            <CheckCircle className="w-4 h-4" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saving ? "กำลังบันทึก..." : saveSuccess ? "บันทึกแล้ว" : "บันทึก"}
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.1}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#E2E8F0" />
                    <Controls showInteractive={false} className="!bg-white !border !border-gray-200 !rounded-lg !shadow-sm" />
                </ReactFlow>
            </div>

            {/* Entity Rules Toolbar */}
            {fieldDefinitions && (
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
            )}
        </div>
    );
}
