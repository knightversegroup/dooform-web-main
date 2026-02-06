"use client";

import {
  Database,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ConfigurableDataType } from "@/lib/api/types";

interface DataTypesContentProps {
  dataTypes: ConfigurableDataType[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function DataTypesContent({
  dataTypes,
  expandedItems,
  onToggleExpand,
  onDelete,
  onEdit,
}: DataTypesContentProps) {
  if (dataTypes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No data types configured</p>
        <p className="text-sm mt-1">Click &quot;Initialize Defaults&quot; to add standard data types</p>
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
