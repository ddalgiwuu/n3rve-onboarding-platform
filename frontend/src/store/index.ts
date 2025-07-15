import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import languageReducer from './languageSlice'
import savedArtistsReducer from './savedArtistsSlice'
import submissionReducer from './submissionSlice'
import submissionFormReducer from './submissionFormSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    language: languageReducer,
    savedArtists: savedArtistsReducer,
    submission: submissionReducer,
    submissionForm: submissionFormReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch