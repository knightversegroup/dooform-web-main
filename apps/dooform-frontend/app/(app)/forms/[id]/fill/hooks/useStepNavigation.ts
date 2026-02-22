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

export function useStepNavigation(
  initialStep: FormStep = "fill"
): UseStepNavigationReturn {
  const [currentStep, setCurrentStep] = useState<FormStep>(initialStep);

  const currentStepIndex = useMemo(() => getStepIndex(currentStep), [currentStep]);
  const currentStepConfig = useMemo(() => getStepConfig(currentStep) || FORM_STEPS[0], [currentStep]);

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === FORM_STEPS.length - 1;

  const goToStep = useCallback((step: FormStep) => setCurrentStep(step), []);

  const goToNext = useCallback(() => {
    const next = getNextStep(currentStep);
    if (next) setCurrentStep(next);
  }, [currentStep]);

  const goToPrevious = useCallback(() => {
    const prev = getPreviousStep(currentStep);
    if (prev) setCurrentStep(prev);
  }, [currentStep]);

  const goToFill = useCallback(() => setCurrentStep("fill"), []);
  const goToReview = useCallback(() => setCurrentStep("review"), []);
  const goToDownload = useCallback(() => setCurrentStep("download"), []);

  return {
    currentStep,
    currentStepIndex,
    currentStepConfig,
    totalSteps: FORM_STEPS.length,
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
