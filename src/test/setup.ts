// Runs before every test file.
import '@testing-library/jest-dom/vitest' // adds DOM matchers such as toBeInTheDocument()
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Remove what each test rendered, so tests don't see each other's pages
afterEach(() => {
  cleanup()
})
