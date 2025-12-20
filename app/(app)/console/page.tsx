"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Database,
  Users,
  Filter,
  FileType,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Settings,
  X,
  GripVertical,
  Wand2,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import {
  EntityRule,
  ConfigurableDataType,
  FilterCategory,
  FilterOption,
  DocumentType,
  Template,
  SuggestedGroup,
} from "@/lib/api/types";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { useAuth } from "@/lib/auth/context";

// Tab types
type ConsoleTab = "datatypes" | "entities" | "filters" | "doctypes";

interface TabConfig {
  id: ConsoleTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "datatypes",
    label: "ประเภทข้อมูล",
    icon: Database,
    description: "กำหนดประเภทข้อมูลและการตรวจจับอัตโนมัติ",
  },
  {
    id: "entities",
    label: "เอนทิตี้",
    icon: Users,
    description: "จัดการกฎการจำแนกเอนทิตี้",
  },
  {
    id: "filters",
    label: "ตัวกรอง",
    icon: Filter,
    description: "ตั้งค่าตัวกรองสำหรับค้นหาเทมเพลต",
  },
  {
    id: "doctypes",
    label: "ประเภทเอกสาร",
    icon: FileType,
    description: "จัดกลุ่มเทมเพลตตามประเภทเอกสาร",
  },
];

