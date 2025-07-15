// Compatibility layer for Jotai migration
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  submissionAtom,
  formDataAtom,
  currentStepAtom,
  setFormDataAtom,
  updateFormDataAtom,
  setCurrentStepAtom,
  resetFormAtom
} from '@/atoms/submissionAtom'

export function useSubmissionStore() {
  const formData = useAtomValue(formDataAtom)
  const currentStep = useAtomValue(currentStepAtom)
  const setFormData = useSetAtom(setFormDataAtom)
  const updateFormData = useSetAtom(updateFormDataAtom)
  const setCurrentStep = useSetAtom(setCurrentStepAtom)
  const resetForm = useSetAtom(resetFormAtom)
  
  return {
    formData,
    currentStep,
    setFormData: (data: any) => setFormData(data),
    updateFormData: (data: Partial<any>) => updateFormData(data),
    setCurrentStep: (step: number) => setCurrentStep(step),
    resetForm: () => resetForm()
  }
}