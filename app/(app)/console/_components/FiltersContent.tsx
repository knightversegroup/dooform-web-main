"use client";

import {
  Filter,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { FilterCategory } from "@/lib/api/types";

interface FiltersContentProps {
  filterCategories: FilterCategory[];
  expandedItems: Set<string>;
  onToggleExpand: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export function FiltersContent({
  filterCategories,
  expandedItems,
  onToggleExpand,
  onDelete,
  onEdit,
}: FiltersContentProps) {
  if (filterCategories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No filters configured</p>
        <p className="text-sm mt-1">Click &quot;Initialize Defaults&quot; to add standard filters</p>
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
