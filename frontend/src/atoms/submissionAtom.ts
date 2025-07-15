import { atom } from 'jotai'

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
}

const initialState: SubmissionState = {
  formData: initialFormData,
  currentStep: 1
}

// Main submission atom - simple atom without localStorage integration
export const submissionAtom = atom<SubmissionState>(initialState)

// Derived atoms
export const formDataAtom = atom(
  (get) => get(submissionAtom).formData,
  (get, set, formData: any) => {
    const current = get(submissionAtom)
    set(submissionAtom, { ...current, formData })
  }
)

export const currentStepAtom = atom(
  (get) => get(submissionAtom).currentStep,
  (get, set, step: number) => {
    const current = get(submissionAtom)
    set(submissionAtom, { ...current, currentStep: step })
  }
)

// Action atoms
export const setFormDataAtom = atom(
  null,
  (get, set, formData: any) => {
    const current = get(submissionAtom)
    set(submissionAtom, { ...current, formData })
  }
)

export const updateFormDataAtom = atom(
  null,
  (get, set, updates: Partial<any>) => {
    const current = get(submissionAtom)
    set(submissionAtom, {
      ...current,
      formData: { ...current.formData, ...updates }
    })
  }
)

export const setCurrentStepAtom = atom(
  null,
  (get, set, step: number) => {
    const current = get(submissionAtom)
    set(submissionAtom, { ...current, currentStep: step })
  }
)

export const resetFormAtom = atom(
  null,
  (get, set) => {
    set(submissionAtom, {
      formData: initialFormData,
      currentStep: 1
    })
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('submission-storage')
      } catch (error) {
        console.warn('Failed to remove submission from localStorage:', error)
      }
    }
  }
)