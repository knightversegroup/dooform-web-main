"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Radio, GripVertical, Save } from "lucide-react";
import type { FieldDefinition, RadioOption } from "@/lib/api/types";

interface RadioGroupConfig {
  id: string;
  label: string;
  masterPlaceholder: string;
  options: RadioOption[];
}

// Helper to detect if a field is a potential child field (e.g., $3_D is child of $3)
function getPotentialChildFields(placeholder: string, allFields: string[]): string[] {
  // Match pattern like $3 -> $3_D, $3_M, $3_X etc.
  const baseMatch = placeholder.match(/^(\$\d+)$/);
  if (baseMatch) {
    const base = baseMatch[1];
    return allFields.filter(f => f.startsWith(base + '_'));
  }
  return [];
}

interface RadioGroupManagerProps {
  isOpen: boolean;
  onClose: () => void;
  fieldDefinitions: Record<string, FieldDefinition>;
  onSave: (updatedDefinitions: Record<string, FieldDefinition>) => void;
}

export function RadioGroupManager({
  isOpen,
  onClose,
  fieldDefinitions,
  onSave,
}: RadioGroupManagerProps) {
  const [radioGroups, setRadioGroups] = useState<RadioGroupConfig[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [allFieldKeys, setAllFieldKeys] = useState<string[]>([]);
  const [childFieldsUsed, setChildFieldsUsed] = useState<Set<string>>(new Set());

  // Initialize from existing field definitions
  useEffect(() => {
    if (!fieldDefinitions) return;

    // Get all field keys
    const allKeys = Object.keys(fieldDefinitions);
    setAllFieldKeys(allKeys);

    // Find existing radio groups
    const existingGroups: RadioGroupConfig[] = [];
    const usedPlaceholders = new Set<string>();
    const usedChildFields = new Set<string>();

    Object.entries(fieldDefinitions).forEach(([key, def]) => {
      if (def.isRadioGroup && def.radioOptions) {
        existingGroups.push({
          id: def.radioGroupId || key,
          label: def.label || key,
          masterPlaceholder: key,
          options: def.radioOptions,
        });
        // Mark all placeholders in this group as used
        def.radioOptions.forEach((opt) => {
          usedPlaceholders.add(opt.placeholder);
          // Track child fields that are used
          opt.childFields?.forEach(cf => usedChildFields.add(cf));
        });
      }
    });

    setRadioGroups(existingGroups);
    setChildFieldsUsed(usedChildFields);

    // Find available checkbox fields (not already in a radio group)
    const checkboxFields = Object.entries(fieldDefinitions)
      .filter(([key, def]) => {
        // Include checkbox fields or fields that look like checkboxes ($ prefix)
        const isCheckbox = def.inputType === "checkbox";
        const isDollarField = key.startsWith("$") && !key.includes("_");
        const notInRadioGroup = !usedPlaceholders.has(key);
        const notHidden = !def.group?.startsWith("radio_hidden_");
        return (isCheckbox || isDollarField) && notInRadioGroup && notHidden;
      })
      .map(([key]) => key);

    setAvailableFields(checkboxFields);
  }, [fieldDefinitions]);

  // Add new radio group
  const addRadioGroup = () => {
    const newGroup: RadioGroupConfig = {
      id: `radio_group_${Date.now()}`,
      label: "กลุ่มตัวเลือกใหม่",
      masterPlaceholder: "",
      options: [],
    };
    setRadioGroups([...radioGroups, newGroup]);
  };

  // Remove radio group
  const removeRadioGroup = (groupId: string) => {
    const group = radioGroups.find((g) => g.id === groupId);
    if (group) {
      // Return options to available fields
      const returnedFields = group.options.map((opt) => opt.placeholder);
      setAvailableFields([...availableFields, ...returnedFields]);
    }
    setRadioGroups(radioGroups.filter((g) => g.id !== groupId));
  };

  // Update group label
  const updateGroupLabel = (groupId: string, label: string) => {
    setRadioGroups(
      radioGroups.map((g) => (g.id === groupId ? { ...g, label } : g))
    );
  };

  // Add option to group
  const addOptionToGroup = (groupId: string, placeholder: string) => {
    setRadioGroups(
      radioGroups.map((g) => {
        if (g.id !== groupId) return g;

        const newOption: RadioOption = {
          placeholder,
          label: fieldDefinitions[placeholder]?.label || placeholder,
          value: "/",
        };

        const newOptions = [...g.options, newOption];
        const masterPlaceholder = g.masterPlaceholder || placeholder;

        return {
          ...g,
          masterPlaceholder,
          options: newOptions,
        };
      })
    );

    // Remove from available fields
    setAvailableFields(availableFields.filter((f) => f !== placeholder));
  };

  // Remove option from group
  const removeOptionFromGroup = (groupId: string, placeholder: string) => {
    setRadioGroups(
      radioGroups.map((g) => {
        if (g.id !== groupId) return g;

        const newOptions = g.options.filter((opt) => opt.placeholder !== placeholder);
        const newMaster =
          g.masterPlaceholder === placeholder
            ? newOptions[0]?.placeholder || ""
            : g.masterPlaceholder;

        return {
          ...g,
          masterPlaceholder: newMaster,
          options: newOptions,
        };
      })
    );

    // Return to available fields
    setAvailableFields([...availableFields, placeholder]);
  };

  // Update option label
  const updateOptionLabel = (groupId: string, placeholder: string, label: string) => {
    setRadioGroups(
      radioGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.map((opt) =>
            opt.placeholder === placeholder ? { ...opt, label } : opt
          ),
        };
      })
    );
  };

  // Add child field to option
  const addChildField = (groupId: string, placeholder: string, childField: string) => {
    setRadioGroups(
      radioGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.map((opt) => {
            if (opt.placeholder !== placeholder) return opt;
            const currentChildren = opt.childFields || [];
            if (currentChildren.includes(childField)) return opt;
            return { ...opt, childFields: [...currentChildren, childField] };
          }),
        };
      })
    );
    setChildFieldsUsed(new Set([...childFieldsUsed, childField]));
  };

  // Remove child field from option
  const removeChildField = (groupId: string, placeholder: string, childField: string) => {
    setRadioGroups(
      radioGroups.map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          options: g.options.map((opt) => {
            if (opt.placeholder !== placeholder) return opt;
            return {
              ...opt,
              childFields: (opt.childFields || []).filter(cf => cf !== childField),
            };
          }),
        };
      })
    );
    // Remove from used set
    const newUsed = new Set(childFieldsUsed);
    newUsed.delete(childField);
    setChildFieldsUsed(newUsed);
  };

  // Get available child fields for a placeholder (fields with suffix like $3_D for $3)
  const getAvailableChildFields = (placeholder: string) => {
    const potentialChildren = getPotentialChildFields(placeholder, allFieldKeys);
    // Filter out already used child fields (except those already assigned to this option)
    return potentialChildren.filter(cf => !childFieldsUsed.has(cf));
  };

  // Save to field definitions
  const handleSave = () => {
    // Create a deep copy to avoid mutating the original
    const updatedDefinitions: Record<string, FieldDefinition> = {};
    Object.entries(fieldDefinitions).forEach(([key, def]) => {
      updatedDefinitions[key] = { ...def };
    });

    // First, clean up any existing radio group configurations
    Object.keys(updatedDefinitions).forEach((key) => {
      const def = updatedDefinitions[key];
      if (def.isRadioGroup) {
        // Remove radio group properties
        delete def.isRadioGroup;
        delete def.radioGroupId;
        delete def.radioOptions;
      }
      if (def.group?.startsWith("radio_hidden_") || def.group?.startsWith("radio_child_")) {
        delete def.group;
      }
    });

    // Apply new radio group configurations
    radioGroups.forEach((group) => {
      if (group.options.length < 2) {
        console.log(`[RadioGroup] Skipping group ${group.id}: less than 2 options`);
        return;
      }

      const masterKey = group.masterPlaceholder;
      if (!masterKey || !updatedDefinitions[masterKey]) {
        console.log(`[RadioGroup] Skipping group ${group.id}: no master key or master not found`);
        return;
      }

      console.log(`[RadioGroup] Processing group ${group.id} with master ${masterKey}`);

      // Update master field to be a radio group
      updatedDefinitions[masterKey] = {
        ...updatedDefinitions[masterKey],
        inputType: "radio",
        label: group.label,
        isRadioGroup: true,
        radioGroupId: group.id,
        radioOptions: group.options,
      };

      // Mark other options as hidden
      group.options.forEach((opt) => {
        console.log(`[RadioGroup] Processing option ${opt.placeholder}, master is ${masterKey}`);
        if (opt.placeholder !== masterKey) {
          if (updatedDefinitions[opt.placeholder]) {
            console.log(`[RadioGroup] Setting ${opt.placeholder} group to radio_hidden_${group.id}`);
            updatedDefinitions[opt.placeholder] = {
              ...updatedDefinitions[opt.placeholder],
              group: `radio_hidden_${group.id}`,
            };
          } else {
            console.warn(`[RadioGroup] WARNING: ${opt.placeholder} not found in definitions!`);
          }
        }
        // Mark child fields as conditional (hidden by default, shown when parent selected)
        opt.childFields?.forEach((childKey) => {
          if (updatedDefinitions[childKey]) {
            updatedDefinitions[childKey] = {
              ...updatedDefinitions[childKey],
              group: `radio_child_${group.id}_${opt.placeholder}`,
            };
          }
        });
      });
    });

    // Log final state of definitions being saved
    console.log("[RadioGroup] Final definitions to save:",
      Object.entries(updatedDefinitions)
        .filter(([, def]) => def.isRadioGroup || def.group?.startsWith("radio_"))
        .map(([key, def]) => ({ key, isRadioGroup: def.isRadioGroup, group: def.group }))
    );

    onSave(updatedDefinitions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                จัดการกลุ่ม Radio Button
              </h2>
              <p className="text-sm text-gray-500">
                รวม checkbox หลายตัวให้เป็นตัวเลือกแบบ radio button
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Available Fields */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Placeholder ที่ใช้ได้ ({availableFields.length})
            </h3>
            {availableFields.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableFields.map((field) => (
                  <span
                    key={field}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 font-mono"
                  >
                    {`{{${field}}}`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                ไม่มี placeholder ที่ใช้ได้ (อาจถูกใช้ในกลุ่มแล้ว)
              </p>
            )}
          </div>

          {/* Radio Groups */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                กลุ่ม Radio Button ({radioGroups.length})
              </h3>
              <button
                onClick={addRadioGroup}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                เพิ่มกลุ่มใหม่
              </button>
            </div>

            {radioGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Radio className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>ยังไม่มีกลุ่ม Radio Button</p>
                <p className="text-sm mt-1">คลิก "เพิ่มกลุ่มใหม่" เพื่อเริ่มต้น</p>
              </div>
            ) : (
              radioGroups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={group.label}
                      onChange={(e) => updateGroupLabel(group.id, e.target.value)}
                      placeholder="ชื่อกลุ่ม (เช่น เพศ / Sex)"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeRadioGroup(group.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Group Options */}
                  <div className="p-4 space-y-3">
                    {group.options.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-2">
                        เลือก placeholder จากด้านล่างเพื่อเพิ่มตัวเลือก
                      </p>
                    ) : (
                      group.options.map((option, index) => {
                        const availableChildren = getAvailableChildFields(option.placeholder);
                        const currentChildren = option.childFields || [];
                        const hasChildOptions = availableChildren.length > 0 || currentChildren.length > 0;

                        return (
                          <div
                            key={option.placeholder}
                            className="bg-gray-50 rounded-lg overflow-hidden"
                          >
                            <div className="flex items-center gap-3 p-2">
                              <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                                {index + 1}
                              </div>
                              <span className="font-mono text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                                {`{{${option.placeholder}}}`}
                              </span>
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) =>
                                  updateOptionLabel(group.id, option.placeholder, e.target.value)
                                }
                                placeholder="ป้ายกำกับ (เช่น ชาย / Male)"
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => removeOptionFromGroup(group.id, option.placeholder)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Child fields section */}
                            {hasChildOptions && (
                              <div className="px-4 pb-3 pt-1 ml-8 border-l-2 border-blue-200">
                                <div className="text-xs text-gray-500 mb-2">
                                  ฟิลด์ลูก (แสดงเมื่อเลือกตัวเลือกนี้):
                                </div>
                                {/* Current child fields */}
                                {currentChildren.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {currentChildren.map((childField) => (
                                      <span
                                        key={childField}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-mono"
                                      >
                                        {`{{${childField}}}`}
                                        <button
                                          onClick={() => removeChildField(group.id, option.placeholder, childField)}
                                          className="hover:text-red-500"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {/* Add child field dropdown */}
                                {availableChildren.length > 0 && (
                                  <select
                                    className="w-full px-2 py-1.5 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        addChildField(group.id, option.placeholder, e.target.value);
                                      }
                                    }}
                                  >
                                    <option value="">+ เพิ่มฟิลด์ลูก...</option>
                                    {availableChildren.map((field) => (
                                      <option key={field} value={field}>
                                        {`{{${field}}}`} - {fieldDefinitions[field]?.label || field}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Add Option Dropdown */}
                    {availableFields.length > 0 && (
                      <div className="pt-2">
                        <select
                          className="w-full px-3 py-2 text-sm border border-dashed border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              addOptionToGroup(group.id, e.target.value);
                            }
                          }}
                        >
                          <option value="">+ เพิ่มตัวเลือก...</option>
                          {availableFields.map((field) => (
                            <option key={field} value={field}>
                              {`{{${field}}}`} - {fieldDefinitions[field]?.label || field}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Validation Warning */}
                  {group.options.length < 2 && group.options.length > 0 && (
                    <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-100 text-yellow-700 text-sm">
                      ⚠️ ต้องมีอย่างน้อย 2 ตัวเลือกเพื่อสร้าง Radio Button
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-500">
            การเปลี่ยนแปลงจะถูกบันทึกเมื่อกด "บันทึก"
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
