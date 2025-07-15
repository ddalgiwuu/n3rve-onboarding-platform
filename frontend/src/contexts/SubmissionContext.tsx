import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

const initialFormData = {
  // Artist info
  artistName: '',
  artistNameEn: '',
  labelName: '',
  genre: [],
  biography: '',
  socialLinks: {},
  artistType: 'SOLO',
  members: [],
  
  // Album info
  albumTitle: '',
  albumTitleEn: '',
  albumType: 'SINGLE',
  releaseDate: '',
  albumDescription: '',
  albumVersion: '',
  releaseVersion: '',
  albumGenre: [],
  albumSubgenre: [],
  
  // Tracks
  tracks: [],
  
  // Files
  files: {
    coverImage: null,
    artistPhoto: null,
    audioFiles: [],
    additionalFiles: [],
    motionArt: null,
    musicVideo: null
  },
  
  // Release info
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

interface SubmissionState {
  formData: typeof initialFormData
  currentStep: number
  _hasHydrated: boolean
}

interface SubmissionContextType extends SubmissionState {
  setFormData: (data: any) => void
  updateFormData: (data: Partial<any>) => void
  setCurrentStep: (step: number) => void
  resetForm: () => void
  setHasHydrated: (state: boolean) => void
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined)

const initialState: SubmissionState = {
  formData: initialFormData,
  currentStep: 1,
  _hasHydrated: false
}

export function SubmissionProvider({ children }: { children: ReactNode }) {
  const [submissionState, setSubmissionState] = useState<SubmissionState>(initialState)

  // Load from localStorage on mount
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
              currentStep: parsed.state.currentStep || 1,
              _hasHydrated: true
            })
          } else {
            setSubmissionState({ ...parsed, _hasHydrated: true })
          }
        } else {
          setSubmissionState(prev => ({ ...prev, _hasHydrated: true }))
        }
      } catch (error) {
        console.warn('Failed to load submission from localStorage:', error)
        setSubmissionState(prev => ({ ...prev, _hasHydrated: true }))
      }
    }
  }, [])

  // Save to localStorage when submission state changes
  useEffect(() => {
    if (typeof window !== 'undefined' && submissionState._hasHydrated) {
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

  const setFormData = (data: any) => {
    setSubmissionState(prev => ({
      ...prev,
      formData: data,
      _hasHydrated: true
    }))
  }

  const updateFormData = (data: Partial<any>) => {
    setSubmissionState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...data },
      _hasHydrated: true
    }))
  }

  const setCurrentStep = (step: number) => {
    setSubmissionState(prev => ({
      ...prev,
      currentStep: step,
      _hasHydrated: true
    }))
  }

  const resetForm = () => {
    setSubmissionState({
      formData: initialFormData,
      currentStep: 1,
      _hasHydrated: true
    })
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('submission-storage')
      } catch (error) {
        console.warn('Failed to remove submission from localStorage:', error)
      }
    }
  }

  const setHasHydrated = (state: boolean) => {
    setSubmissionState(prev => ({ ...prev, _hasHydrated: state }))
  }

  const value: SubmissionContextType = {
    ...submissionState,
    setFormData,
    updateFormData,
    setCurrentStep,
    resetForm,
    setHasHydrated
  }

  return (
    <SubmissionContext.Provider value={value}>
      {children}
    </SubmissionContext.Provider>
  )
}

export function useSubmissionStore() {
  const context = useContext(SubmissionContext)
  if (context === undefined) {
    throw new Error('useSubmissionStore must be used within a SubmissionProvider')
  }
  return context
}