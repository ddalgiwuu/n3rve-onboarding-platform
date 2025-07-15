// Compatibility layer for Jotai migration
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import {
  submissionAtom,
  formDataAtom,
  currentStepAtom,
  setFormDataAtom,
  updateFormDataAtom,
  setCurrentStepAtom,
  resetFormAtom
} from '@/atoms/submissionAtom'

// Initial form data for fallback
const initialFormData = {
  artistName: '',
  artistNameEn: '',
  labelName: '',
  genre: [],
  biography: '',
  socialLinks: {},
  artistType: 'SOLO',
  members: [],
  albumTitle: '',
  albumTitleEn: '',
  albumType: 'SINGLE',
  releaseDate: '',
  albumDescription: '',
  albumVersion: '',
  releaseVersion: '',
  albumGenre: [],
  albumSubgenre: [],
  tracks: [],
  files: {
    coverImage: null,
    artistPhoto: null,
    audioFiles: [],
    additionalFiles: [],
    motionArt: null,
    musicVideo: null
  },
  release: {
    distributors: [],
    priceType: 'FREE',
    price: null,
    copyrightHolder: '',
    copyrightYear: new Date().getFullYear().toString(),
    recordingCountry: 'KR',
    recordingLanguage: 'ko',
    upc: '',
    catalogNumber: '',
    territories: [],
    notes: '',
    originalReleaseDate: '',
    consumerReleaseDate: '',
    releaseTime: '00:00',
    selectedTimezone: 'Asia/Seoul',
    cRights: '',
    pRights: '',
    territoryType: 'WORLDWIDE',
    albumNotes: '',
    parentalAdvisory: 'NONE',
    preOrderEnabled: false,
    preOrderDate: '',
    releaseFormat: 'STANDARD',
    isCompilation: false,
    previouslyReleased: false,
    previousReleaseDate: '',
    previousReleaseInfo: ''
  }
}

export function useSubmissionStore() {
  const [submissionState, setSubmissionState] = useAtom(submissionAtom)
  const formData = useAtomValue(formDataAtom)
  const currentStep = useAtomValue(currentStepAtom)
  const setFormData = useSetAtom(setFormDataAtom)
  const updateFormData = useSetAtom(updateFormDataAtom)
  const setCurrentStep = useSetAtom(setCurrentStepAtom)
  const resetForm = useSetAtom(resetFormAtom)
  
  // Load from localStorage on first render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedValue = localStorage.getItem('submission-storage')
        if (storedValue) {
          const parsed = JSON.parse(storedValue)
          // Handle legacy format from zustand/redux
          if (parsed.state) {
            setSubmissionState({
              formData: parsed.state.formData || initialFormData,
              currentStep: parsed.state.currentStep || 1
            })
          } else {
            setSubmissionState(parsed)
          }
        }
      } catch (error) {
        console.warn('Failed to load submission from localStorage:', error)
      }
    }
  }, [setSubmissionState])
  
  // Save to localStorage when submission state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const dataToStore = {
          state: submissionState,
          version: 0
        }
        localStorage.setItem('submission-storage', JSON.stringify(dataToStore))
      } catch (error) {
        console.warn('Failed to save submission to localStorage:', error)
      }
    }
  }, [submissionState])
  
  return {
    formData,
    currentStep,
    setFormData: (data: any) => setFormData(data),
    updateFormData: (data: Partial<any>) => updateFormData(data),
    setCurrentStep: (step: number) => setCurrentStep(step),
    resetForm: () => resetForm()
  }
}