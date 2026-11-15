import { Outlet } from 'react-router'
import Header from './Header'
import Nav from './Nav'

// The app shell around every page (plan/site-map.md → Navigation, plan/tasks.md 3.1):
//   header on top · side nav on desktop (≥ md) · bottom nav on phones · the page in between.

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1">
        <aside className="hidden w-[200px] shrink-0 border-r border-space-700 md:block">
          <Nav variant="side" />
        </aside>

        {/* Extra bottom padding on phones so the fixed bottom nav never covers content */}
        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-space-700 bg-space-900 md:hidden">
        <Nav variant="bottom" />
      </div>
    </div>
  )
}
