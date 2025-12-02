"use client";

import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import type { FieldDefinition } from "@/lib/api/types";

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

interface SectionListProps {
    fieldDefinitions: Record<string, FieldDefinition>;
    aliases?: Record<string, string>;
}

export function SectionList({ fieldDefinitions, aliases }: SectionListProps) {
    // Group fields by saved group name, with order and color preserved
    const sections = useMemo(() => {
        const groupMap: Record<string, { fields: { key: string; label: string; order: number }[]; minOrder: number; colorIndex: number }> = {};

        Object.entries(fieldDefinitions)
            .filter(([, def]) => !def.group?.startsWith("merged_hidden_"))
            .forEach(([key, def]) => {
                // Parse group format: "name|colorIndex" or just "name"
                const rawGroup = def.group || "ทั่วไป";
                const [groupName, colorStr] = rawGroup.includes("|")
                    ? rawGroup.split("|")
                    : [rawGroup, "0"];
                const colorIndex = parseInt(colorStr, 10) || 0;
                const order = def.order ?? 9999;

                if (!groupMap[groupName]) {
                    groupMap[groupName] = { fields: [], minOrder: order, colorIndex };
                }

                groupMap[groupName].fields.push({
                    key,
                    label: aliases?.[key] || key,
                    order,
                });

                if (order < groupMap[groupName].minOrder) {
                    groupMap[groupName].minOrder = order;
                }
            });

        // Sort fields within each group by order
        Object.values(groupMap).forEach((group) => {
            group.fields.sort((a, b) => a.order - b.order);
        });

        // Sort groups by their minimum order
        return Object.entries(groupMap)
            .sort(([, a], [, b]) => a.minOrder - b.minOrder)
            .map(([name, group]) => ({
                name,
                fields: group.fields,
                colorIndex: group.colorIndex % SECTION_COLOR_PALETTE.length,
            }));
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
