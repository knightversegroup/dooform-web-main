/**
 * Constants for the form fill page
 */

/**
 * Step definitions for the multi-step form
 */
export type FormStep = "fill" | "review" | "download";

export interface StepConfig {
  id: FormStep;
  number: number;
  label: string;
  title: string;
}

export const FORM_STEPS: StepConfig[] = [
  { id: "fill", number: 1, label: "ส่วนที่ 1", title: "กรอกข้อมูล" },
  { id: "review", number: 2, label: "ส่วนที่ 2", title: "ตรวจสอบข้อมูล" },
  { id: "download", number: 3, label: "ส่วนที่ 3", title: "ดาวน์โหลดไฟล์" },
];

/**
 * Get step configuration by step ID
 */
export function getStepConfig(step: FormStep): StepConfig | undefined {
  return FORM_STEPS.find((s) => s.id === step);
}

/**
 * Get step index by step ID
 */
export function getStepIndex(step: FormStep): number {
  return FORM_STEPS.findIndex((s) => s.id === step);
}

/**
 * Get the next step
 */
export function getNextStep(currentStep: FormStep): FormStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex < FORM_STEPS.length - 1) {
    return FORM_STEPS[currentIndex + 1].id;
  }
  return null;
}

/**
 * Get the previous step
 */
export function getPreviousStep(currentStep: FormStep): FormStep | null {
  const currentIndex = getStepIndex(currentStep);
  if (currentIndex > 0) {
    return FORM_STEPS[currentIndex - 1].id;
  }
  return null;
}
