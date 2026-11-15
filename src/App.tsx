import { createHashRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { routes } from './routes'

// Hash routing keeps the page address after a "#" (e.g. /#/system/heart),
// so static hosts like GitHub Pages or Netlify work without server config.
const router = createHashRouter(routes)

export default function App() {
  return <RouterProvider router={router} />
}
