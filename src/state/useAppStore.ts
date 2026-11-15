import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import { type AppState, type AppStore, createAppStore } from './appStore'

// The app's single store instance, and React hooks to read from it.
// Usage in a component:
//   const health = useAppStore(selectHealth)
//   const selectProfile = useAppStore((s) => s.selectProfile)
//
// Components get the store from a React context that defaults to `appStore`, so the app needs no
// Provider. Tests wrap components in <AppStoreContext value={testStore}> to use a fresh store.
export const appStore = createAppStore()

export const AppStoreContext = createContext<AppStore>(appStore)

export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(useContext(AppStoreContext), selector)
}
