import { DashboardDataProvider } from '@/src/components/dashboard/DashboardDataProvider'
import { ShellBackdrop } from '@/src/components/layout/ShellBackdrop'
import { Sidebar } from '@/src/components/layout/Sidebar'
import { TopBar } from '@/src/components/layout/TopBar'
import { SoundProvider } from '@/src/context/SoundContext'
import { StartupSoundEffect } from '@/src/components/layout/StartupSoundEffect'
import { LiveRegionProvider } from '@/src/components/layout/LiveRegion'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardDataProvider>
      <SoundProvider>
        <LiveRegionProvider>
          {/* Screen-reader scene-setter: introduces the interface to assistive tech users */}
          <p className="sr-only">
            Sentinel Nexus Mission Control — an AI agent supervision dashboard.
            Navigate sections using the sidebar on the left. Use the operator queue to
            approve or reject agent task requests. The main dashboard shows live mission
            progress, agent alignment status, and task attention boards. Sound effects
            are enabled by default and can be toggled in Settings.
          </p>
          <StartupSoundEffect />
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
        </LiveRegionProvider>
      </SoundProvider>
    </DashboardDataProvider>
  )
}
