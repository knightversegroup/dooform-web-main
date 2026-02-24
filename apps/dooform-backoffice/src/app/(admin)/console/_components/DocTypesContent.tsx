"use client";

import {
  FileType,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Wand2,
} from "lucide-react";
import { DocumentType, Template, SuggestedGroup } from "@dooform/shared/api/types";

interface DocTypesContentProps {
  documentTypes: DocumentType[];
  templates: Template[];
  suggestions: SuggestedGroup[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function DocTypesContent({
  documentTypes,
  templates,
  suggestions,
  expandedItems,
  onToggleExpand,
  onDelete,
  onEdit,
}: DocTypesContentProps) {
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
        <p className="text-sm mt-1">Upload templates and use &quot;Auto-group&quot; to organize them</p>
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