export default function ConsolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Tab state - read from URL or default to datatypes
  const tabFromUrl = searchParams.get("tab") as ConsoleTab | null;
  const validTabs: ConsoleTab[] = ["datatypes", "entities", "filters", "doctypes"];
  const initialTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "datatypes";
  const [activeTab, setActiveTab] = useState<ConsoleTab>(initialTab);

  // Update URL when tab changes
  const handleTabChange = (tab: ConsoleTab) => {
    setActiveTab(tab);
    router.push(`/console?tab=${tab}`, { scroll: false });
  };

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [dataTypes, setDataTypes] = useState<ConfigurableDataType[]>([]);
  const [entityRules, setEntityRules] = useState<EntityRule[]>([]);
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedGroup[]>([]);

  // UI states
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/console");
    }
  }, [authLoading, isAuthenticated, router]);

  // Load data for current tab
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        switch (activeTab) {
          case "datatypes":
            const types = await apiClient.getConfigurableDataTypes();
            setDataTypes(types);
            break;
          case "entities":
            const entities = await apiClient.getEntityRules();
            setEntityRules(entities);
            break;
          case "filters":
            const filters = await apiClient.getFilterCategories();
            setFilterCategories(filters);
            break;
          case "doctypes":
            const [docTypes, templatesRes] = await Promise.all([
              apiClient.getDocumentTypes(),
              apiClient.getAllTemplates(),
            ]);
            setDocumentTypes(docTypes);
            setTemplates(templatesRes.templates || []);
            break;
        }
      } catch (err) {
        console.error(`Failed to load ${activeTab}:`, err);
        setError(`Failed to load data: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, authLoading, isAuthenticated]);

  // Toggle expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Initialize defaults
  const handleInitializeDefaults = async () => {
    setProcessingAction(true);
    setError(null);
    try {
      switch (activeTab) {
        case "datatypes":
          await apiClient.initializeDefaultDataTypes();
          const types = await apiClient.getConfigurableDataTypes();
          setDataTypes(types);
          setSuccess("Initialized default data types");
          break;
        case "entities":
          await apiClient.initializeDefaultEntityRules();
          const entities = await apiClient.getEntityRules();
          setEntityRules(entities);
          setSuccess("Initialized default entity rules");
          break;
        case "filters":
          await apiClient.initializeDefaultFilters();
          const filters = await apiClient.getFilterCategories();
          setFilterCategories(filters);
          setSuccess("Initialized default filters");
          break;
      }
    } catch (err) {
      setError(`Failed to initialize: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProcessingAction(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Delete item
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setProcessingAction(true);
    setError(null);
    try {
      switch (activeTab) {
        case "datatypes":
          await apiClient.deleteDataType(id);
          setDataTypes((prev) => prev.filter((item) => item.id !== id));
          break;
        case "entities":
          await apiClient.deleteEntityRule(id);
          setEntityRules((prev) => prev.filter((item) => item.id !== id));
          break;
        case "filters":
          await apiClient.deleteFilterCategory(id);
          setFilterCategories((prev) => prev.filter((item) => item.id !== id));
          break;
        case "doctypes":
          await apiClient.deleteDocumentType(id);
          setDocumentTypes((prev) => prev.filter((item) => item.id !== id));
          break;
      }
      setSuccess("Item deleted successfully");
    } catch (err) {
      setError(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProcessingAction(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Auto-group templates (for doctypes tab)
  const handleAutoGroup = async () => {
    setProcessingAction(true);
    setError(null);
    try {
      const suggestionsRes = await apiClient.getAutoGroupSuggestions();
      setSuggestions(suggestionsRes);
      setSuccess(`Found ${suggestionsRes.length} grouping suggestions`);
    } catch (err) {
      setError(`Failed to get suggestions: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProcessingAction(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Render content based on tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      );
    }

    switch (activeTab) {
      case "datatypes":
        return (
          <DataTypesContent
            dataTypes={dataTypes}
            expandedItems={expandedItems}
            onToggleExpand={toggleExpand}
            onDelete={handleDelete}
            onEdit={(id) => setEditingItem(id)}
          />
        );
      case "entities":
        return (
          <EntitiesContent
            entityRules={entityRules}
            expandedItems={expandedItems}
            onToggleExpand={toggleExpand}
            onDelete={handleDelete}
            onEdit={(id) => setEditingItem(id)}
          />
        );
      case "filters":
        return (
          <FiltersContent
            filterCategories={filterCategories}
            expandedItems={expandedItems}
            onToggleExpand={toggleExpand}
            onDelete={handleDelete}
            onEdit={(id) => setEditingItem(id)}
          />
        );
      case "doctypes":
        return (
          <DocTypesContent
            documentTypes={documentTypes}
            templates={templates}
            suggestions={suggestions}
            expandedItems={expandedItems}
            onToggleExpand={toggleExpand}
            onDelete={handleDelete}
            onEdit={(id) => setEditingItem(id)}
          />
        );
      default:
        return null;
    }
  };

  const currentTab = TABS.find((t) => t.id === activeTab);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Console</h1>
            <p className="text-sm text-gray-500">จัดการการตั้งค่าระบบทั้งหมด</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "text-blue-600 border-blue-600"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Description & Actions */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <p className="text-sm text-gray-500">{currentTab?.description}</p>
        <div className="flex items-center gap-2">
          {activeTab !== "doctypes" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInitializeDefaults}
              disabled={processingAction}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${processingAction ? "animate-spin" : ""}`} />
              Initialize Defaults
            </Button>
          )}
          {activeTab === "doctypes" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAutoGroup}
              disabled={processingAction}
            >
              <Wand2 className={`w-4 h-4 mr-2 ${processingAction ? "animate-spin" : ""}`} />
              Auto-group Templates
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>
    </div>
  );
}

// ============================================================================
// Content Components
// ============================================================================

function DataTypesContent({
  dataTypes,
  expandedItems,
  onToggleExpand,
  onDelete,
  onEdit,
}: {
  dataTypes: ConfigurableDataType[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  if (dataTypes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No data types configured</p>
        <p className="text-sm mt-1">Click "Initialize Defaults" to add standard data types</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dataTypes.map((dt) => (
        <div
          key={dt.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
            onClick={() => onToggleExpand(dt.id)}
          >
            {expandedItems.has(dt.id) ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{dt.name}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                  {dt.code}
                </span>
                {!dt.is_active && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                    Inactive
                  </span>
                )}
              </div>
              {dt.description && (
                <p className="text-sm text-gray-500 truncate">{dt.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(dt.id);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(dt.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {expandedItems.has(dt.id) && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Input Type:</span>{" "}
                  <span className="text-gray-900">{dt.input_type || "text"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Priority:</span>{" "}
                  <span className="text-gray-900">{dt.priority}</span>
                </div>
                {dt.pattern && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Pattern:</span>{" "}
                    <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">{dt.pattern}</code>
                  </div>
                )}
                {dt.options && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Options:</span>{" "}
                    <span className="text-gray-900">{dt.options}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EntitiesContent({
  entityRules,
  expandedItems,
  onToggleExpand,
  onDelete,
  onEdit,
}: {
  entityRules: EntityRule[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  if (entityRules.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No entity rules configured</p>
        <p className="text-sm mt-1">Click "Initialize Defaults" to add standard entities</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entityRules.map((rule) => (
        <div
          key={rule.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
            onClick={() => onToggleExpand(rule.id)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: rule.color || "#6B7280" }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{rule.name}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                  {rule.code}
                </span>
                {!rule.is_active && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                    Inactive
                  </span>
                )}
              </div>
              {rule.description && (
                <p className="text-sm text-gray-500 truncate">{rule.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(rule.id);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(rule.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {expandedItems.has(rule.id) && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">Pattern:</span>{" "}
                  <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">{rule.pattern}</code>
                </div>
                <div>
                  <span className="text-gray-500">Priority:</span>{" "}
                  <span className="text-gray-900">{rule.priority}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FiltersContent({
  filterCategories,
  expandedItems,
  onToggleExpand,
  onDelete,
  onEdit,
}: {
  filterCategories: FilterCategory[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  if (filterCategories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No filters configured</p>
        <p className="text-sm mt-1">Click "Initialize Defaults" to add standard filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filterCategories.map((category) => (
        <div
          key={category.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
            onClick={() => onToggleExpand(category.id)}
          >
            {expandedItems.has(category.id) ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{category.name}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                  {category.code}
                </span>
                {category.is_system && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                    System
                  </span>
                )}
                {!category.is_active && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-sm text-gray-500 truncate">{category.description}</p>
              )}
            </div>
            <span className="text-sm text-gray-400">
              {category.options?.length || 0} options
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category.id);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {!category.is_system && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(category.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {expandedItems.has(category.id) && category.options && (
            <div className="border-t border-gray-200">
              {category.options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <GripVertical className="w-4 h-4 text-gray-300" />
                  {option.color && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="flex-1 text-sm text-gray-700">{option.label}</span>
                  <span className="text-xs text-gray-400 font-mono">{option.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DocTypesContent({
  documentTypes,
  templates,
  suggestions,
  expandedItems,
  onToggleExpand,
  onDelete,
  onEdit,
}: {
  documentTypes: DocumentType[];
  templates: Template[];
  suggestions: SuggestedGroup[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  // Find orphan templates (not assigned to any document type)
  const assignedTemplateIds = new Set(
    documentTypes.flatMap((dt) => dt.templates?.map((t) => t.id) || [])
  );
  const orphanTemplates = templates.filter((t) => !assignedTemplateIds.has(t.id));

  if (documentTypes.length === 0 && orphanTemplates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileType className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No document types or templates</p>
        <p className="text-sm mt-1">Upload templates and use "Auto-group" to organize them</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">
            <Wand2 className="w-4 h-4 inline mr-2" />
            Auto-group Suggestions ({suggestions.length})
          </h3>
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-3 border border-yellow-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{suggestion.suggested_name}</span>
                  <span className="text-xs text-yellow-600">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {suggestion.templates.length} templates
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Types */}
      {documentTypes.map((docType) => (
        <div
          key={docType.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
            onClick={() => onToggleExpand(docType.id)}
          >
            {expandedItems.has(docType.id) ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: docType.color || "#6B7280" }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{docType.name}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {docType.category}
                </span>
              </div>
              {docType.description && (
                <p className="text-sm text-gray-500 truncate">{docType.description}</p>
              )}
            </div>
            <span className="text-sm text-gray-400">
              {docType.templates?.length || 0} templates
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(docType.id);
                }}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(docType.id);
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {expandedItems.has(docType.id) && docType.templates && (
            <div className="border-t border-gray-200">
              {docType.templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <FileType className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700">
                    {template.variant_name || template.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Orphan Templates */}
      {orphanTemplates.length > 0 && (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-3">
            Unassigned Templates ({orphanTemplates.length})
          </h3>
          <div className="space-y-1">
            {orphanTemplates.slice(0, 10).map((template) => (
              <div
                key={template.id}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <FileType className="w-4 h-4 text-gray-400" />
                {template.name}
              </div>
            ))}
            {orphanTemplates.length > 10 && (
              <p className="text-sm text-gray-500">
                ...and {orphanTemplates.length - 10} more
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
