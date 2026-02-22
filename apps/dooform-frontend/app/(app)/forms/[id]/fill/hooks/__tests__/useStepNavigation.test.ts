import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStepNavigation } from '../useStepNavigation';

describe('useStepNavigation', () => {
  describe('initialization', () => {
    it('should start at the fill step', () => {
      const { result } = renderHook(() => useStepNavigation());

      expect(result.current.currentStep).toBe('fill');
      expect(result.current.currentStepIndex).toBe(0);
    });

    it('should have correct step configuration', () => {
      const { result } = renderHook(() => useStepNavigation());

      expect(result.current.currentStepConfig).toEqual({
        id: 'fill',
        number: 1,
        label: 'ส่วนที่ 1',
        title: 'กรอกข้อมูล',
      });
    });

    it('should have three steps defined', () => {
      const { result } = renderHook(() => useStepNavigation());

      expect(result.current.steps).toHaveLength(3);
      expect(result.current.steps.map((s) => s.id)).toEqual(['fill', 'review', 'download']);
    });

    it('should have correct total steps count', () => {
      const { result } = renderHook(() => useStepNavigation());

      expect(result.current.totalSteps).toBe(3);
    });

    it('should indicate it is the first step', () => {
      const { result } = renderHook(() => useStepNavigation());

      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
    });
  });

  describe('navigation', () => {
    it('should navigate to review step', () => {
      const { result } = renderHook(() => useStepNavigation());

      act(() => {
        result.current.goToReview();
      });

      expect(result.current.currentStep).toBe('review');
      expect(result.current.currentStepIndex).toBe(1);
      expect(result.current.currentStepConfig.id).toBe('review');
    });

    it('should navigate to download step', () => {
      const { result } = renderHook(() => useStepNavigation());

      act(() => {
        result.current.goToDownload();
      });

      expect(result.current.currentStep).toBe('download');
      expect(result.current.currentStepIndex).toBe(2);
      expect(result.current.isLastStep).toBe(true);
    });

    it('should navigate back to fill step', () => {
      const { result } = renderHook(() => useStepNavigation());

      act(() => {
        result.current.goToReview();
      });

      expect(result.current.currentStep).toBe('review');

      act(() => {
        result.current.goToFill();
      });

      expect(result.current.currentStep).toBe('fill');
      expect(result.current.currentStepIndex).toBe(0);
    });

    it('should navigate using goToNext', () => {
      const { result } = renderHook(() => useStepNavigation());

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentStep).toBe('review');

      act(() => {
        result.current.goToNext();
      });

      expect(result.current.currentStep).toBe('download');
    });

    it('should navigate using goToPrevious', () => {
      const { result } = renderHook(() => useStepNavigation());

      act(() => {
        result.current.goToDownload();
      });

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentStep).toBe('review');

      act(() => {
        result.current.goToPrevious();
      });

      expect(result.current.currentStep).toBe('fill');
    });

    it('should navigate using goToStep', () => {
      const { result } = renderHook(() => useStepNavigation());

      act(() => {
        result.current.goToStep('download');
      });

      expect(result.current.currentStep).toBe('download');

      act(() => {
        result.current.goToStep('fill');
      });

      expect(result.current.currentStep).toBe('fill');
    });
  });

  describe('step labels', () => {
    it('should have Thai labels and titles for each step', () => {
      const { result } = renderHook(() => useStepNavigation());

      const stepConfigs = result.current.steps;

      // Fill step
      expect(stepConfigs[0].label).toBe('ส่วนที่ 1');
      expect(stepConfigs[0].title).toBe('กรอกข้อมูล');

      // Review step
      expect(stepConfigs[1].label).toBe('ส่วนที่ 2');
      expect(stepConfigs[1].title).toBe('ตรวจสอบข้อมูล');

      // Download step
      expect(stepConfigs[2].label).toBe('ส่วนที่ 3');
      expect(stepConfigs[2].title).toBe('ดาวน์โหลดไฟล์');
    });
  });

  describe('custom initial step', () => {
    it('should allow starting at review step', () => {
      const { result } = renderHook(() => useStepNavigation('review'));

      expect(result.current.currentStep).toBe('review');
      expect(result.current.currentStepIndex).toBe(1);
      expect(result.current.isFirstStep).toBe(false);
    });

    it('should allow starting at download step', () => {
      const { result } = renderHook(() => useStepNavigation('download'));

      expect(result.current.currentStep).toBe('download');
      expect(result.current.currentStepIndex).toBe(2);
      expect(result.current.isLastStep).toBe(true);
    });
  });
});
