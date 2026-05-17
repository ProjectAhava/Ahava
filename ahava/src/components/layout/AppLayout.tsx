import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar />
      <main className="flex-1 md:ml-[72px] lg:ml-56 pb-20 md:pb-0 transition-all">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  )
}
