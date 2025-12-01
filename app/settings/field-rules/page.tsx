"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Play,
    Settings,
    RefreshCw,
    HelpCircle,
    Wand2,
    Users,
    FileText,
    Database,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { FieldRule, DataTypeOption, InputTypeOption, EntityRule, ConfigurableDataType, ConfigurableInputType } from "@/lib/api/types";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { useAuth } from "@/lib/auth/context";

// Pattern builder types
type MatchType = "starts_with" | "ends_with" | "contains" | "exact" | "regex";

interface PatternBuilderState {
    matchType: MatchType;
    value: string;
    caseSensitive: boolean;
}

// Convert pattern builder state to regex
function buildRegexFromPattern(state: PatternBuilderState): string {
    const { matchType, value, caseSensitive } = state;

    if (matchType === "regex") {
        return value; // User provides raw regex
    }

    // Split by comma to support multiple values (OR logic)
    const values = value.split(",").map(v => v.trim()).filter(v => v.length > 0);

    if (values.length === 0) {
        return "";
    }

    const casePrefix = caseSensitive ? "" : "(?i)";

    // Escape special regex characters for each value
    const escapedValues = values.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    // Build pattern based on match type
    let patterns: string[];
    switch (matchType) {
        case "starts_with":
            patterns = escapedValues.map(v => `^${v}`);
            break;
        case "ends_with":
            patterns = escapedValues.map(v => `${v}$`);
            break;
        case "contains":
            patterns = escapedValues; // Just the escaped value
            break;
        case "exact":
            patterns = escapedValues.map(v => `^${v}$`);
            break;
        default:
            patterns = escapedValues;
    }

    // Join with OR (|) if multiple values
    const combinedPattern = patterns.length > 1 ? `(${patterns.join("|")})` : patterns[0];

    return `${casePrefix}${combinedPattern}`;
}

// Try to parse regex back to pattern builder state
function parseRegexToPattern(regex: string): PatternBuilderState | null {
    if (!regex) return null;

    let caseSensitive = true;
    let pattern = regex;

    // Check for case-insensitive flag
    if (pattern.startsWith("(?i)")) {
        caseSensitive = false;
        pattern = pattern.slice(4);
    }

    // Check for exact match (starts with ^ and ends with $)
    if (pattern.startsWith("^") && pattern.endsWith("$") && !pattern.slice(1, -1).includes("^") && !pattern.slice(1, -1).includes("$")) {
        const value = pattern.slice(1, -1).replace(/\\(.)/g, "$1");
        return { matchType: "exact", value, caseSensitive };
    }

    // Check for starts_with (starts with ^)
    if (pattern.startsWith("^") && !pattern.endsWith("$")) {
        const value = pattern.slice(1).replace(/\\(.)/g, "$1");
        // Check if it's a simple pattern
        if (!value.includes("(") && !value.includes("[") && !value.includes("*") && !value.includes("+")) {
            return { matchType: "starts_with", value, caseSensitive };
        }
    }

    // Check for ends_with (ends with $)
    if (pattern.endsWith("$") && !pattern.startsWith("^")) {
        const value = pattern.slice(0, -1).replace(/\\(.)/g, "$1");
        // Check if it's a simple pattern
        if (!value.includes("(") && !value.includes("[") && !value.includes("*") && !value.includes("+")) {
            return { matchType: "ends_with", value, caseSensitive };
        }
    }

    // Check for simple contains (no anchors)
    if (!pattern.startsWith("^") && !pattern.endsWith("$")) {
        const value = pattern.replace(/\\(.)/g, "$1");
        // Check if it's a simple pattern
        if (!value.includes("(") && !value.includes("[") && !value.includes("*") && !value.includes("+") && !value.includes("\\d") && !value.includes("\\w")) {
            return { matchType: "contains", value, caseSensitive };
        }
    }

    // Complex regex - return as regex type
    return { matchType: "regex", value: regex, caseSensitive: true };
}

