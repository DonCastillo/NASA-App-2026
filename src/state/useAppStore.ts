import { useStore } from 'zustand'
import { type AppState, createAppStore } from './appStore'

// The app's single store instance, and a React hook to read from it.
// Usage in a component:
//   const health = useAppStore(selectHealth)
//   const selectProfile = useAppStore((s) => s.selectProfile)
export const appStore = createAppStore()

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(appStore, selector)
}
