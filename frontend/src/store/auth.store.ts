// Re-export from hooks for compatibility
import { useAuthStore as useAuthStoreHook, useAuthStorePersist } from './hooks'

export const useAuthStore = Object.assign(useAuthStoreHook, {
  persist: useAuthStorePersist
})