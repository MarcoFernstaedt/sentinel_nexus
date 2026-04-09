import { DashboardDataProvider } from '@/src/components/dashboard/DashboardDataProvider'
import { ShellBackdrop } from '@/src/components/layout/ShellBackdrop'
import { Sidebar } from '@/src/components/layout/Sidebar'
import { TopBar } from '@/src/components/layout/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardDataProvider>
      <div className="relative flex min-h-dvh overflow-clip">
        <ShellBackdrop />
        <Sidebar />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="relative flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </DashboardDataProvider>
  )
}
