import { Navigate, type RouteObject } from 'react-router'
import AppLayout from './components/AppLayout'
import About from './pages/About'
import BodyMap from './pages/BodyMap'
import CheckIn from './pages/CheckIn'
import Routine from './pages/Routine'
import Setup from './pages/Setup'
import SystemDetail from './pages/SystemDetail'

// All app routes in one place (see plan/site-map.md).
// Used by App.tsx (hash router in the browser) and by tests (memory router).
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <BodyMap /> },
      { path: 'system/:id', element: <SystemDetail /> },
      { path: 'check-in', element: <CheckIn /> },
      { path: 'routine', element: <Routine /> },
      { path: 'setup', element: <Setup /> },
      { path: 'about', element: <About /> },
      // Any unknown address goes back to the Body Map
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]
