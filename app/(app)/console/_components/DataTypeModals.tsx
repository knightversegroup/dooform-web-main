"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { ConfigurableDataType } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { INPUT_TYPE_OPTIONS, LOCATION_OUTPUT_FORMAT_OPTIONS } from "./constants";
import { parseOptionsToLines, linesToOptionsString } from "./utils";
import { DigitFormatBuilder } from "./DigitFormatBuilder";

// ============================================================================
// Create Modal Component
// ============================================================================

interface CreateDataTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDataTypeModal({ isOpen, onClose, onSuccess }: CreateDataTypeModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    input_type: 'text',
    pattern: '',
    priority: 100,
    default_value: '',
    options: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      setError('Code and Name are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apiClient.createConfigurableDataType({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        input_type: formData.input_type,
        pattern: formData.pattern,
        priority: formData.priority,
        default_value: formData.default_value,
        options: linesToOptionsString(formData.options),
        is_active: true,
      });
      onSuccess();
      onClose();
      setFormData({
        code: '',
        name: '',
        description: '',
        input_type: 'text',
        pattern: '',
        priority: 100,
        default_value: '',
        options: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create data type');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Data Type</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., location_province"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Location (Province)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Thai administrative boundary - Province level"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Input Type
              </label>
              <select
                value={formData.input_type}
                onChange={(e) => setFormData({ ...formData, input_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
              >
                {INPUT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
              />
            </div>
          </div>

          {formData.input_type === 'location' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Output Format
              </label>
              <select
                value={formData.default_value || 'district'}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm bg-white"
              >
                {LOCATION_OUTPUT_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-blue-600">
                Output: {LOCATION_OUTPUT_FORMAT_OPTIONS.find(o => o.value === (formData.default_value || 'district'))?.description}
              </p>
            </div>
          )}

          {formData.input_type === 'digit' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="block text-sm font-medium text-amber-800 mb-2">
                สร้างรูปแบบ Digit
              </label>
              <DigitFormatBuilder
                value={formData.default_value || ''}
                onChange={(value) => setFormData({ ...formData, default_value: value })}
              />
            </div>
          )}

          {formData.input_type === 'select' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <label className="block text-sm font-medium text-purple-800 mb-2">
                Dropdown Options
              </label>
              <textarea
                value={formData.options}
                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                placeholder="ชวด&#10;ฉลู&#10;ขาล&#10;เถาะ&#10;..."
                rows={5}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 text-sm bg-white"
              />
              <p className="mt-2 text-xs text-purple-600">
                ใส่ตัวเลือกแต่ละรายการ 1 บรรทัด (Enter each option on a new line)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pattern (Regex for auto-detection)
            </label>
            <input
              type="text"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              placeholder="e.g., (?i)(province|จังหวัด)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">
              Regex pattern to auto-detect this data type from placeholder names
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Data Type'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Edit Modal Component
// ============================================================================

interface EditDataTypeModalProps {
  isOpen: boolean;
  dataType: ConfigurableDataType | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditDataTypeModal({ isOpen, dataType, onClose, onSuccess }: EditDataTypeModalProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    input_type: 'text',
    pattern: '',
    priority: 100,
    is_active: true,
    default_value: '',
    options: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dataType) {
      setFormData({
        code: dataType.code || '',
        name: dataType.name || '',
        description: dataType.description || '',
        input_type: dataType.input_type || 'text',
        pattern: dataType.pattern || '',
        priority: dataType.priority || 100,
        is_active: dataType.is_active !== false,
        default_value: dataType.default_value || '',
        options: parseOptionsToLines(dataType.options || ''),
      });
    }
  }, [dataType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataType) return;
    if (!formData.code || !formData.name) {
      setError('Code and Name are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await apiClient.updateConfigurableDataType(dataType.id, {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        input_type: formData.input_type,
        pattern: formData.pattern,
        priority: formData.priority,
        is_active: formData.is_active,
        default_value: formData.default_value,
        options: linesToOptionsString(formData.options),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update data type');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !dataType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Edit Data Type</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., location_province"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Location (Province)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Thai administrative boundary - Province level"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Input Type
              </label>
              <select
                value={formData.input_type}
                onChange={(e) => setFormData({ ...formData, input_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
              >
                {INPUT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm"
              />
            </div>
          </div>

          {formData.input_type === 'location' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Output Format
              </label>
              <select
                value={formData.default_value || 'district'}
                onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm bg-white"
              >
                {LOCATION_OUTPUT_FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-blue-600">
                Output: {LOCATION_OUTPUT_FORMAT_OPTIONS.find(o => o.value === (formData.default_value || 'district'))?.description}
              </p>
            </div>
          )}

          {formData.input_type === 'digit' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <label className="block text-sm font-medium text-amber-800 mb-2">
                สร้างรูปแบบ Digit
              </label>
              <DigitFormatBuilder
                value={formData.default_value || ''}
                onChange={(value) => setFormData({ ...formData, default_value: value })}
              />
            </div>
          )}

          {formData.input_type === 'select' && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <label className="block text-sm font-medium text-purple-800 mb-2">
                Dropdown Options
              </label>
              <textarea
                value={formData.options}
                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                placeholder="ชวด&#10;ฉลู&#10;ขาล&#10;เถาะ&#10;..."
                rows={5}
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 text-sm bg-white"
              />
              <p className="mt-2 text-xs text-purple-600">
                ใส่ตัวเลือกแต่ละรายการ 1 บรรทัด (Enter each option on a new line)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pattern (Regex for auto-detection)
            </label>
            <input
              type="text"
              value={formData.pattern}
              onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
              placeholder="e.g., (?i)(province|จังหวัด)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 text-sm font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">
              Regex pattern to auto-detect this data type from placeholder names
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active_edit" className="text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