// Pattern Builder Component
function PatternBuilder({
    pattern,
    onChange
}: {
    pattern: string;
    onChange: (pattern: string) => void;
}) {
    const [state, setState] = useState<PatternBuilderState>(() => {
        const parsed = parseRegexToPattern(pattern);
        return parsed || { matchType: "contains", value: "", caseSensitive: false };
    });

    const [showAdvanced, setShowAdvanced] = useState(() => {
        const parsed = parseRegexToPattern(pattern);
        return parsed?.matchType === "regex";
    });

    // Update parent when state changes
    useEffect(() => {
        const newPattern = buildRegexFromPattern(state);
        if (newPattern !== pattern) {
            onChange(newPattern);
        }
    }, [state, onChange, pattern]);

    const matchTypeLabels: Record<MatchType, { label: string; description: string; example: string }> = {
        starts_with: {
            label: "เริ่มต้นด้วย",
            description: "ชื่อช่องต้องเริ่มต้นด้วยคำนี้ (ใส่หลายคำคั่นด้วย , ได้)",
            example: "เช่น: m_, p_ จะตรงกับ m_name, p_date"
        },
        ends_with: {
            label: "ลงท้ายด้วย",
            description: "ชื่อช่องต้องลงท้ายด้วยคำนี้ (ใส่หลายคำคั่นด้วย , ได้)",
            example: "เช่น: _date, _time จะตรงกับ birth_date, start_time"
        },
        contains: {
            label: "มีคำว่า",
            description: "ชื่อช่องต้องมีคำนี้อยู่ (ใส่หลายคำคั่นด้วย , ได้)",
            example: "เช่น: country, nation จะตรงกับ _country, nationality"
        },
        exact: {
            label: "ตรงทั้งหมด",
            description: "ชื่อช่องต้องตรงเป๊ะ (ใส่หลายคำคั่นด้วย , ได้)",
            example: "เช่น: id, code จะตรงกับ id หรือ code เท่านั้น"
        },
        regex: {
            label: "Regex (ขั้นสูง)",
            description: "ใช้ Regular Expression สำหรับรูปแบบซับซ้อน",
            example: "เช่น: ^\\$\\d+ สำหรับ $1, $12, $123"
        },
    };

    return (
        <div className="space-y-4">
            {/* Toggle between simple and advanced */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">รูปแบบการจับคู่ *</label>
                <button
                    type="button"
                    onClick={() => {
                        setShowAdvanced(!showAdvanced);
                        if (!showAdvanced) {
                            setState({ ...state, matchType: "regex" });
                        } else {
                            setState({ ...state, matchType: "contains" });
                        }
                    }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                    <Wand2 className="w-3 h-3" />
                    {showAdvanced ? "โหมดง่าย" : "โหมดขั้นสูง (Regex)"}
                </button>
            </div>

            {!showAdvanced ? (
                <>
                    {/* Match Type Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {(Object.keys(matchTypeLabels) as MatchType[])
                            .filter(type => type !== "regex")
                            .map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setState({ ...state, matchType: type })}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                        state.matchType === type
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : "border-border-default hover:border-primary/50"
                                    }`}
                                >
                                    <div className="font-medium text-sm text-foreground">
                                        {matchTypeLabels[type].label}
                                    </div>
                                </button>
                            ))}
                    </div>

                    {/* Help text for selected type */}
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <div className="flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                                <p className="text-blue-700">{matchTypeLabels[state.matchType].description}</p>
                                <p className="text-blue-600 text-xs mt-1">{matchTypeLabels[state.matchType].example}</p>
                            </div>
                        </div>
                    </div>

                    {/* Value Input */}
                    <Input
                        label="คำที่ต้องการจับคู่ (คั่นด้วย , สำหรับหลายคำ)"
                        type="text"
                        placeholder={state.matchType === "starts_with" ? "เช่น m_, p_ (คั่นด้วย , สำหรับหลายคำ)" :
                                     state.matchType === "ends_with" ? "เช่น _date, _id, _name" :
                                     state.matchType === "contains" ? "เช่น country, nation, _country" :
                                     "เช่น id, code"}
                        value={state.value}
                        onChange={(e) => setState({ ...state, value: e.target.value })}
                    />

                    {/* Case Sensitivity Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!state.caseSensitive}
                            onChange={(e) => setState({ ...state, caseSensitive: !e.target.checked })}
                            className="w-4 h-4 rounded border-border-default"
                        />
                        <span className="text-sm text-foreground">ไม่สนใจตัวพิมพ์ใหญ่-เล็ก</span>
                        <span className="text-xs text-text-muted">(เช่น Name = name = NAME)</span>
                    </label>
                </>
            ) : (
                <>
                    {/* Advanced Regex Input */}
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg mb-2">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-amber-700">
                                <p>โหมดขั้นสูงใช้ Regular Expression</p>
                                <ul className="text-xs mt-1 space-y-0.5">
                                    <li>• <code className="bg-amber-100 px-1 rounded">(?i)</code> = ไม่สนใจตัวพิมพ์ใหญ่-เล็ก</li>
                                    <li>• <code className="bg-amber-100 px-1 rounded">^</code> = เริ่มต้น, <code className="bg-amber-100 px-1 rounded">$</code> = สิ้นสุด</li>
                                    <li>• <code className="bg-amber-100 px-1 rounded">\d</code> = ตัวเลข, <code className="bg-amber-100 px-1 rounded">\d+</code> = ตัวเลขหลายตัว</li>
                                    <li>• <code className="bg-amber-100 px-1 rounded">\w</code> = ตัวอักษร/ตัวเลข</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <Input
                        label="Regex Pattern"
                        type="text"
                        placeholder="เช่น (?i)_date$ หรือ ^\$\d+$"
                        value={state.value}
                        onChange={(e) => setState({ ...state, matchType: "regex", value: e.target.value })}
                    />
                </>
            )}

            {/* Preview */}
            <div className="p-3 bg-surface-alt rounded-lg">
                <div className="text-xs text-text-muted mb-1">Regex ที่สร้าง:</div>
                <code className="text-sm font-mono text-primary break-all">
                    {buildRegexFromPattern(state) || "(กรุณากรอกคำที่ต้องการจับคู่)"}
                </code>
            </div>
        </div>
    );
}

// Common patterns for quick selection
const QUICK_PATTERNS = [
    {
        label: "ลงท้าย _date",
        pattern: "(?i)_date$",
        dataType: "date",
        inputType: "date",
        description: "ช่องวันที่ เช่น birth_date, m_date"
    },
    {
        label: "ลงท้าย _time",
        pattern: "(?i)_time$",
        dataType: "time",
        inputType: "time",
        description: "ช่องเวลา เช่น start_time, end_time"
    },
    {
        label: "ลงท้าย _id",
        pattern: "(?i)_id$",
        dataType: "id_number",
        inputType: "text",
        description: "รหัสบัตรประชาชน เช่น citizen_id, m_id"
    },
    {
        label: "ลงท้าย _name",
        pattern: "(?i)_name$",
        dataType: "name",
        inputType: "text",
        description: "ชื่อ เช่น first_name, m_name"
    },
    {
        label: "ลงท้าย _phone",
        pattern: "(?i)_phone$",
        dataType: "phone",
        inputType: "text",
        description: "เบอร์โทร เช่น contact_phone"
    },
    {
        label: "ลงท้าย _email",
        pattern: "(?i)_email$",
        dataType: "email",
        inputType: "text",
        description: "อีเมล เช่น user_email"
    },
    {
        label: "ลงท้าย _addr",
        pattern: "(?i)_addr",
        dataType: "address",
        inputType: "textarea",
        description: "ที่อยู่ เช่น home_addr, current_address"
    },
    {
        label: "เริ่มด้วย $ + ตัวเลข",
        pattern: "^\\$\\d+",
        dataType: "text",
        inputType: "text",
        groupName: "dollar_numbers",
        description: "กลุ่มตัวเลข เช่น $1, $12, $123"
    },
    {
        label: "ลงท้าย _D (duplicate)",
        pattern: "_D\\d*$",
        dataType: "text",
        inputType: "text",
        groupName: "duplicates",
        description: "ช่องซ้ำ เช่น name_D, id_D2"
    },
];

export default function FieldRulesPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();

    // Tab state - default to datatype (main tab now)
    const [activeTab, setActiveTab] = useState<"entity" | "datatype">("datatype");

    const [rules, setRules] = useState<FieldRule[]>([]);
    const [entityRules, setEntityRules] = useState<EntityRule[]>([]);
    const [dataTypes, setDataTypes] = useState<DataTypeOption[]>([]);
    const [inputTypes, setInputTypes] = useState<InputTypeOption[]>([]);
    const [configurableDataTypes, setConfigurableDataTypes] = useState<ConfigurableDataType[]>([]);
    const [configurableInputTypes, setConfigurableInputTypes] = useState<ConfigurableInputType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Edit/Create modal state
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState<FieldRule | null>(null);
    const [saving, setSaving] = useState(false);

    // Entity modal state
    const [showEntityModal, setShowEntityModal] = useState(false);
    const [editingEntityRule, setEditingEntityRule] = useState<EntityRule | null>(null);
    const [entityFormData, setEntityFormData] = useState({
        name: "",
        code: "",
        description: "",
        pattern: "",
        priority: 0,
        is_active: true,
        color: "#6b7280",
    });

    // Data Type modal state
    const [showDataTypeModal, setShowDataTypeModal] = useState(false);
    const [editingDataType, setEditingDataType] = useState<ConfigurableDataType | null>(null);
    const [dataTypeFormData, setDataTypeFormData] = useState({
        code: "",
        name: "",
        description: "",
        pattern: "",  // Regex pattern for auto-detection
        input_type: "text",
        options: "",  // JSON string or comma-separated values for dropdown options
        validation: "",  // JSON string for validation rules
        default_value: "",  // Default input value
        priority: 0,
        is_active: true,
    });

    // Input Type modal state
    const [showInputTypeModal, setShowInputTypeModal] = useState(false);
    const [editingInputType, setEditingInputType] = useState<ConfigurableInputType | null>(null);
    const [inputTypeFormData, setInputTypeFormData] = useState({
        code: "",
        name: "",
        description: "",
        priority: 0,
        is_active: true,
    });

    // Test pattern state
    const [testPlaceholders, setTestPlaceholders] = useState("");
    const [testResults, setTestResults] = useState<Record<string, boolean> | null>(null);
    const [testing, setTesting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        pattern: "",
        priority: 0,
        is_active: true,
        data_type: "text",
        input_type: "text",
        entity: "",
        group_name: "",
        validation: "",
        options: "",
    });

    // Expanded rules for mobile view
    const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

    // Show quick patterns
    const [showQuickPatterns, setShowQuickPatterns] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace("/login?redirect=/settings/field-rules");
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Try to load rules - if 404, the backend might not have this feature yet
                try {
                    const [
                        rulesData,
                        dataTypesData,
                        inputTypesData,
                        entityRulesData,
                        configDataTypes,
                        configInputTypes,
                    ] = await Promise.all([
                        apiClient.getFieldRules(true),
                        apiClient.getDataTypes(),
                        apiClient.getInputTypes(),
                        apiClient.getEntityRules(true).catch(() => []),
                        apiClient.getConfigurableDataTypes().catch(() => []),
                        apiClient.getConfigurableInputTypes().catch(() => []),
                    ]);
                    setRules(rulesData);
                    setDataTypes(dataTypesData);
                    setInputTypes(inputTypesData);
                    setEntityRules(entityRulesData);
                    setConfigurableDataTypes(configDataTypes);
                    setConfigurableInputTypes(configInputTypes);
                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : "";
                    if (errorMsg.includes("404") || errorMsg.includes("Not Found")) {
                        setError("Backend ยังไม่รองรับ Field Rules API กรุณา restart backend service เพื่อเปิดใช้งาน");
                        // Set default data types and input types for the form
                        setDataTypes([
                            { value: "text", label: "ข้อความ" },
                            { value: "id_number", label: "เลขบัตรประชาชน" },
                            { value: "date", label: "วันที่" },
                            { value: "time", label: "เวลา" },
                            { value: "number", label: "ตัวเลข" },
                            { value: "address", label: "ที่อยู่" },
                            { value: "province", label: "จังหวัด" },
                            { value: "name_prefix", label: "คำนำหน้าชื่อ" },
                            { value: "name", label: "ชื่อ" },
                        ]);
                        setInputTypes([
                            { value: "text", label: "Text Input" },
                            { value: "select", label: "Dropdown Select" },
                            { value: "date", label: "Date Picker" },
                            { value: "time", label: "Time Picker" },
                            { value: "number", label: "Number Input" },
                            { value: "textarea", label: "Text Area" },
                        ]);
                    } else {
                        throw err;
                    }
                }
            } catch (err) {
                console.error("Failed to load data:", err);
                setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้");
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            loadData();
        }
    }, [isAuthenticated]);

    const handleCreateNew = () => {
        setEditingRule(null);
        setFormData({
            name: "",
            description: "",
            pattern: "",
            priority: 0,
            is_active: true,
            data_type: "text",
            input_type: "text",
            entity: "",
            group_name: "",
            validation: "",
            options: "",
        });
        setShowQuickPatterns(true);
        setShowModal(true);
    };

    // Entity rule handlers
    const handleCreateEntityRule = () => {
        setEditingEntityRule(null);
        setEntityFormData({
            name: "",
            code: "",
            description: "",
            pattern: "",
            priority: 0,
            is_active: true,
            color: "#6b7280",
        });
        setShowEntityModal(true);
    };

    const handleEditEntityRule = (rule: EntityRule) => {
        setEditingEntityRule(rule);
        setEntityFormData({
            name: rule.name,
            code: rule.code,
            description: rule.description || "",
            pattern: rule.pattern,
            priority: rule.priority,
            is_active: rule.is_active,
            color: rule.color || "#6b7280",
        });
        setShowEntityModal(true);
    };

    const handleSaveEntityRule = async () => {
        try {
            setSaving(true);
            setError(null);

            if (!entityFormData.name || !entityFormData.code || !entityFormData.pattern) {
                setError("กรุณากรอกชื่อ, รหัส และรูปแบบการจับคู่");
                return;
            }

            if (editingEntityRule) {
                await apiClient.updateEntityRule(editingEntityRule.id, entityFormData);
                setSuccess("อัปเดตกฎ Entity สำเร็จ");
            } else {
                await apiClient.createEntityRule(entityFormData);
                setSuccess("สร้างกฎ Entity ใหม่สำเร็จ");
            }

            // Reload entity rules
            const entityRulesData = await apiClient.getEntityRules(true);
            setEntityRules(entityRulesData);
            setShowEntityModal(false);
        } catch (err) {
            console.error("Failed to save entity rule:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกได้");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEntityRule = async (ruleId: string) => {
        if (!confirm("คุณต้องการลบกฎ Entity นี้หรือไม่?")) return;

        try {
            await apiClient.deleteEntityRule(ruleId);
            setEntityRules(entityRules.filter((r) => r.id !== ruleId));
            setSuccess("ลบกฎ Entity สำเร็จ");
        } catch (err) {
            console.error("Failed to delete entity rule:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถลบได้");
        }
    };

    const handleToggleEntityActive = async (rule: EntityRule) => {
        try {
            await apiClient.updateEntityRule(rule.id, { is_active: !rule.is_active });
            setEntityRules(entityRules.map((r) =>
                r.id === rule.id ? { ...r, is_active: !r.is_active } : r
            ));
        } catch (err) {
            console.error("Failed to toggle entity rule:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะได้");
        }
    };

    const handleInitializeEntityDefaults = async () => {
        if (!confirm("ต้องการสร้างกฎ Entity เริ่มต้นหรือไม่?")) return;

        try {
            await apiClient.initializeDefaultEntityRules();
            const entityRulesData = await apiClient.getEntityRules(true);
            setEntityRules(entityRulesData);
            setSuccess("สร้างกฎ Entity เริ่มต้นสำเร็จ");
        } catch (err) {
            console.error("Failed to initialize entity defaults:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถสร้างกฎเริ่มต้นได้");
        }
    };

    // =====================
    // Data Type Handlers
    // =====================

    const handleCreateDataType = () => {
        setEditingDataType(null);
        setDataTypeFormData({
            code: "",
            name: "",
            description: "",
            pattern: "",
            input_type: "text",
            options: "",
            validation: "",
            default_value: "",
            priority: 0,
            is_active: true,
        });
        setShowDataTypeModal(true);
    };

    const handleEditDataType = (dt: ConfigurableDataType) => {
        setEditingDataType(dt);
        // Parse options from JSON if it exists
        let optionsStr = "";
        if (dt.options && dt.options !== "{}") {
            try {
                const parsed = JSON.parse(dt.options);
                if (Array.isArray(parsed)) {
                    optionsStr = parsed.join("\n");
                } else if (typeof parsed === "object" && parsed.items) {
                    optionsStr = parsed.items.join("\n");
                }
            } catch {
                optionsStr = dt.options;
            }
        }
        setDataTypeFormData({
            code: dt.code,
            name: dt.name,
            description: dt.description || "",
            pattern: dt.pattern || "",
            input_type: dt.input_type || "text",
            options: optionsStr,
            validation: dt.validation || "",
            default_value: dt.default_value || "",
            priority: dt.priority,
            is_active: dt.is_active,
        });
        setShowDataTypeModal(true);
    };

    const handleSaveDataType = async () => {
        try {
            setSaving(true);
            setError(null);

            if (!dataTypeFormData.code || !dataTypeFormData.name) {
                setError("กรุณากรอกรหัสและชื่อ");
                return;
            }

            // Convert options from newline-separated to JSON array
            let optionsJson = "{}";
            if (dataTypeFormData.options.trim()) {
                const optionsArray = dataTypeFormData.options
                    .split("\n")
                    .map(opt => opt.trim())
                    .filter(opt => opt.length > 0);
                optionsJson = JSON.stringify(optionsArray);
            }

            const dataToSave = {
                ...dataTypeFormData,
                options: optionsJson,
                validation: dataTypeFormData.validation || "{}",
            };

            if (editingDataType) {
                await apiClient.updateConfigurableDataType(editingDataType.id, dataToSave);
                setSuccess("อัปเดต Data Type สำเร็จ");
            } else {
                await apiClient.createConfigurableDataType(dataToSave);
                setSuccess("สร้าง Data Type ใหม่สำเร็จ");
            }

            const data = await apiClient.getConfigurableDataTypes();
            setConfigurableDataTypes(data);
            setShowDataTypeModal(false);
        } catch (err) {
            console.error("Failed to save data type:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกได้");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteDataType = async (id: string) => {
        if (!confirm("คุณต้องการลบ Data Type นี้หรือไม่?")) return;

        try {
            await apiClient.deleteConfigurableDataType(id);
            setConfigurableDataTypes(configurableDataTypes.filter((dt) => dt.id !== id));
            setSuccess("ลบ Data Type สำเร็จ");
        } catch (err) {
            console.error("Failed to delete data type:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถลบได้");
        }
    };

    const handleToggleDataTypeActive = async (dt: ConfigurableDataType) => {
        try {
            await apiClient.updateConfigurableDataType(dt.id, { is_active: !dt.is_active });
            setConfigurableDataTypes(configurableDataTypes.map((d) =>
                d.id === dt.id ? { ...d, is_active: !d.is_active } : d
            ));
        } catch (err) {
            console.error("Failed to toggle data type:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะได้");
        }
    };

    const handleInitializeDataTypeDefaults = async () => {
        if (!confirm("ต้องการสร้าง Data Type เริ่มต้นหรือไม่?")) return;

        try {
            await apiClient.initializeDefaultDataTypes();
            const data = await apiClient.getConfigurableDataTypes();
            setConfigurableDataTypes(data);
            setSuccess("สร้าง Data Type เริ่มต้นสำเร็จ");
        } catch (err) {
            console.error("Failed to initialize data type defaults:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถสร้างค่าเริ่มต้นได้");
        }
    };

    // =====================
    // Input Type Handlers
    // =====================

    const handleCreateInputType = () => {
        setEditingInputType(null);
        setInputTypeFormData({
            code: "",
            name: "",
            description: "",
            priority: 0,
            is_active: true,
        });
        setShowInputTypeModal(true);
    };

    const handleEditInputType = (it: ConfigurableInputType) => {
        setEditingInputType(it);
        setInputTypeFormData({
            code: it.code,
            name: it.name,
            description: it.description || "",
            priority: it.priority,
            is_active: it.is_active,
        });
        setShowInputTypeModal(true);
    };

    const handleSaveInputType = async () => {
        try {
            setSaving(true);
            setError(null);

            if (!inputTypeFormData.code || !inputTypeFormData.name) {
                setError("กรุณากรอกรหัสและชื่อ");
                return;
            }

            if (editingInputType) {
                await apiClient.updateConfigurableInputType(editingInputType.id, inputTypeFormData);
                setSuccess("อัปเดต Input Type สำเร็จ");
            } else {
                await apiClient.createConfigurableInputType(inputTypeFormData);
                setSuccess("สร้าง Input Type ใหม่สำเร็จ");
            }

            const data = await apiClient.getConfigurableInputTypes();
            setConfigurableInputTypes(data);
            setShowInputTypeModal(false);
        } catch (err) {
            console.error("Failed to save input type:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกได้");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteInputType = async (id: string) => {
        if (!confirm("คุณต้องการลบ Input Type นี้หรือไม่?")) return;

        try {
            await apiClient.deleteConfigurableInputType(id);
            setConfigurableInputTypes(configurableInputTypes.filter((it) => it.id !== id));
            setSuccess("ลบ Input Type สำเร็จ");
        } catch (err) {
            console.error("Failed to delete input type:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถลบได้");
        }
    };

    const handleToggleInputTypeActive = async (it: ConfigurableInputType) => {
        try {
            await apiClient.updateConfigurableInputType(it.id, { is_active: !it.is_active });
            setConfigurableInputTypes(configurableInputTypes.map((i) =>
                i.id === it.id ? { ...i, is_active: !i.is_active } : i
            ));
        } catch (err) {
            console.error("Failed to toggle input type:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะได้");
        }
    };

    const handleInitializeInputTypeDefaults = async () => {
        if (!confirm("ต้องการสร้าง Input Type เริ่มต้นหรือไม่?")) return;

        try {
            await apiClient.initializeDefaultInputTypes();
            const data = await apiClient.getConfigurableInputTypes();
            setConfigurableInputTypes(data);
            setSuccess("สร้าง Input Type เริ่มต้นสำเร็จ");
        } catch (err) {
            console.error("Failed to initialize input type defaults:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถสร้างค่าเริ่มต้นได้");
        }
    };

    const handleEdit = (rule: FieldRule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            description: rule.description || "",
            pattern: rule.pattern,
            priority: rule.priority,
            is_active: rule.is_active,
            data_type: rule.data_type || "text",
            input_type: rule.input_type || "text",
            entity: rule.entity || "",
            group_name: rule.group_name || "",
            validation: rule.validation || "",
            options: rule.options || "",
        });
        setShowQuickPatterns(false);
        setShowModal(true);
    };

    const handleQuickPatternSelect = (qp: typeof QUICK_PATTERNS[0]) => {
        setFormData({
            ...formData,
            name: qp.label,
            description: qp.description,
            pattern: qp.pattern,
            data_type: qp.dataType,
            input_type: qp.inputType,
            group_name: (qp as { groupName?: string }).groupName || "",
        });
        setShowQuickPatterns(false);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            if (!formData.name || !formData.pattern) {
                setError("กรุณากรอกชื่อและรูปแบบการจับคู่");
                return;
            }

            if (editingRule) {
                await apiClient.updateFieldRule(editingRule.id, formData);
                setSuccess("อัปเดตกฎสำเร็จ");
            } else {
                await apiClient.createFieldRule(formData);
                setSuccess("สร้างกฎใหม่สำเร็จ");
            }

            // Reload rules
            const rulesData = await apiClient.getFieldRules(true);
            setRules(rulesData);
            setShowModal(false);
        } catch (err) {
            console.error("Failed to save rule:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถบันทึกได้");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ruleId: string) => {
        if (!confirm("คุณต้องการลบกฎนี้หรือไม่?")) return;

        try {
            await apiClient.deleteFieldRule(ruleId);
            setRules(rules.filter((r) => r.id !== ruleId));
            setSuccess("ลบกฎสำเร็จ");
        } catch (err) {
            console.error("Failed to delete rule:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถลบได้");
        }
    };

    const handleToggleActive = async (rule: FieldRule) => {
        try {
            await apiClient.updateFieldRule(rule.id, { is_active: !rule.is_active });
            setRules(rules.map((r) =>
                r.id === rule.id ? { ...r, is_active: !r.is_active } : r
            ));
        } catch (err) {
            console.error("Failed to toggle rule:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถเปลี่ยนสถานะได้");
        }
    };

    const handleTestWithRule = async (rule: FieldRule) => {
        if (!testPlaceholders) {
            setError("กรุณากรอก Placeholders สำหรับทดสอบ");
            return;
        }

        try {
            setTesting(true);
            const placeholders = testPlaceholders.split(",").map((p) => p.trim()).filter(Boolean);
            const result = await apiClient.testFieldRule(rule.pattern, placeholders);
            setTestResults(result.results);
            // Expand the rule to show results
            setExpandedRules(new Set([rule.id]));
        } catch (err) {
            console.error("Failed to test pattern:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถทดสอบ Pattern ได้");
        } finally {
            setTesting(false);
        }
    };

    const handleInitializeDefaults = async () => {
        if (!confirm("ต้องการสร้างกฎเริ่มต้นหรือไม่? (จะไม่ทับกฎที่มีอยู่)")) return;

        try {
            await apiClient.initializeDefaultFieldRules();
            const rulesData = await apiClient.getFieldRules(true);
            setRules(rulesData);
            setSuccess("สร้างกฎเริ่มต้นสำเร็จ");
        } catch (err) {
            console.error("Failed to initialize defaults:", err);
            setError(err instanceof Error ? err.message : "ไม่สามารถสร้างกฎเริ่มต้นได้");
        }
    };

    const toggleExpanded = (ruleId: string) => {
        const newExpanded = new Set(expandedRules);
        if (newExpanded.has(ruleId)) {
            newExpanded.delete(ruleId);
        } else {
            newExpanded.add(ruleId);
        }
        setExpandedRules(newExpanded);
    };

    // Memoized pattern change handler
    const handlePatternChange = useCallback((pattern: string) => {
        setFormData(prev => ({ ...prev, pattern }));
    }, []);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // Helper function to describe pattern in Thai
    const describePattern = (pattern: string): string => {
        const parsed = parseRegexToPattern(pattern);
        if (!parsed) return pattern;

        const caseText = !parsed.caseSensitive ? " (ไม่สนใจตัวพิมพ์)" : "";

        switch (parsed.matchType) {
            case "starts_with":
                return `เริ่มต้นด้วย "${parsed.value}"${caseText}`;
            case "ends_with":
                return `ลงท้ายด้วย "${parsed.value}"${caseText}`;
            case "contains":
                return `มีคำว่า "${parsed.value}"${caseText}`;
            case "exact":
                return `ตรงกับ "${parsed.value}"${caseText}`;
            case "regex":
                return `Regex: ${parsed.value}`;
            default:
                return pattern;
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container-main section-padding">
                {/* Back button */}
                <div className="mb-6">
                    <Button href="/forms" variant="secondary" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        กลับ
                    </Button>
                </div>

                {/* Header */}
                <div className="bg-background border border-border-default rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Settings className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-h3 text-foreground">
                                    กฎการตรวจจับประเภทช่อง
                                </h1>
                                <p className="text-body-sm text-text-muted">
                                    กำหนดกฎสำหรับตรวจจับและกำหนดประเภทช่องอัตโนมัติจากชื่อ placeholder
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {activeTab === "entity" && (
                                <>
                                    <Button variant="secondary" size="sm" onClick={handleInitializeEntityDefaults}>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        สร้าง Entity เริ่มต้น
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={handleCreateEntityRule}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        เพิ่ม Entity ใหม่
                                    </Button>
                                </>
                            )}
                            {activeTab === "datatype" && (
                                <>
                                    <Button variant="secondary" size="sm" onClick={handleInitializeDataTypeDefaults}>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        สร้างเริ่มต้น
                                    </Button>
                                    <Button variant="primary" size="sm" onClick={handleCreateDataType}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        เพิ่ม Data Type
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mt-6 border-t border-border-default pt-4">
                        <button
                            onClick={() => setActiveTab("datatype")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                activeTab === "datatype"
                                    ? "bg-primary text-white"
                                    : "bg-surface-alt text-text-muted hover:bg-surface-alt/80"
                            }`}
                        >
                            <Database className="w-4 h-4" />
                            ประเภทข้อมูล ({configurableDataTypes.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("entity")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                activeTab === "entity"
                                    ? "bg-primary text-white"
                                    : "bg-surface-alt text-text-muted hover:bg-surface-alt/80"
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            กฎ Entity ({entityRules.length})
                        </button>
                    </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-6">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-body-sm text-red-700">{error}</p>
                        <button onClick={() => setError(null)} className="ml-auto text-red-500">×</button>
                    </div>
                )}
                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl mb-6">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <p className="text-body-sm text-green-700">{success}</p>
                    </div>
                )}

                {/* Entity Rules Tab Content */}
                {activeTab === "entity" && (
                    <div className="bg-background border border-border-default rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-border-default">
                            <h2 className="text-h4 text-foreground">
                                กฎ Entity ทั้งหมด ({entityRules.length})
                            </h2>
                            <p className="text-sm text-text-muted mt-1">
                                กำหนดว่า placeholder ใดเป็นของบุคคลประเภทใด (เช่น มารดา, บิดา, ผู้เกิด)
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : entityRules.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
                                <p className="text-text-muted">ยังไม่มีกฎ Entity</p>
                                <Button variant="primary" size="sm" className="mt-4" onClick={handleInitializeEntityDefaults}>
                                    สร้างกฎ Entity เริ่มต้น
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-default">
                                {entityRules.map((rule) => (
                                    <div key={rule.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: rule.color ? `${rule.color}20` : "#f3f4f6" }}
                                                >
                                                    <span
                                                        className="text-lg"
                                                        style={{ color: rule.color || "#6b7280" }}
                                                    >
                                                        {rule.icon || "👤"}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-foreground">
                                                            {rule.name}
                                                        </span>
                                                        <code className="text-xs bg-surface-alt px-2 py-0.5 rounded">
                                                            {rule.code}
                                                        </code>
                                                        <span className={`px-2 py-0.5 text-xs rounded ${
                                                            rule.is_active
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-gray-100 text-gray-500"
                                                        }`}>
                                                            {rule.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                                        </span>
                                                        <span
                                                            className="w-4 h-4 rounded-full border"
                                                            style={{ backgroundColor: rule.color || "#6b7280" }}
                                                            title={`สี: ${rule.color}`}
                                                        />
                                                    </div>
                                                    <p className="text-sm text-text-muted mt-1">
                                                        Pattern: <code className="bg-surface-alt px-1 rounded">{rule.pattern}</code>
                                                    </p>
                                                    {rule.description && (
                                                        <p className="text-xs text-text-muted mt-0.5">{rule.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className="text-xs text-text-muted">
                                                    Priority: {rule.priority}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleEntityActive(rule)}
                                                    className={`p-2 rounded-lg ${
                                                        rule.is_active
                                                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                                                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                    }`}
                                                    title={rule.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditEntityRule(rule)}
                                                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                    title="แก้ไข"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteEntityRule(rule.id)}
                                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                                                    title="ลบ"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Data Types Tab Content */}
                {activeTab === "datatype" && (
                    <div className="bg-background border border-border-default rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-border-default">
                            <h2 className="text-h4 text-foreground">
                                ประเภทข้อมูลทั้งหมด ({configurableDataTypes.length})
                            </h2>
                            <p className="text-sm text-text-muted mt-1">
                                กำหนดประเภทข้อมูลที่สามารถใช้กับกฎการตรวจจับช่อง
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : configurableDataTypes.length === 0 ? (
                            <div className="text-center py-12">
                                <Database className="w-12 h-12 text-text-muted mx-auto mb-4" />
                                <p className="text-text-muted">ยังไม่มี Data Type</p>
                                <Button variant="primary" size="sm" className="mt-4" onClick={handleInitializeDataTypeDefaults}>
                                    สร้าง Data Type เริ่มต้น
                                </Button>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-default">
                                {configurableDataTypes.map((dt) => (
                                    <div key={dt.id} className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 flex-shrink-0">
                                                    <Database className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-foreground">
                                                            {dt.name}
                                                        </span>
                                                        <code className="text-xs bg-surface-alt px-2 py-0.5 rounded">
                                                            {dt.code}
                                                        </code>
                                                        <span className={`px-2 py-0.5 text-xs rounded ${
                                                            dt.is_active
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-gray-100 text-gray-500"
                                                        }`}>
                                                            {dt.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-text-muted mt-1">
                                                        Input: <code className="bg-surface-alt px-1 rounded">{dt.input_type}</code>
                                                        {dt.description && <span className="ml-2">- {dt.description}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className="text-xs text-text-muted">
                                                    Priority: {dt.priority}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleDataTypeActive(dt)}
                                                    className={`p-2 rounded-lg ${
                                                        dt.is_active
                                                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                                                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                    }`}
                                                    title={dt.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditDataType(dt)}
                                                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200"
                                                    title="แก้ไข"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDataType(dt.id)}
                                                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                                                    title="ลบ"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Create/Edit Field Rule Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-border-default">
                                <h2 className="text-h4 text-foreground">
                                    {editingRule ? "แก้ไขกฎ" : "เพิ่มกฎใหม่"}
                                </h2>
                            </div>

                            {/* Quick Patterns for new rules */}
                            {!editingRule && showQuickPatterns && (
                                <div className="p-6 border-b border-border-default bg-surface-alt">
                                    <h3 className="text-sm font-medium text-foreground mb-3">เลือกจากรูปแบบที่ใช้บ่อย:</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {QUICK_PATTERNS.map((qp, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleQuickPatternSelect(qp)}
                                                className="p-3 text-left rounded-lg border border-border-default hover:border-primary hover:bg-primary/5 transition-all"
                                            >
                                                <div className="font-medium text-sm text-foreground">{qp.label}</div>
                                                <div className="text-xs text-text-muted mt-0.5">{qp.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setShowQuickPatterns(false)}
                                        className="mt-3 text-sm text-primary hover:underline"
                                    >
                                        หรือสร้างกฎเอง →
                                    </button>
                                </div>
                            )}

                            <div className="p-6 space-y-4">
                                <Input
                                    label="ชื่อกฎ *"
                                    type="text"
                                    placeholder="เช่น ช่องวันที่, เลขบัตรประชาชน"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                                <Input
                                    label="คำอธิบาย"
                                    type="text"
                                    placeholder="อธิบายว่ากฎนี้จับคู่กับอะไร"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />

                                {/* Pattern Builder */}
                                <PatternBuilder
                                    pattern={formData.pattern}
                                    onChange={handlePatternChange}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Priority (ลำดับความสำคัญ)"
                                        type="number"
                                        value={formData.priority.toString()}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-foreground">สถานะ</label>
                                        <label className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">เปิดใช้งาน</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-foreground">ประเภทข้อมูล</label>
                                        <select
                                            value={formData.data_type}
                                            onChange={(e) => setFormData({ ...formData, data_type: e.target.value })}
                                            className="w-full p-2.5 text-sm border border-border-default rounded-xl bg-background"
                                        >
                                            {configurableDataTypes.length > 0
                                                ? configurableDataTypes.filter(dt => dt.is_active).map((dt) => (
                                                    <option key={dt.code} value={dt.code}>{dt.name}</option>
                                                ))
                                                : dataTypes.map((dt) => (
                                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-foreground">ประเภท Input</label>
                                        <select
                                            value={formData.input_type}
                                            onChange={(e) => setFormData({ ...formData, input_type: e.target.value })}
                                            className="w-full p-2.5 text-sm border border-border-default rounded-xl bg-background"
                                        >
                                            {configurableInputTypes.length > 0
                                                ? configurableInputTypes.filter(it => it.is_active).map((it) => (
                                                    <option key={it.code} value={it.code}>{it.name}</option>
                                                ))
                                                : inputTypes.map((it) => (
                                                    <option key={it.value} value={it.value}>{it.label}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>

                                <Input
                                    label="ชื่อกลุ่ม (Group Name)"
                                    type="text"
                                    placeholder="เช่น dates, addresses (ว่างไว้ถ้าไม่ต้องการจัดกลุ่ม)"
                                    value={formData.group_name}
                                    onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                                />
                            </div>
                            <div className="p-6 border-t border-border-default flex justify-end gap-3">
                                <Button variant="secondary" onClick={() => setShowModal(false)}>
                                    ยกเลิก
                                </Button>
                                <Button variant="primary" onClick={handleSave} disabled={saving}>
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : null}
                                    {editingRule ? "บันทึก" : "สร้าง"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit Entity Rule Modal */}
                {showEntityModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-border-default">
                                <h2 className="text-h4 text-foreground">
                                    {editingEntityRule ? "แก้ไขกฎ Entity" : "เพิ่มกฎ Entity ใหม่"}
                                </h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="ชื่อ Entity (ภาษาไทย) *"
                                        type="text"
                                        placeholder="เช่น มารดา, บิดา, ผู้เกิด"
                                        value={entityFormData.name}
                                        onChange={(e) => setEntityFormData({ ...entityFormData, name: e.target.value })}
                                    />
                                    <Input
                                        label="รหัส (Code) *"
                                        type="text"
                                        placeholder="เช่น mother, father, child"
                                        value={entityFormData.code}
                                        onChange={(e) => setEntityFormData({ ...entityFormData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                                    />
                                </div>

                                <Input
                                    label="คำอธิบาย"
                                    type="text"
                                    placeholder="อธิบายว่า Entity นี้คืออะไร"
                                    value={entityFormData.description}
                                    onChange={(e) => setEntityFormData({ ...entityFormData, description: e.target.value })}
                                />

                                {/* Pattern Builder for Entity */}
                                <PatternBuilder
                                    pattern={entityFormData.pattern}
                                    onChange={(pattern) => setEntityFormData({ ...entityFormData, pattern })}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Priority (ลำดับความสำคัญ)"
                                        type="number"
                                        value={entityFormData.priority.toString()}
                                        onChange={(e) => setEntityFormData({ ...entityFormData, priority: parseInt(e.target.value) || 0 })}
                                    />
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-foreground">สถานะ</label>
                                        <label className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                checked={entityFormData.is_active}
                                                onChange={(e) => setEntityFormData({ ...entityFormData, is_active: e.target.checked })}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm">เปิดใช้งาน</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Color Picker */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-foreground">สี Entity</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="color"
                                            value={entityFormData.color}
                                            onChange={(e) => setEntityFormData({ ...entityFormData, color: e.target.value })}
                                            className="w-12 h-10 rounded cursor-pointer border border-border-default"
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"].map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setEntityFormData({ ...entityFormData, color })}
                                                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                                        entityFormData.color === color ? "border-foreground scale-110" : "border-transparent"
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Preview */}
                                <div className="p-4 bg-surface-alt rounded-lg">
                                    <p className="text-sm text-text-muted mb-2">ตัวอย่าง:</p>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${entityFormData.color}20` }}
                                        >
                                            <span style={{ color: entityFormData.color }}>👤</span>
                                        </div>
                                        <div>
                                            <span className="font-medium">{entityFormData.name || "ชื่อ Entity"}</span>
                                            <code className="ml-2 text-xs bg-background px-2 py-0.5 rounded">
                                                {entityFormData.code || "code"}
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border-default flex justify-end gap-3">
                                <Button variant="secondary" onClick={() => setShowEntityModal(false)}>
                                    ยกเลิก
                                </Button>
                                <Button variant="primary" onClick={handleSaveEntityRule} disabled={saving}>
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : null}
                                    {editingEntityRule ? "บันทึก" : "สร้าง"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create/Edit Data Type Modal */}
                {showDataTypeModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-background rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-border-default">
                                <h2 className="text-h4 text-foreground">
                                    {editingDataType ? "แก้ไข Data Type" : "เพิ่ม Data Type ใหม่"}
                                </h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="รหัส (Code) *"
                                        type="text"
                                        placeholder="เช่น date, phone, email"
                                        value={dataTypeFormData.code}
                                        onChange={(e) => setDataTypeFormData({ ...dataTypeFormData, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                                    />
                                    <Input
                                        label="ชื่อ (ภาษาไทย) *"
                                        type="text"
                                        placeholder="เช่น วันที่, เบอร์โทรศัพท์"
                                        value={dataTypeFormData.name}
                                        onChange={(e) => setDataTypeFormData({ ...dataTypeFormData, name: e.target.value })}
                                    />
                                </div>

                                <Input
                                    label="คำอธิบาย"
                                    type="text"
                                    placeholder="อธิบายว่า Data Type นี้คืออะไร"
                                    value={dataTypeFormData.description}
                                    onChange={(e) => setDataTypeFormData({ ...dataTypeFormData, description: e.target.value })}
                                />

                                {/* Pattern Builder for Data Type */}
                                <PatternBuilder
                                    pattern={dataTypeFormData.pattern}
                                    onChange={(pattern) => setDataTypeFormData({ ...dataTypeFormData, pattern })}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-foreground">Input Type เริ่มต้น</label>
                                        <select
                                            value={dataTypeFormData.input_type}
                                            onChange={(e) => setDataTypeFormData({ ...dataTypeFormData, input_type: e.target.value })}
                                            className="w-full p-2.5 text-sm border border-border-default rounded-xl bg-background"
                                        >
                                            {configurableInputTypes.length > 0 ? (
                                                configurableInputTypes.map((it) => (
                                                    <option key={it.code} value={it.code}>{it.name}</option>
                                                ))
                                            ) : (
                                                <>
                                                    <option value="text">Text Input</option>
                                                    <option value="select">Dropdown Select</option>
                                                    <option value="date">Date Picker</option>
                                                    <option value="time">Time Picker</option>
                                                    <option value="number">Number Input</option>
                                                    <option value="textarea">Text Area</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                    <Input
                                        label="Priority"
                                        type="number"
                                        value={dataTypeFormData.priority.toString()}
                                        onChange={(e) => setDataTypeFormData({ ...dataTypeFormData, priority: parseInt(e.target.value) || 0 })}
                                    />
                                </div>

                                {/* Options field - shown when input type is select */}
                                {dataTypeFormData.input_type === "select" && (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-foreground">
                                            ตัวเลือก Dropdown
                                            <span className="text-text-muted font-normal ml-2">(หนึ่งตัวเลือกต่อบรรทัด)</span>
                                        </label>
                                        <textarea
                                            value={dataTypeFormData.options}
                                            onChange={(e) => setDataTypeFormData({ ...dataTypeFormData, options: e.target.value })}
                                            placeholder={"เช่น:\nนาย\nนาง\nนางสาว\nเด็กชาย\nเด็กหญิง"}
                                            rows={6}
                                            className="w-full p-2.5 text-sm border border-border-default rounded-xl bg-background resize-y font-mono"
                                        />
                                        <p className="text-xs text-text-muted mt-1">
                                            กรอกตัวเลือกแต่ละรายการในบรรทัดใหม่ ตัวเลือกเหล่านี้จะแสดงใน dropdown เมื่อใช้งาน
                                        </p>
                                    </div>
                                )}

                                <Input
                                    label="ค่าเริ่มต้น (Default Value)"
                                    type="text"
                                    placeholder="ค่าที่จะแสดงโดยอัตโนมัติเมื่อกรอกฟอร์ม"
                                    value={dataTypeFormData.default_value}
                                    onChange={(e) => setDataTypeFormData({ ...dataTypeFormData, default_value: e.target.value })}
                                />

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-foreground">สถานะ</label>
                                    <label className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            checked={dataTypeFormData.is_active}
                                            onChange={(e) => setDataTypeFormData({ ...dataTypeFormData, is_active: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">เปิดใช้งาน</span>
                                    </label>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border-default flex justify-end gap-3">
                                <Button variant="secondary" onClick={() => setShowDataTypeModal(false)}>
                                    ยกเลิก
                                </Button>
                                <Button variant="primary" onClick={handleSaveDataType} disabled={saving}>
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : null}
                                    {editingDataType ? "บันทึก" : "สร้าง"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
