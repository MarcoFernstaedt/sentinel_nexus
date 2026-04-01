import { DashboardDataProvider } from '@/src/components/dashboard/DashboardDataProvider'
import { ShellBackdrop } from '@/src/components/layout/ShellBackdrop'
import { Sidebar } from '@/src/components/layout/Sidebar'
import { TopBar } from '@/src/components/layout/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardDataProvider>
      <div className="relative flex h-dvh overflow-hidden">
        <ShellBackdrop />
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardDataProvider>
  )
}
