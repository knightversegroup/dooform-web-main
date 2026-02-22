"use client";

import { useState, useCallback } from "react";
import {
    X,
    Plus,
    Play,
    Trash2,
    ChevronDown,
    AlertCircle,
    CheckCircle2,
    Wand2,
} from "lucide-react";
import type { FieldDefinition } from "@dooform/shared/api/types";

// Section type (matches canvas Section)
interface Section {
    id: string;
    name: string;
    fields: string[];
    colorIndex: number;
}

// Rule match types
type MatchType = "starts_with" | "ends_with" | "contains" | "regex" | "equals";

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
    starts_with: "เริ่มต้นด้วย",
    ends_with: "ลงท้ายด้วย",
    contains: "มีคำว่า",
    regex: "Regex",
    equals: "เท่ากับ",
};

interface SectionRule {
    id: string;
    matchType: MatchType;
    pattern: string;
    targetSectionId: string;
    isActive: boolean;
}

interface EntityRulesToolbarProps {
    fieldDefinitions: Record<string, FieldDefinition>;
    sections: Section[];
    onMoveFieldToSection: (fieldKey: string, sectionId: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

// Check if a field key matches a rule
function matchesRule(fieldKey: string, rule: SectionRule): boolean {
    if (!rule.isActive || !rule.pattern) return false;

    const key = fieldKey.toLowerCase();
    const pattern = rule.pattern.toLowerCase();

    switch (rule.matchType) {
        case "starts_with":
            return key.startsWith(pattern);
        case "ends_with":
            return key.endsWith(pattern);
        case "contains":
            return key.includes(pattern);
        case "equals":
            return key === pattern;
        case "regex":
            try {
                const regex = new RegExp(rule.pattern, "i");
                return regex.test(fieldKey);
            } catch {
                return false;
            }
        default:
            return false;
    }
}

export function EntityRulesToolbar({
    fieldDefinitions,
    sections,
    onMoveFieldToSection,
    isOpen,
    onClose,
}: EntityRulesToolbarProps) {
    // Create default rules based on first section
    const defaultSectionId = sections[0]?.id || "";

    const [rules, setRules] = useState<SectionRule[]>([
        { id: "rule-1", matchType: "starts_with", pattern: "", targetSectionId: defaultSectionId, isActive: true },
    ]);
    const [previewResults, setPreviewResults] = useState<Record<string, string> | null>(null);
    const [appliedCount, setAppliedCount] = useState<number | null>(null);

    // Find which section a field currently belongs to
    const getFieldCurrentSection = useCallback((fieldKey: string): Section | undefined => {
        return sections.find(s => s.fields.includes(fieldKey));
    }, [sections]);

    // Add new rule
    const addRule = useCallback(() => {
        const newRule: SectionRule = {
            id: `rule-${Date.now()}`,
            matchType: "starts_with",
            pattern: "",
            targetSectionId: sections[0]?.id || "",
            isActive: true,
        };
        setRules((prev) => [...prev, newRule]);
    }, [sections]);

    // Update rule
    const updateRule = useCallback((id: string, updates: Partial<SectionRule>) => {
        setRules((prev) =>
            prev.map((rule) => (rule.id === id ? { ...rule, ...updates } : rule))
        );
        setPreviewResults(null);
        setAppliedCount(null);
    }, []);

    // Delete rule
    const deleteRule = useCallback((id: string) => {
        setRules((prev) => prev.filter((rule) => rule.id !== id));
        setPreviewResults(null);
        setAppliedCount(null);
    }, []);

    // Preview what rules would change
    const previewRules = useCallback(() => {
        const updates: Record<string, string> = {};

        Object.keys(fieldDefinitions).forEach((fieldKey) => {
            const currentSection = getFieldCurrentSection(fieldKey);

            // Find first matching rule (priority by order)
            for (const rule of rules) {
                if (matchesRule(fieldKey, rule)) {
                    // Only mark if section would change
                    if (currentSection?.id !== rule.targetSectionId) {
                        updates[fieldKey] = rule.targetSectionId;
                    }
                    break;
                }
            }
        });

        setPreviewResults(updates);
        setAppliedCount(null);
    }, [fieldDefinitions, rules, getFieldCurrentSection]);

    // Apply rules
    const applyRules = useCallback(() => {
        const updates: Record<string, string> = {};

        Object.keys(fieldDefinitions).forEach((fieldKey) => {
            const currentSection = getFieldCurrentSection(fieldKey);

            // Find first matching rule (priority by order)
            for (const rule of rules) {
                if (matchesRule(fieldKey, rule)) {
                    if (currentSection?.id !== rule.targetSectionId) {
                        updates[fieldKey] = rule.targetSectionId;
                    }
                    break;
                }
            }
        });

        if (Object.keys(updates).length > 0) {
            Object.entries(updates).forEach(([fieldKey, sectionId]) => {
                onMoveFieldToSection(fieldKey, sectionId);
            });
            setAppliedCount(Object.keys(updates).length);
            setPreviewResults(null);
        }
    }, [fieldDefinitions, rules, getFieldCurrentSection, onMoveFieldToSection]);

    // Reset rules
    const resetRules = useCallback(() => {
        setRules([
            { id: "rule-1", matchType: "starts_with", pattern: "", targetSectionId: sections[0]?.id || "", isActive: true },
        ]);
        setPreviewResults(null);
        setAppliedCount(null);
    }, [sections]);

    // Get section name by id
    const getSectionName = useCallback((sectionId: string) => {
        return sections.find(s => s.id === sectionId)?.name || "ไม่พบ";
    }, [sections]);

    // Get section color by id
    const getSectionColor = useCallback((sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return { bg: "#F3F4F6", text: "#374151" };
        const colors = [
            { bg: "#FEF3C7", text: "#92400E" },
            { bg: "#DBEAFE", text: "#1E40AF" },
            { bg: "#FCE7F3", text: "#9D174D" },
            { bg: "#D1FAE5", text: "#065F46" },
            { bg: "#E0E7FF", text: "#3730A3" },
            { bg: "#FEE2E2", text: "#991B1B" },
            { bg: "#F3F4F6", text: "#374151" },
            { bg: "#CFFAFE", text: "#155E75" },
        ];
        return colors[section.colorIndex % colors.length];
    }, [sections]);

    if (!isOpen) return null;

    const activeRulesCount = rules.filter((r) => r.isActive && r.pattern).length;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Wand2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">กฎการจัดกลุ่มอัตโนมัติ</h2>
                            <p className="text-xs text-gray-500">กำหนดกฎเพื่อจัดช่องกรอกข้อมูลเข้าส่วนต่างๆ ตามรูปแบบชื่อ</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Rules List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-600">
                            {activeRulesCount} กฎที่ใช้งาน • {Object.keys(fieldDefinitions).length} ช่องทั้งหมด • {sections.length} ส่วน
                        </span>
                        <button
                            onClick={resetRules}
                            className="text-xs text-gray-500 hover:text-gray-700"
                        >
                            รีเซ็ต
                        </button>
                    </div>

                    {sections.length === 0 && (
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-700 text-sm">
                            <AlertCircle className="w-4 h-4 inline mr-2" />
                            ยังไม่มีส่วนที่สร้างไว้ กรุณาสร้างส่วนก่อนใช้งานกฎ
                        </div>
                    )}

                    {rules.map((rule, index) => (
                        <div
                            key={rule.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                rule.isActive ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"
                            }`}
                        >
                            {/* Rule number / toggle */}
                            <button
                                onClick={() => updateRule(rule.id, { isActive: !rule.isActive })}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                                    rule.isActive
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-gray-200 text-gray-500"
                                }`}
                            >
                                {index + 1}
                            </button>

                            {/* If label */}
                            <span className="text-sm text-gray-500 font-medium">ถ้า</span>

                            {/* Match type dropdown */}
                            <div className="relative">
                                <select
                                    value={rule.matchType}
                                    onChange={(e) => updateRule(rule.id, { matchType: e.target.value as MatchType })}
                                    className="appearance-none bg-gray-100 text-sm px-3 py-1.5 pr-8 rounded-lg border-0 focus:ring-2 focus:ring-purple-500"
                                    disabled={!rule.isActive}
                                >
                                    {Object.entries(MATCH_TYPE_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>

                            {/* Pattern input */}
                            <input
                                type="text"
                                value={rule.pattern}
                                onChange={(e) => updateRule(rule.id, { pattern: e.target.value })}
                                placeholder={rule.matchType === "regex" ? "^[mf]_.*" : "m_"}
                                className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                disabled={!rule.isActive}
                            />

                            {/* Then label */}
                            <span className="text-sm text-gray-500 font-medium">→</span>

                            {/* Target section dropdown */}
                            <div className="relative">
                                <select
                                    value={rule.targetSectionId}
                                    onChange={(e) => updateRule(rule.id, { targetSectionId: e.target.value })}
                                    className="appearance-none text-sm px-3 py-1.5 pr-8 rounded-lg border-0 focus:ring-2 focus:ring-purple-500 font-medium"
                                    style={{
                                        backgroundColor: getSectionColor(rule.targetSectionId).bg,
                                        color: getSectionColor(rule.targetSectionId).text,
                                    }}
                                    disabled={!rule.isActive || sections.length === 0}
                                >
                                    {sections.map((section) => (
                                        <option key={section.id} value={section.id}>{section.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: getSectionColor(rule.targetSectionId).text }} />
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={() => deleteRule(rule.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                            >
                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                            </button>
                        </div>
                    ))}

                    {/* Add rule button */}
                    <button
                        onClick={addRule}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        เพิ่มกฎใหม่
                    </button>

                    {/* Preview results */}
                    {previewResults && Object.keys(previewResults).length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">
                                    ตัวอย่างผลลัพธ์: {Object.keys(previewResults).length} ช่องจะถูกย้าย
                                </span>
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                                {Object.entries(previewResults).map(([fieldKey, newSectionId]) => {
                                    const currentSection = getFieldCurrentSection(fieldKey);
                                    return (
                                        <div key={fieldKey} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-700 font-mono">{fieldKey}</span>
                                            <span className="text-blue-600">
                                                {currentSection?.name || "ไม่มีส่วน"} → {getSectionName(newSectionId)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {previewResults && Object.keys(previewResults).length === 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 text-gray-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm">ไม่มีช่องที่ต้องย้าย (อาจจัดกลุ่มถูกต้องแล้ว หรือไม่มีช่องที่ตรงกับกฎ)</span>
                            </div>
                        </div>
                    )}

                    {appliedCount !== null && (
                        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    ย้าย {appliedCount} ช่องเรียบร้อยแล้ว!
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-500">
                        กฎจะถูกประมวลผลตามลำดับ • กฎแรกที่ตรงจะถูกใช้งาน
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={previewRules}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <AlertCircle className="w-4 h-4" />
                            ดูตัวอย่าง
                        </button>
                        <button
                            onClick={applyRules}
                            disabled={activeRulesCount === 0 || sections.length === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play className="w-4 h-4" />
                            ใช้งานกฎทั้งหมด
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EntityRulesToolbar;
