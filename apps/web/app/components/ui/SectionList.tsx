"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import type { FieldDefinition, Entity } from "@/lib/api/types";
import { ENTITY_LABELS } from "@/lib/utils/fieldTypes";

// Dynamic section colors - must match canvas SECTION_COLORS
const SECTION_COLOR_PALETTE = [
    { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800" },      // 0: เหลือง
    { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-800" },         // 1: น้ำเงิน
    { bg: "bg-pink-50", border: "border-pink-300", text: "text-pink-800" },         // 2: ชมพู
    { bg: "bg-green-50", border: "border-green-300", text: "text-green-800" },      // 3: เขียว
    { bg: "bg-indigo-50", border: "border-indigo-300", text: "text-indigo-800" },   // 4: ม่วง
    { bg: "bg-red-50", border: "border-red-300", text: "text-red-800" },            // 5: แดง
    { bg: "bg-gray-50", border: "border-gray-300", text: "text-gray-800" },         // 6: เทา
    { bg: "bg-cyan-50", border: "border-cyan-300", text: "text-cyan-800" },         // 7: ฟ้า
];

// Entity to color index mapping (for entity-based fallback)
const ENTITY_COLOR_MAP: Record<Entity, number> = {
    child: 2,      // ชมพู
    mother: 4,     // ม่วง
    father: 1,     // น้ำเงิน
    informant: 0,  // เหลือง
    registrar: 3,  // เขียว
    general: 6,    // เทา
};

interface SectionListProps {
    fieldDefinitions: Record<string, FieldDefinition>;
    aliases?: Record<string, string>;
}

export function SectionList({ fieldDefinitions, aliases }: SectionListProps) {
    // Group fields by saved group name OR by entity if no group is saved
    // IMPORTANT: Sort all fields by order first to maintain document order
    const sections = useMemo(() => {
        // First, convert to array and sort by order to maintain document order
        const sortedFields = Object.entries(fieldDefinitions)
            .filter(([, def]) => !def.group?.startsWith("merged_hidden_"))
            .map(([key, def]) => ({
                key,
                label: aliases?.[key] || key,
                order: def.order ?? 9999,
                definition: def,
            }))
            .sort((a, b) => a.order - b.order); // Sort by document order first!

        const fieldsWithGroups = sortedFields.filter(f => f.definition.group && !f.definition.group.startsWith("merged_hidden_"));
        const hasSavedGroups = fieldsWithGroups.length > 0;

        if (hasSavedGroups) {
            const groupMap: Record<string, { fields: { key: string; label: string; order: number }[]; minOrder: number; colorIndex: number }> = {};

            sortedFields.forEach((field) => {
                const rawGroup = field.definition.group || "ทั่วไป";
                const [groupName, colorStr] = rawGroup.includes("|")
                    ? rawGroup.split("|")
                    : [rawGroup, "0"];
                const colorIndex = parseInt(colorStr, 10) || 0;

                if (!groupMap[groupName]) {
                    groupMap[groupName] = { fields: [], minOrder: field.order, colorIndex };
                }

                groupMap[groupName].fields.push({
                    key: field.key,
                    label: field.label,
                    order: field.order,
                });

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
            // Fall back to entity-based grouping
            const entityGroups: Record<Entity, { key: string; label: string; order: number }[]> = {
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
                entityGroups[entity].push({
                    key: field.key,
                    label: field.label,
                    order: field.order,
                });
            });

            // Sort entity groups by the minimum order of their fields (first-come-first-serve)
            return (Object.entries(entityGroups) as [Entity, { key: string; label: string; order: number }[]][])
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
    }, [fieldDefinitions, aliases]);

    const totalFields = sections.reduce((sum, section) => sum + section.fields.length, 0);

    return (
        <div className="space-y-3">
            {/* Summary */}
            <p className="text-xs text-gray-400">{sections.length} ส่วน • {totalFields} ช่อง</p>

            {/* Section List */}
            <div className="space-y-2">
                {sections.map((section) => {
                    const color = SECTION_COLOR_PALETTE[section.colorIndex];

                    return (
                        <div
                            key={section.name}
                            className={`rounded-lg border ${color.border} ${color.bg} overflow-hidden`}
                        >
                            {/* Section Header */}
                            <div className="px-3 py-2 flex items-center gap-2">
                                <ChevronRight className={`w-4 h-4 ${color.text}`} />
                                <span className={`text-sm font-medium ${color.text}`}>
                                    {section.name}
                                </span>
                                <span className={`text-xs ${color.text} opacity-60`}>
                                    {section.fields.length} ช่อง
                                </span>
                            </div>

                            {/* Fields Preview */}
                            <div className="px-3 pb-2">
                                <div className="flex flex-wrap gap-1">
                                    {section.fields.slice(0, 5).map((field) => (
                                        <span
                                            key={field.key}
                                            className="text-xs px-2 py-0.5 bg-white/70 rounded text-gray-600"
                                        >
                                            {field.label}
                                        </span>
                                    ))}
                                    {section.fields.length > 5 && (
                                        <span className="text-xs px-2 py-0.5 text-gray-400">
                                            +{section.fields.length - 5} อื่นๆ
                                        </span>
                                    )}
                                </div>
                            </div>
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

export default SectionList;
