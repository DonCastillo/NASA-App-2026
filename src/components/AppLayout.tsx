import { Outlet } from 'react-router'
import { useTasks } from '../state/useTasks'
import Header from './Header'
import Nav, { type NavPath } from './Nav'

// The app shell around every page (plan/site-map.md → Navigation, plan/tasks.md 3.1):
//   header on top · side nav on desktop (≥ md) · bottom nav on phones · the page in between.

export default function AppLayout() {
  // Due-task badges: Check-in while today's check-in is pending, Routine = everything pending
  const { pending } = useTasks()
  const badges: Partial<Record<NavPath, number>> = {
    '/check-in': pending.some((t) => t.id === 'daily') ? 1 : 0,
    '/routine': pending.length,
  }
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1">
        <aside className="hidden w-[200px] shrink-0 border-r border-space-700 md:block">
          <Nav variant="side" badges={badges} />
        </aside>

        {/* Extra bottom padding on phones so the fixed bottom nav never covers content */}
        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-space-700 bg-space-900 md:hidden">
        <Nav variant="bottom" badges={badges} />
      </div>
    </div>
  )
}
