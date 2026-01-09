/**
 * Hook for managing multi-step form navigation
 */

import { useState, useMemo, useCallback } from "react";
import {
  FormStep,
  FORM_STEPS,
  StepConfig,
  getStepConfig,
  getStepIndex,
  getNextStep,
  getPreviousStep,
} from "../utils/constants";

export interface UseStepNavigationReturn {
  currentStep: FormStep;
  currentStepIndex: number;
  currentStepConfig: StepConfig;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToStep: (step: FormStep) => void;
  goToNext: () => void;
  goToPrevious: () => void;
  goToFill: () => void;
  goToReview: () => void;
  goToDownload: () => void;
  steps: StepConfig[];
}

/**
 * Custom hook for managing step navigation in the form fill page
 *
 * @param initialStep - The initial step to start on
 * @returns Step navigation state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   currentStep,
 *   currentStepConfig,
 *   goToNext,
 *   goToPrevious,
 *   isLastStep,
 * } = useStepNavigation("fill");
 * ```
 */
export function useStepNavigation(
  initialStep: FormStep = "fill"
): UseStepNavigationReturn {
  const [currentStep, setCurrentStep] = useState<FormStep>(initialStep);

  const currentStepIndex = useMemo(() => {
    return getStepIndex(currentStep);
  }, [currentStep]);

  const currentStepConfig = useMemo(() => {
    return getStepConfig(currentStep) || FORM_STEPS[0];
  }, [currentStep]);

  const totalSteps = FORM_STEPS.length;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === FORM_STEPS.length - 1;

  const goToStep = useCallback((step: FormStep) => {
    setCurrentStep(step);
  }, []);

  const goToNext = useCallback(() => {
    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      setCurrentStep(nextStep);
    }
  }, [currentStep]);

  const goToPrevious = useCallback(() => {
    const prevStep = getPreviousStep(currentStep);
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  }, [currentStep]);

  const goToFill = useCallback(() => {
    setCurrentStep("fill");
  }, []);

  const goToReview = useCallback(() => {
    setCurrentStep("review");
  }, []);

  const goToDownload = useCallback(() => {
    setCurrentStep("download");
  }, []);

  return {
    currentStep,
    currentStepIndex,
    currentStepConfig,
    totalSteps,
    isFirstStep,
    isLastStep,
    goToStep,
    goToNext,
    goToPrevious,
    goToFill,
    goToReview,
    goToDownload,
    steps: FORM_STEPS,
  };
}
