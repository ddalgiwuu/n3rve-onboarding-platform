import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Submission {
  id: string
  releaseTitle: string
  artistName: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RELEASED'
  submittedAt: string
  releaseDate?: string
  albumCover?: string
}

interface SubmissionState {
  submissions: Submission[]
  currentSubmission: Submission | null
  loading: boolean
  error: string | null
}

const initialState: SubmissionState = {
  submissions: [],
  currentSubmission: null,
  loading: false,
  error: null
}

const submissionSlice = createSlice({
  name: 'submission',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    setSubmissions: (state, action: PayloadAction<Submission[]>) => {
      state.submissions = action.payload
    },
    setCurrentSubmission: (state, action: PayloadAction<Submission | null>) => {
      state.currentSubmission = action.payload
    },
    addSubmission: (state, action: PayloadAction<Submission>) => {
      state.submissions.push(action.payload)
    },
    updateSubmission: (state, action: PayloadAction<{ id: string; updates: Partial<Submission> }>) => {
      const index = state.submissions.findIndex(s => s.id === action.payload.id)
      if (index !== -1) {
        state.submissions[index] = { ...state.submissions[index], ...action.payload.updates }
      }
      if (state.currentSubmission?.id === action.payload.id) {
        state.currentSubmission = { ...state.currentSubmission, ...action.payload.updates }
      }
    },
    deleteSubmission: (state, action: PayloadAction<string>) => {
      state.submissions = state.submissions.filter(s => s.id !== action.payload)
      if (state.currentSubmission?.id === action.payload) {
        state.currentSubmission = null
      }
    }
  }
})

export const {
  setLoading,
  setError,
  setSubmissions,
  setCurrentSubmission,
  addSubmission,
  updateSubmission,
  deleteSubmission
} = submissionSlice.actions

export default submissionSlice.reducer