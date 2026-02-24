/**
 * Step progress indicator component
 */

import { FORM_STEPS, FormStep, StepConfig } from "../utils/constants";

interface StepIndicatorProps {
  currentStep: FormStep;
  currentStepIndex: number;
  currentStepConfig: StepConfig;
}

/**
 * Renders a step-based progress indicator for the multi-step form
 */
export function StepIndicator({
  currentStep,
  currentStepIndex,
  currentStepConfig,
}: StepIndicatorProps) {
  return (
    <div className="border-b border-[#d9d9d9] flex flex-col gap-[10px] items-start justify-center p-4 w-full">
      <div className="flex flex-col gap-[2px] items-start w-full">
        <p className="text-[#171717] text-sm">
          {currentStepConfig?.label}
        </p>
        <p className="font-semibold text-xl text-black">
          {currentStepConfig?.title}
        </p>
      </div>
      <div className="flex gap-1 items-center w-full" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={FORM_STEPS.length}>
        {FORM_STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`flex-1 h-1 transition-colors duration-300 ${
              idx <= currentStepIndex ? "bg-[#0b4db7]" : "bg-[#fafafa]"
            }`}
            aria-label={`Step ${idx + 1}: ${step.title}`}
          />
        ))}
      </div>
    </div>
  );
}
