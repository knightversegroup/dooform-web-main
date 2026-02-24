"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Settings,
  X,
  Wand2,
} from "lucide-react";
import { apiClient } from "@dooform/shared/api/client";
import {
  ConfigurableDataType,
  FilterCategory,
  DocumentType,
  Template,
  SuggestedGroup,
} from "@dooform/shared/api/types";
import { Button } from "@dooform/shared";
import { logger } from "@dooform/shared/utils/logger";

// Import from _components
import {
  TABS,
  ConsoleTab,
  DataTypesContent,
  FiltersContent,
  DocTypesContent,
  CreateDataTypeModal,
  EditDataTypeModal,
} from "./_components";

export default function ConsolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state - read from URL or default to datatypes
  const tabFromUrl = searchParams.get("tab") as ConsoleTab | null;
  const validTabs: ConsoleTab[] = ["datatypes", "filters", "doctypes"];
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
  const [filterCategories, setFilterCategories] = useState<FilterCategory[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedGroup[]>([]);

  // UI states
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Load data for current tab
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        switch (activeTab) {
          case "datatypes": {
            const types = await apiClient.getConfigurableDataTypes();
            setDataTypes(types);
            break;
          }
          case "filters": {
            const filters = await apiClient.getFilterCategories();
            setFilterCategories(filters);
            break;
          }
          case "doctypes": {
            const [docTypes, templatesRes] = await Promise.all([
              apiClient.getDocumentTypes(),
              apiClient.getAllTemplates(),
            ]);
            setDocumentTypes(docTypes);
            setTemplates(templatesRes.templates || []);
            break;
          }
        }
      } catch (err) {
        logger.error("ConsolePage", `Failed to load ${activeTab}:`, err);
        setError(`Failed to load data: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

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
        case "datatypes": {
          await apiClient.initializeDefaultDataTypes();
          const types = await apiClient.getConfigurableDataTypes();
          setDataTypes(types);
          setSuccess("Initialized default data types");
          break;
        }
        case "filters": {
          await apiClient.initializeDefaultFilters();
          const filters = await apiClient.getFilterCategories();
          setFilterCategories(filters);
          setSuccess("Initialized default filters");
          break;
        }
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
          await apiClient.deleteConfigurableDataType(id);
          setDataTypes((prev) => prev.filter((item) => item.id !== id));
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
      const suggestionsRes = await apiClient.getAutoSuggestions();
      setSuggestions(suggestionsRes);
      setSuccess(`Found ${suggestionsRes.length} grouping suggestions`);
    } catch (err) {
      setError(`Failed to get suggestions: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProcessingAction(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

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

      {/* Create Modal */}
      {activeTab === "datatypes" && (
        <CreateDataTypeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            const types = await apiClient.getConfigurableDataTypes();
            setDataTypes(types);
            setSuccess("Data type created successfully");
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}

      {/* Edit Modal */}
      {activeTab === "datatypes" && editingItem && (
        <EditDataTypeModal
          isOpen={!!editingItem}
          dataType={dataTypes.find(dt => dt.id === editingItem) || null}
          onClose={() => setEditingItem(null)}
          onSuccess={async () => {
            const types = await apiClient.getConfigurableDataTypes();
            setDataTypes(types);
            setSuccess("Data type updated successfully");
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
}
