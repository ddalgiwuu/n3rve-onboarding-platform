import { createSlice, PayloadAction } from '@reduxjs/toolkit'

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

interface SubmissionFormState {
  formData: typeof initialFormData
  currentStep: number
}

const initialState: SubmissionFormState = {
  formData: initialFormData,
  currentStep: 1
}

// Load state from localStorage
const loadState = (): SubmissionFormState => {
  try {
    const serializedState = localStorage.getItem('submission-storage')
    if (serializedState === null) {
      return initialState
    }
    const parsed = JSON.parse(serializedState)
    return {
      formData: parsed.state?.formData || initialFormData,
      currentStep: parsed.state?.currentStep || 1
    }
  } catch (err) {
    return initialState
  }
}

// Save state to localStorage
const saveState = (state: SubmissionFormState) => {
  try {
    const serializedState = JSON.stringify({
      state: {
        formData: state.formData,
        currentStep: state.currentStep
      },
      version: 0
    })
    localStorage.setItem('submission-storage', serializedState)
  } catch {
    // Handle write errors
  }
}

const submissionFormSlice = createSlice({
  name: 'submissionForm',
  initialState: loadState(),
  reducers: {
    setFormData: (state, action: PayloadAction<any>) => {
      state.formData = action.payload
      saveState(state)
    },
    updateFormData: (state, action: PayloadAction<Partial<any>>) => {
      state.formData = { ...state.formData, ...action.payload }
      saveState(state)
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload
      saveState(state)
    },
    resetForm: (state) => {
      state.formData = initialFormData
      state.currentStep = 1
      saveState(state)
    }
  }
})

export const {
  setFormData,
  updateFormData,
  setCurrentStep,
  resetForm
} = submissionFormSlice.actions

export default submissionFormSlice.reducer