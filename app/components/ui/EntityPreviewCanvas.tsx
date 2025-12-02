"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { X, User, Users, Baby, FileSignature, UserCheck, Folder, ChevronDown, ChevronRight } from "lucide-react";
import type { FieldDefinition, Entity } from "@/lib/api/types";
import { ENTITY_LABELS } from "@/lib/utils/fieldTypes";
import { apiClient } from "@/lib/api/client";

// Entity icons
const ENTITY_ICONS: Record<Entity, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  child: Baby,
  mother: User,
  father: Users,
  informant: FileSignature,
  registrar: UserCheck,
  general: Folder,
};

// Entity colors
const ENTITY_COLORS: Record<Entity, { bg: string; border: string; accent: string; highlight: string }> = {
  child: { bg: "#fce7f3", border: "#ec4899", accent: "#db2777", highlight: "#fbcfe8" },
  mother: { bg: "#f3e8ff", border: "#a855f7", accent: "#9333ea", highlight: "#e9d5ff" },
  father: { bg: "#dbeafe", border: "#3b82f6", accent: "#2563eb", highlight: "#bfdbfe" },
  informant: { bg: "#fef3c7", border: "#f59e0b", accent: "#d97706", highlight: "#fde68a" },
  registrar: { bg: "#dcfce7", border: "#22c55e", accent: "#16a34a", highlight: "#bbf7d0" },
  general: { bg: "#f3f4f6", border: "#6b7280", accent: "#4b5563", highlight: "#e5e7eb" },
};

interface EntityGroup {
  entity: Entity;
  fields: { key: string; label: string }[];
}

