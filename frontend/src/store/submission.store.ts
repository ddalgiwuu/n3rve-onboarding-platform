import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SubmissionState {
  formData: any
  currentStep: number
  setFormData: (data: any) => void
  updateFormData: (data: Partial<any>) => void
  setCurrentStep: (step: number) => void
  resetForm: () => void
}

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

export const useSubmissionStore = create<SubmissionState>()(
  persist(
    (set) => ({
      formData: initialFormData,
      currentStep: 1,
      
      setFormData: (data) => set({ formData: data }),
      
      updateFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
      })),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      resetForm: () => set({
        formData: initialFormData,
        currentStep: 1
      })
    }),
    {
      name: 'submission-storage',
      partialize: (state) => ({ 
        formData: state.formData,
        currentStep: state.currentStep
      })
    }
  )
)