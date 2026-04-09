import { DashboardDataProvider } from '@/src/components/dashboard/DashboardDataProvider'
import { ShellBackdrop } from '@/src/components/layout/ShellBackdrop'
import { Sidebar } from '@/src/components/layout/Sidebar'
import { TopBar } from '@/src/components/layout/TopBar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardDataProvider>
      <div className="relative flex min-h-dvh overflow-clip">
        {/* Skip to main content — visible on keyboard focus */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-accent-mint focus:px-4 focus:py-2 focus:text-[#010204] focus:text-sm focus:font-bold focus:shadow-elevated focus:outline-none"
        >
          Skip to main content
        </a>
        <ShellBackdrop />
        <Sidebar />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <TopBar />
          <main
            id="main-content"
            tabIndex={-1}
            className="relative flex-1 overflow-y-auto focus:outline-none"
          >
            {children}
          </main>
        </div>
      </div>
    </DashboardDataProvider>
  )
}
