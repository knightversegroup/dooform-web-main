import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormData } from '../useFormData';

describe('useFormData', () => {
  describe('initialization', () => {
    it('should initialize with empty form data', () => {
      const { result } = renderHook(() => useFormData());

      expect(result.current.formData).toEqual({});
      expect(result.current.filledFieldsCount).toBe(0);
      expect(result.current.totalFieldsCount).toBe(0);
      expect(result.current.progressPercentage).toBe(0);
    });

    it('should initialize form data from placeholders', () => {
      const { result } = renderHook(() => useFormData());

      act(() => {
        result.current.initializeFormData(['{{name}}', '{{email}}', '{{phone}}']);
      });

      expect(result.current.formData).toEqual({
        name: '',
        email: '',
        phone: '',
      });
      expect(result.current.totalFieldsCount).toBe(3);
    });
  });

  describe('handleInputChange', () => {
    it('should update a single field value', () => {
      const { result } = renderHook(() => useFormData());

      act(() => {
        result.current.initializeFormData(['{{name}}', '{{email}}']);
      });

      act(() => {
        result.current.handleInputChange('name', 'John Doe');
      });

      expect(result.current.formData.name).toBe('John Doe');
      expect(result.current.formData.email).toBe('');
    });

    it('should update progress when fields are filled', () => {
      const { result } = renderHook(() => useFormData());

      act(() => {
        result.current.initializeFormData(['{{name}}', '{{email}}']);
      });

      expect(result.current.progressPercentage).toBe(0);

      act(() => {
        result.current.handleInputChange('name', 'John');
      });

      expect(result.current.filledFieldsCount).toBe(1);
      expect(result.current.progressPercentage).toBe(50);

      act(() => {
        result.current.handleInputChange('email', 'john@example.com');
      });

      expect(result.current.filledFieldsCount).toBe(2);
      expect(result.current.progressPercentage).toBe(100);
    });
  });

  describe('handleOCRDataExtracted', () => {
    it('should merge OCR extracted data into form data', () => {
      const { result } = renderHook(() => useFormData());

      act(() => {
        result.current.initializeFormData(['{{name}}', '{{id_number}}', '{{address}}']);
      });

      act(() => {
        result.current.handleOCRDataExtracted({
          name: 'Jane Doe',
          id_number: '1234567890',
        });
      });

      expect(result.current.formData.name).toBe('Jane Doe');
      expect(result.current.formData.id_number).toBe('1234567890');
      expect(result.current.formData.address).toBe('');
    });

    it('should overwrite existing values with OCR data', () => {
      const { result } = renderHook(() => useFormData());

      act(() => {
        result.current.initializeFormData(['{{name}}']);
        result.current.handleInputChange('name', 'Old Name');
      });

      act(() => {
        result.current.handleOCRDataExtracted({ name: 'New OCR Name' });
      });

      expect(result.current.formData.name).toBe('New OCR Name');
    });
  });

  describe('handleAddressSelect', () => {
    const mockFieldDefinitions = {
      '{{address}}': { dataType: 'address', placeholder: '{{address}}' },
      '{{province}}': { dataType: 'province', placeholder: '{{province}}' },
      '{{district}}': { dataType: 'text', placeholder: '{{district}}' },
      '{{subdistrict}}': { dataType: 'text', placeholder: '{{subdistrict}}' },
    } as Record<string, any>;

    const mockAddress = {
      province: 'กรุงเทพมหานคร',
      provinceEn: 'Bangkok',
      district: 'จตุจักร',
      districtEn: 'Chatuchak',
      subDistrict: 'ลาดยาว',
      subDistrictEn: 'Ladyao',
      fullAddress: 'ลาดยาว จตุจักร กรุงเทพมหานคร',
      fullAddressEn: 'Ladyao, Chatuchak, Bangkok',
    };

    it('should auto-fill related address fields', () => {
      const { result } = renderHook(() => useFormData());

      act(() => {
        result.current.initializeFormData([
          '{{address}}',
          '{{province}}',
          '{{district}}',
          '{{subdistrict}}',
        ]);
      });

      act(() => {
        result.current.handleAddressSelect('address', mockAddress, mockFieldDefinitions);
      });

      expect(result.current.formData.province).toBe('Bangkok');
      expect(result.current.formData.district).toBe('Chatuchak');
      expect(result.current.formData.subdistrict).toBe('Ladyao');
    });

    it('should not overwrite fields that already have values', () => {
      const { result } = renderHook(() => useFormData());

      act(() => {
        result.current.initializeFormData(['{{address}}', '{{province}}', '{{district}}']);
        result.current.handleInputChange('province', 'Existing Province');
      });

      act(() => {
        result.current.handleAddressSelect('address', mockAddress, mockFieldDefinitions);
      });

      // Province should keep its existing value
      expect(result.current.formData.province).toBe('Existing Province');
      // District should be auto-filled
      expect(result.current.formData.district).toBe('Chatuchak');
    });
  });

  describe('resetFormData', () => {
    it('should reset all fields to empty strings', () => {
      const { result } = renderHook(() => useFormData());

      act(() => {
        result.current.initializeFormData(['{{name}}', '{{email}}']);
        result.current.handleInputChange('name', 'John');
        result.current.handleInputChange('email', 'john@example.com');
      });

      expect(result.current.filledFieldsCount).toBe(2);

      act(() => {
        result.current.resetFormData(['{{name}}', '{{email}}']);
      });

      expect(result.current.formData.name).toBe('');
      expect(result.current.formData.email).toBe('');
      expect(result.current.filledFieldsCount).toBe(0);
    });
  });

  describe('progress calculation', () => {
    it('should not count whitespace-only values as filled', () => {
      const { result } = renderHook(() => useFormData());

      act(() => {
        result.current.initializeFormData(['{{name}}', '{{email}}']);
        result.current.handleInputChange('name', '   ');
        result.current.handleInputChange('email', 'test@example.com');
      });

      expect(result.current.filledFieldsCount).toBe(1);
      expect(result.current.progressPercentage).toBe(50);
    });

    it('should handle empty form data gracefully', () => {
      const { result } = renderHook(() => useFormData());

      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.totalFieldsCount).toBe(0);
    });
  });
});
