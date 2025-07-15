// Compatibility layer for Redux migration
import { useAppSelector, useAppDispatch } from './hooks'
import {
  setFormData as setFormDataAction,
  updateFormData as updateFormDataAction,
  setCurrentStep as setCurrentStepAction,
  resetForm as resetFormAction
} from './submissionFormSlice'

export function useSubmissionStore() {
  const formData = useAppSelector(state => state.submissionForm.formData)
  const currentStep = useAppSelector(state => state.submissionForm.currentStep)
  const dispatch = useAppDispatch()
  
  return {
    formData,
    currentStep,
    setFormData: (data: any) => dispatch(setFormDataAction(data)),
    updateFormData: (data: Partial<any>) => dispatch(updateFormDataAction(data)),
    setCurrentStep: (step: number) => dispatch(setCurrentStepAction(step)),
    resetForm: () => dispatch(resetFormAction())
  }
}