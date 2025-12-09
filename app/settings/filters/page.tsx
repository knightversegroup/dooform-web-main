"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronDown, ChevronUp, GripVertical, Loader2, Check, X, Settings } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { FilterCategory, FilterOption } from "@/lib/api/types";

export default function FilterSettingsPage() {
    const [categories, setCategories] = useState<FilterCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Edit states
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editingOption, setEditingOption] = useState<string | null>(null);

    // New category form
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategory, setNewCategory] = useState({
        code: "",
        name: "",
        name_en: "",
        field_name: "",
        description: "",
    });

    // New option form
    const [showNewOption, setShowNewOption] = useState<string | null>(null);
    const [newOption, setNewOption] = useState({
        value: "",
        label: "",
        label_en: "",
        description: "",
        color: "",
    });

    // Load categories
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiClient.getFilterCategories();
            setCategories(data);
        } catch (err) {
            console.error("Failed to load filter categories:", err);
            setError(err instanceof Error ? err.message : "Failed to load filter categories");
        } finally {
            setLoading(false);
        }
    };

    // Create category
    const handleCreateCategory = async () => {
        if (!newCategory.code || !newCategory.name || !newCategory.field_name) {
            alert("กรุณากรอก Code, ชื่อ และ Field Name");
            return;
        }

        try {
            await apiClient.createFilterCategory(newCategory);
            setShowNewCategory(false);
            setNewCategory({ code: "", name: "", name_en: "", field_name: "", description: "" });
            await loadCategories();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create category");
        }
    };

    // Update category
    const handleUpdateCategory = async (id: string, data: Partial<FilterCategory>) => {
        try {
            await apiClient.updateFilterCategory(id, data);
            setEditingCategory(null);
            await loadCategories();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update category");
        }
    };

    // Delete category
    const handleDeleteCategory = async (id: string, isSystem: boolean) => {
        if (isSystem) {
            alert("ไม่สามารถลบ System filter ได้");
            return;
        }

        if (!confirm("คุณต้องการลบ Filter Category นี้หรือไม่?")) return;

        try {
            await apiClient.deleteFilterCategory(id);
            await loadCategories();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete category");
        }
    };

    // Create option
    const handleCreateOption = async (categoryId: string) => {
        if (!newOption.value || !newOption.label) {
            alert("กรุณากรอก Value และ Label");
            return;
        }

        try {
            await apiClient.createFilterOption({
                filter_category_id: categoryId,
                ...newOption,
            });
            setShowNewOption(null);
            setNewOption({ value: "", label: "", label_en: "", description: "", color: "" });
            await loadCategories();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create option");
        }
    };

    // Update option
    const handleUpdateOption = async (id: string, data: Partial<FilterOption>) => {
        try {
            await apiClient.updateFilterOption(id, data);
            setEditingOption(null);
            await loadCategories();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update option");
        }
    };

    // Delete option
    const handleDeleteOption = async (id: string) => {
        if (!confirm("คุณต้องการลบตัวเลือกนี้หรือไม่?")) return;

        try {
            await apiClient.deleteFilterOption(id);
            await loadCategories();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete option");
        }
    };

    // Toggle option active status
    const handleToggleOptionActive = async (option: FilterOption) => {
        await handleUpdateOption(option.id, { is_active: !option.is_active });
    };

    // Toggle category active status
    const handleToggleCategoryActive = async (category: FilterCategory) => {
        await handleUpdateCategory(category.id, { is_active: !category.is_active });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#007398] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/forms"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">จัดการตัวกรอง</h1>
                            <p className="text-sm text-gray-500">เพิ่ม แก้ไข หรือลบตัวกรองสำหรับค้นหาเทมเพลต</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Add New Category Button */}
                <div className="mb-6">
                    {!showNewCategory ? (
                        <button
                            onClick={() => setShowNewCategory(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white rounded-lg text-sm font-medium hover:bg-[#005f7a] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            เพิ่มหมวดตัวกรองใหม่
                        </button>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">เพิ่มหมวดตัวกรองใหม่</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Code *</label>
                                    <input
                                        type="text"
                                        value={newCategory.code}
                                        onChange={(e) => setNewCategory({ ...newCategory, code: e.target.value })}
                                        placeholder="e.g., department"
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Field Name *</label>
                                    <input
                                        type="text"
                                        value={newCategory.field_name}
                                        onChange={(e) => setNewCategory({ ...newCategory, field_name: e.target.value })}
                                        placeholder="e.g., department"
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">ชื่อ (ไทย) *</label>
                                    <input
                                        type="text"
                                        value={newCategory.name}
                                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                        placeholder="e.g., แผนก"
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">ชื่อ (English)</label>
                                    <input
                                        type="text"
                                        value={newCategory.name_en}
                                        onChange={(e) => setNewCategory({ ...newCategory, name_en: e.target.value })}
                                        placeholder="e.g., Department"
                                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398]"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowNewCategory(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleCreateCategory}
                                    className="px-4 py-2 bg-[#007398] text-white rounded text-sm hover:bg-[#005f7a] transition-colors"
                                >
                                    สร้าง
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Categories List */}
                <div className="space-y-4">
                    {categories.map((category) => (
                        <div key={category.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            {/* Category Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setExpandedCategory(
                                            expandedCategory === category.id ? null : category.id
                                        )}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        {expandedCategory === category.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        )}
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{category.name}</span>
                                            {category.name_en && (
                                                <span className="text-sm text-gray-500">({category.name_en})</span>
                                            )}
                                            {category.is_system && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                                    System
                                                </span>
                                            )}
                                            {!category.is_active && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                                                    ปิดใช้งาน
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            code: {category.code} | field: {category.field_name} | {category.options?.length || 0} ตัวเลือก
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleCategoryActive(category)}
                                        className={`px-3 py-1 text-xs rounded ${
                                            category.is_active
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}
                                    >
                                        {category.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                    </button>
                                    {!category.is_system && (
                                        <button
                                            onClick={() => handleDeleteCategory(category.id, category.is_system)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Options List */}
                            {expandedCategory === category.id && (
                                <div className="p-4 bg-gray-50">
                                    {/* Add Option Button */}
                                    {showNewOption !== category.id ? (
                                        <button
                                            onClick={() => setShowNewOption(category.id)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#007398] hover:bg-white rounded border border-dashed border-gray-300 mb-4"
                                        >
                                            <Plus className="w-3 h-3" />
                                            เพิ่มตัวเลือก
                                        </button>
                                    ) : (
                                        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Value *</label>
                                                    <input
                                                        type="text"
                                                        value={newOption.value}
                                                        onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                                                        placeholder="e.g., sales"
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Label (ไทย) *</label>
                                                    <input
                                                        type="text"
                                                        value={newOption.label}
                                                        onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                                                        placeholder="e.g., ฝ่ายขาย"
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Label (English)</label>
                                                    <input
                                                        type="text"
                                                        value={newOption.label_en}
                                                        onChange={(e) => setNewOption({ ...newOption, label_en: e.target.value })}
                                                        placeholder="e.g., Sales"
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">สี (Hex)</label>
                                                    <input
                                                        type="text"
                                                        value={newOption.color}
                                                        onChange={(e) => setNewOption({ ...newOption, color: e.target.value })}
                                                        placeholder="e.g., #007398"
                                                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#007398]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setShowNewOption(null)}
                                                    className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                                                >
                                                    ยกเลิก
                                                </button>
                                                <button
                                                    onClick={() => handleCreateOption(category.id)}
                                                    className="px-3 py-1 bg-[#007398] text-white rounded text-xs hover:bg-[#005f7a]"
                                                >
                                                    เพิ่ม
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Options */}
                                    <div className="space-y-2">
                                        {category.options?.map((option) => (
                                            <div
                                                key={option.id}
                                                className={`flex items-center justify-between p-3 bg-white rounded border ${
                                                    option.is_active ? "border-gray-200" : "border-gray-100 opacity-60"
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <GripVertical className="w-4 h-4 text-gray-300" />
                                                    {option.color && (
                                                        <div
                                                            className="w-4 h-4 rounded-full border border-gray-200"
                                                            style={{ backgroundColor: option.color }}
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {option.label}
                                                            </span>
                                                            {option.label_en && (
                                                                <span className="text-xs text-gray-500">
                                                                    ({option.label_en})
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            value: {option.value}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleToggleOptionActive(option)}
                                                        className={`p-1 rounded ${
                                                            option.is_active
                                                                ? "text-green-600 hover:bg-green-50"
                                                                : "text-gray-400 hover:bg-gray-100"
                                                        }`}
                                                        title={option.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                                    >
                                                        {option.is_active ? (
                                                            <Check className="w-4 h-4" />
                                                        ) : (
                                                            <X className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOption(option.id)}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {(!category.options || category.options.length === 0) && (
                                            <div className="text-center py-4 text-sm text-gray-500">
                                                ยังไม่มีตัวเลือก
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {categories.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                            <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">ยังไม่มีหมวดตัวกรอง</p>
                            <button
                                onClick={async () => {
                                    try {
                                        await apiClient.initializeDefaultFilters();
                                        await loadCategories();
                                    } catch (err) {
                                        alert(err instanceof Error ? err.message : "Failed to initialize filters");
                                    }
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#007398] text-white rounded-lg text-sm hover:bg-[#005f7a] transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                สร้างตัวกรองเริ่มต้น
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
