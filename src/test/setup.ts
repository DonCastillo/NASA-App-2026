// Runs before every test file.
import '@testing-library/jest-dom/vitest' // adds DOM matchers such as toBeInTheDocument()
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Remove what each test rendered, so tests don't see each other's pages
afterEach(() => {
  cleanup()
})

// Newer Node versions have an experimental global `localStorage` without working methods, which can
// hide jsdom's. Install a small in-memory one so tests behave like a real browser.
if (typeof window.localStorage?.setItem !== 'function') {
  const items = new Map<string, string>()
  const memoryStorage: Storage = {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, String(value)),
  }
  Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true })
}
