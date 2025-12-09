'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';
import { DocumentType, DocumentTypeCategory, Template, TemplateAssignment, SuggestedGroup } from '@/lib/api/types';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileText,
  GripVertical,
  X,
  Check,
  Loader2,
  Sparkles,
  Wand2,
  ArrowRight,
} from 'lucide-react';

// Category labels in Thai
const categoryLabels: Record<string, string> = {
  identification: 'บัตรประจำตัว',
  certificate: 'ใบรับรอง',
  contract: 'สัญญา',
  application: 'แบบฟอร์มคำขอ',
  financial: 'เอกสารการเงิน',
  government: 'เอกสารราชการ',
  education: 'เอกสารการศึกษา',
  medical: 'เอกสารทางการแพทย์',
  other: 'อื่นๆ',
};

// Default colors for categories
const categoryColors: Record<string, string> = {
  identification: '#3B82F6',
  certificate: '#10B981',
  contract: '#F59E0B',
  application: '#8B5CF6',
  financial: '#EF4444',
  government: '#6366F1',
  education: '#EC4899',
  medical: '#14B8A6',
  other: '#6B7280',
};

export default function DocumentTypesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingSuggestion, setApplyingSuggestion] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);

  // Expanded document types
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Form state for create/edit
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_en: '',
    description: '',
    category: 'other' as DocumentTypeCategory,
    color: '#6B7280',
    sort_order: 0,
  });

  // Assignment state
  const [assignmentData, setAssignmentData] = useState<{
    templateId: string;
    variantName: string;
    variantOrder: number;
  }>({
    templateId: '',
    variantName: '',
    variantOrder: 0,
  });

  const [saving, setSaving] = useState(false);
  const [autoGrouping, setAutoGrouping] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [docTypesData, templatesData] = await Promise.all([
        apiClient.getDocumentTypes({ includeTemplates: true }),
        apiClient.getAllTemplates(),
      ]);

      setDocumentTypes(docTypesData);
      setTemplates(templatesData.templates || []);

      // Fetch auto-suggestions
      try {
        const suggestionsData = await apiClient.getAutoSuggestions();
        setSuggestions(suggestionsData);
      } catch (err) {
        console.error('Failed to load suggestions:', err);
        // Don't fail the whole page if suggestions fail
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/settings/document-types');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedTypes(newExpanded);
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      await apiClient.createDocumentType({
        code: formData.code,
        name: formData.name,
        name_en: formData.name_en,
        description: formData.description,
        category: formData.category,
        color: formData.color,
        sort_order: formData.sort_order,
      });

      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create document type');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedDocType) return;

    try {
      setSaving(true);
      await apiClient.updateDocumentType(selectedDocType.id, {
        code: formData.code,
        name: formData.name,
        name_en: formData.name_en,
        description: formData.description,
        category: formData.category,
        color: formData.color,
        sort_order: formData.sort_order,
      });

      setShowEditModal(false);
      setSelectedDocType(null);
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (docType: DocumentType) => {
    if (!confirm(`ต้องการลบประเภทเอกสาร "${docType.name}" หรือไม่?`)) return;

    try {
      await apiClient.deleteDocumentType(docType.id);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document type');
    }
  };

  const handleAssignTemplate = async () => {
    if (!selectedDocType || !assignmentData.templateId) return;

    try {
      setSaving(true);
      await apiClient.assignTemplateToDocumentType(
        selectedDocType.id,
        assignmentData.templateId,
        assignmentData.variantName,
        assignmentData.variantOrder
      );

      setShowAssignModal(false);
      setAssignmentData({ templateId: '', variantName: '', variantOrder: 0 });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign template');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignTemplate = async (docTypeId: string, templateId: string) => {
    if (!confirm('ต้องการยกเลิกการเชื่อมโยงเทมเพลตนี้หรือไม่?')) return;

    try {
      await apiClient.unassignTemplateFromDocumentType(docTypeId, templateId);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign template');
    }
  };

  const handleApplySuggestion = async (suggestion: SuggestedGroup) => {
    try {
      setApplyingSuggestion(suggestion.suggested_name);
      await apiClient.applySuggestion(suggestion);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply suggestion');
    } finally {
      setApplyingSuggestion(null);
    }
  };

  const handleAutoGroupAll = async () => {
    if (!confirm('จัดกลุ่มเทมเพลตทั้งหมดอัตโนมัติ?\n\nระบบจะวิเคราะห์ชื่อเทมเพลตและสร้างประเภทเอกสารโดยอัตโนมัติ')) return;

    try {
      setAutoGrouping(true);
      const result = await apiClient.autoGroupAllTemplates();
      alert(`จัดกลุ่มสำเร็จ! สร้างประเภทเอกสารใหม่ ${result.created_document_types.length} รายการ`);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-group templates');
    } finally {
      setAutoGrouping(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      name_en: '',
      description: '',
      category: 'other',
      color: '#6B7280',
      sort_order: 0,
    });
  };

  const openEditModal = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setFormData({
      code: docType.code,
      name: docType.name,
      name_en: docType.name_en || '',
      description: docType.description || '',
      category: docType.category || 'other',
      color: docType.color || '#6B7280',
      sort_order: docType.sort_order || 0,
    });
    setShowEditModal(true);
  };

  const openAssignModal = (docType: DocumentType) => {
    setSelectedDocType(docType);
    const assignedIds = new Set((docType.templates || []).map(t => t.id));
    const nextOrder = (docType.templates || []).length;
    setAssignmentData({
      templateId: '',
      variantName: '',
      variantOrder: nextOrder,
    });
    setShowAssignModal(true);
  };

  // Get unassigned templates (not assigned to any document type)
  const getUnassignedTemplates = () => {
    const assignedIds = new Set<string>();
    documentTypes.forEach(dt => {
      (dt.templates || []).forEach(t => assignedIds.add(t.id));
    });
    return templates.filter(t => !assignedIds.has(t.id) && !t.document_type_id);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-main py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-h2 font-bold text-gray-900">จัดการประเภทเอกสาร</h1>
            <p className="text-body text-gray-600 mt-1">
              จัดกลุ่มเทมเพลตที่เกี่ยวข้องเข้าด้วยกัน เช่น บัตรประชาชน มี 3 เทมเพลต (ด้านหน้า, ด้านหลัง, สำเนา)
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Auto Group All Button - Main action user wants */}
            <button
              onClick={handleAutoGroupAll}
              disabled={autoGrouping || getUnassignedTemplates().length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="วิเคราะห์และจัดกลุ่มเทมเพลตทั้งหมดอัตโนมัติ"
            >
              {autoGrouping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wand2 className="w-5 h-5" />
              )}
              จัดกลุ่มอัตโนมัติ
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              สร้างประเภทเอกสาร
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
              <X className="w-4 h-4 inline" />
            </button>
          </div>
        )}

        {/* Auto-Suggestions Section */}
        {suggestions.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                แนะนำการจัดกลุ่มอัตโนมัติ
              </h2>
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {suggestions.length} รายการ
              </span>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
              <p className="text-sm text-amber-800 mb-4">
                ระบบตรวจพบเทมเพลตที่อาจจัดกลุ่มเข้าด้วยกันได้ตามชื่อ คลิก &quot;ใช้งาน&quot; เพื่อสร้างประเภทเอกสารและจัดกลุ่มอัตโนมัติ
              </p>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-amber-200 p-4 flex items-center gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Wand2 className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-gray-900">
                          {suggestion.suggested_name}
                        </span>
                        {suggestion.existing_type_id && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            ตรงกับ: {suggestion.existing_type_name}
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {categoryLabels[suggestion.suggested_category] || suggestion.suggested_category}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({Math.round(suggestion.confidence * 100)}% มั่นใจ)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestion.templates.map((t, i) => (
                          <div
                            key={t.id}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-sm"
                          >
                            <FileText className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-700 truncate max-w-[200px]">
                              {t.display_name || t.filename}
                            </span>
                            {t.suggested_variant && (
                              <span className="text-xs text-amber-600">
                                → {t.suggested_variant}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplySuggestion(suggestion)}
                      disabled={applyingSuggestion !== null}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {applyingSuggestion === suggestion.suggested_name ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      ใช้งาน
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Document Types List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {documentTypes.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีประเภทเอกสาร</h3>
              <p className="text-gray-600 mb-4">สร้างประเภทเอกสารเพื่อจัดกลุ่มเทมเพลตที่เกี่ยวข้อง</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                สร้างประเภทเอกสารแรก
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documentTypes.map((docType) => (
                <div key={docType.id} className="p-4">
                  {/* Document Type Header */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleExpanded(docType.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {expandedTypes.has(docType.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                    </button>

                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: docType.color || '#6B7280' }}
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{docType.name}</h3>
                        {docType.name_en && (
                          <span className="text-sm text-gray-500">({docType.name_en})</span>
                        )}
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                          {categoryLabels[docType.category] || docType.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          {(docType.templates || []).length} เทมเพลต
                        </span>
                      </div>
                      {docType.description && (
                        <p className="text-sm text-gray-600 mt-1">{docType.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAssignModal(docType)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="เพิ่มเทมเพลต"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(docType)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="แก้ไข"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(docType)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="ลบ"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Templates List (Expanded) */}
                  {expandedTypes.has(docType.id) && (
                    <div className="mt-4 ml-10 space-y-2">
                      {(docType.templates || []).length === 0 ? (
                        <p className="text-sm text-gray-500 italic">ยังไม่มีเทมเพลต</p>
                      ) : (
                        (docType.templates || []).map((template, index) => (
                          <div
                            key={template.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">
                                {template.display_name || template.filename}
                              </span>
                              {template.variant_name && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                  {template.variant_name}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                            <button
                              onClick={() => handleUnassignTemplate(docType.id, template.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="ยกเลิกการเชื่อมโยง"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Unassigned Templates Section */}
        {getUnassignedTemplates().length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              เทมเพลตที่ยังไม่ได้จัดกลุ่ม ({getUnassignedTemplates().length})
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getUnassignedTemplates().map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {template.display_name || template.filename}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{template.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Modal
          title="สร้างประเภทเอกสาร"
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        >
          <DocumentTypeForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            saving={saving}
            submitLabel="สร้าง"
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDocType && (
        <Modal
          title="แก้ไขประเภทเอกสาร"
          onClose={() => {
            setShowEditModal(false);
            setSelectedDocType(null);
            resetForm();
          }}
        >
          <DocumentTypeForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedDocType(null);
              resetForm();
            }}
            saving={saving}
            submitLabel="บันทึก"
          />
        </Modal>
      )}

      {/* Assign Template Modal */}
      {showAssignModal && selectedDocType && (
        <Modal
          title={`เพิ่มเทมเพลตใน "${selectedDocType.name}"`}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDocType(null);
            setAssignmentData({ templateId: '', variantName: '', variantOrder: 0 });
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เลือกเทมเพลต
              </label>
              <select
                value={assignmentData.templateId}
                onChange={(e) => setAssignmentData({ ...assignmentData, templateId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- เลือกเทมเพลต --</option>
                {getUnassignedTemplates().map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.display_name || template.filename}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อรูปแบบ (Variant)
              </label>
              <input
                type="text"
                value={assignmentData.variantName}
                onChange={(e) => setAssignmentData({ ...assignmentData, variantName: e.target.value })}
                placeholder="เช่น ด้านหน้า, ด้านหลัง, สำเนา"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ลำดับการแสดง
              </label>
              <input
                type="number"
                value={assignmentData.variantOrder}
                onChange={(e) => setAssignmentData({ ...assignmentData, variantOrder: parseInt(e.target.value) || 0 })}
                min={0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedDocType(null);
                  setAssignmentData({ templateId: '', variantName: '', variantOrder: 0 });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleAssignTemplate}
                disabled={saving || !assignmentData.templateId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                เพิ่มเทมเพลต
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Modal Component
function Modal({
  title,
  children,
  onClose
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Document Type Form Component
function DocumentTypeForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
}: {
  formData: {
    code: string;
    name: string;
    name_en: string;
    description: string;
    category: DocumentTypeCategory;
    color: string;
    sort_order: number;
  };
  setFormData: (data: typeof formData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          รหัส (Code) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
          placeholder="เช่น thai_id_card"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ชื่อ (ภาษาไทย) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="เช่น บัตรประชาชน"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ชื่อ (English)
        </label>
        <input
          type="text"
          value={formData.name_en}
          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
          placeholder="เช่น Thai ID Card"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          รายละเอียด
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หมวดหมู่
          </label>
          <select
            value={formData.category}
            onChange={(e) => {
              const cat = e.target.value as DocumentTypeCategory;
              setFormData({
                ...formData,
                category: cat,
                color: categoryColors[cat] || formData.color
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            สี
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ลำดับการแสดง
        </label>
        <input
          type="number"
          value={formData.sort_order}
          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
          min={0}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          ยกเลิก
        </button>
        <button
          onClick={onSubmit}
          disabled={saving || !formData.code || !formData.name}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