// Entity Node Component
function EntityNode({ data }: { data: { group: EntityGroup; isSelected: boolean; onSelect: (entity: Entity) => void } }) {
  const { group, isSelected, onSelect } = data;
  const [isExpanded, setIsExpanded] = useState(true);
  const Icon = ENTITY_ICONS[group.entity];
  const color = ENTITY_COLORS[group.entity];

  return (
    <div
      className="bg-white rounded-xl shadow-lg border-2 min-w-[200px] max-w-[240px] overflow-hidden transition-all cursor-pointer"
      style={{
        borderColor: isSelected ? color.accent : color.border,
        boxShadow: isSelected ? `0 0 20px ${color.highlight}` : undefined
      }}
      onClick={() => onSelect(group.entity)}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-3"
        style={{ backgroundColor: color.bg }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color.highlight }}
        >
          <Icon className="w-4 h-4" style={{ color: color.accent }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: color.accent }}>
            {ENTITY_LABELS[group.entity]}
          </p>
          <p className="text-xs text-gray-500">{group.fields.length} ช่อง</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 hover:bg-white/50 rounded"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" style={{ color: color.accent }} />
          ) : (
            <ChevronRight className="w-4 h-4" style={{ color: color.accent }} />
          )}
        </button>
      </div>

      {/* Fields */}
      {isExpanded && (
        <div className="px-3 py-2 space-y-1">
          {group.fields.map((field) => (
            <div
              key={field.key}
              className="px-2 py-1.5 rounded text-xs bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <p className="text-gray-700 truncate">{field.label}</p>
            </div>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !border-2 !border-white"
        style={{ backgroundColor: color.accent }}
      />
    </div>
  );
}

// Preview Node Component
function PreviewNode({ data }: { data: { html: string; loading: boolean } }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const resizeIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    iframe.style.height = "auto";
    const contentHeight = iframe.contentDocument.documentElement.scrollHeight;
    iframe.style.height = `${Math.max(contentHeight, 500)}px`;
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      resizeIframe();
    };

    iframe.addEventListener("load", handleLoad);
    return () => iframe.removeEventListener("load", handleLoad);
  }, [resizeIframe]);

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden" style={{ width: 500 }}>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !border-2 !border-white !bg-gray-400"
      />

      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <p className="text-sm font-semibold text-gray-700">output</p>
      </div>

      {/* Preview Content */}
      <div className="p-2 bg-gray-100 max-h-[600px] overflow-auto">
        {data.loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded shadow-sm overflow-hidden">
            <iframe
              ref={iframeRef}
              srcDoc={data.html}
              className="w-full border-0 block"
              style={{ minHeight: 400 }}
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
  entityNode: EntityNode,
  previewNode: PreviewNode,
};

interface EntityPreviewCanvasProps {
  templateId: string;
  fieldDefinitions: Record<string, FieldDefinition>;
  aliases?: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
}

export function EntityPreviewCanvas({
  templateId,
  fieldDefinitions,
  aliases,
  isOpen,
  onClose,
}: EntityPreviewCanvasProps) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Group fields by entity
  const entityGroups = useMemo<EntityGroup[]>(() => {
    const groups: Record<Entity, { key: string; label: string }[]> = {
      child: [],
      mother: [],
      father: [],
      informant: [],
      registrar: [],
      general: [],
    };

    Object.entries(fieldDefinitions).forEach(([key, def]) => {
      if (def.group?.startsWith("merged_hidden_")) return;
      const rawEntity = def.entity || "general";
      const validEntity = groups[rawEntity as Entity] ? (rawEntity as Entity) : "general";
      groups[validEntity].push({
        key,
        label: aliases?.[key] || key,
      });
    });

    return (Object.entries(groups) as [Entity, { key: string; label: string }[]][])
      .filter(([, fields]) => fields.length > 0)
      .map(([entity, fields]) => ({ entity, fields }));
  }, [fieldDefinitions, aliases]);

  // Fetch HTML preview
  useEffect(() => {
    if (!isOpen || !templateId) return;

    const fetchHtml = async () => {
      setLoading(true);
      try {
        const html = await apiClient.getHTMLPreview(templateId);
        setHtmlContent(html || "");
      } catch (error) {
        console.error("Failed to fetch HTML preview:", error);
        setHtmlContent("<p style='padding: 20px; color: #666;'>ไม่สามารถโหลดตัวอย่างได้</p>");
      } finally {
        setLoading(false);
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
      const entity = ENTITY_COLORS[rawEntity as Entity] ? (rawEntity as Entity) : "general";
      const color = ENTITY_COLORS[entity];
      const isSelected = selectedEntity === entity;

      const regex = new RegExp(`(\\{\\{${key}\\}\\})`, "gi");
      const bgColor = isSelected ? color.accent : color.bg;
      const textColor = isSelected ? "#ffffff" : color.accent;
      const border = isSelected ? `2px solid ${color.accent}` : "none";

      html = html.replace(
        regex,
        `<mark style="background-color: ${bgColor}; color: ${textColor}; padding: 2px 6px; border-radius: 4px; border: ${border}; font-size: 0.9em;">${aliases?.[key] || key}</mark>`
      );
    });

    // Wrap HTML
    const styles = `
      <style>
        html, body { margin: 0; padding: 0; background: white; font-family: 'IBM Plex Sans Thai', sans-serif; }
        body { padding: 10mm; font-size: 12px; }
        mark { transition: all 0.2s ease; white-space: nowrap; }
      </style>
    `;

    if (html.includes("<!DOCTYPE") || html.includes("<html")) {
      return html.replace(/<head([^>]*)>/i, `<head$1>${styles}`);
    }

    return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${styles}</head><body>${html}</body></html>`;
  }, [htmlContent, fieldDefinitions, selectedEntity, aliases]);

  // Handle entity selection
  const handleSelectEntity = useCallback((entity: Entity) => {
    setSelectedEntity((prev) => (prev === entity ? null : entity));
  }, []);

  // Create nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    const newNodes: FlowNode[] = [];
    const newEdges: Edge[] = [];

    // Position entity nodes on the left with dynamic spacing
    const startY = 50;
    let currentY = startY;

    entityGroups.forEach((group) => {
      const color = ENTITY_COLORS[group.entity];
      // Calculate node height: header (60px) + fields (32px each) + padding (20px)
      const nodeHeight = 60 + (group.fields.length * 32) + 20;

      newNodes.push({
        id: `entity-${group.entity}`,
        type: "entityNode",
        position: { x: 50, y: currentY },
        data: {
          group,
          isSelected: selectedEntity === group.entity,
          onSelect: handleSelectEntity,
        },
        draggable: true,
      });

      // Create edge to preview
      newEdges.push({
        id: `edge-${group.entity}`,
        source: `entity-${group.entity}`,
        target: "preview",
        type: "default",
        animated: selectedEntity === group.entity,
        style: {
          stroke: selectedEntity === group.entity ? color.accent : "#d1d5db",
          strokeWidth: selectedEntity === group.entity ? 2 : 1,
          strokeDasharray: selectedEntity === group.entity ? undefined : "5,5",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: selectedEntity === group.entity ? color.accent : "#d1d5db",
        },
      });

      // Move to next position with gap
      currentY += nodeHeight + 30;
    });

    // Preview node on the right - center it vertically
    const totalHeight = currentY - 30;
    const previewY = Math.max(50, (totalHeight / 2) - 300);
    newNodes.push({
      id: "preview",
      type: "previewNode",
      position: { x: 450, y: Math.max(50, previewY) },
      data: {
        html: highlightedHtml,
        loading,
      },
      draggable: true,
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [entityGroups, selectedEntity, highlightedHtml, loading, handleSelectEntity, setNodes, setEdges]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6 z-50">
        <div>
          <h2 className="font-semibold text-gray-900">Entity Preview Canvas</h2>
          <p className="text-xs text-gray-500">
            คลิกที่กลุ่มข้อมูลเพื่อไฮไลท์ในเอกสาร
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Canvas */}
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
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
          <Controls showInteractive={false} className="!bg-white !border !border-gray-200 !rounded-lg !shadow-sm" />
        </ReactFlow>
      </div>
    </div>
  );
}

export default EntityPreviewCanvas;
