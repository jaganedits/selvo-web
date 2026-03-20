import { Outlet } from 'react-router'
import { AppSidebar } from '@/components/layout/Sidebar.tsx'
import { BottomNav } from '@/components/layout/BottomNav.tsx'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar.tsx'
import { Separator } from '@/components/ui/separator.tsx'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import { useSecondaryFirebase } from '@/hooks/use-secondary-firebase.ts'
import { processRecurring } from '@/services/recurring.service.ts'
import { TooltipProvider } from '@/components/ui/tooltip.tsx'

export function AppShell() {
  const { db, uid } = useSecondaryFirebase()

  useEffect(() => {
    processRecurring(db, uid).catch(console.error)
  }, [db, uid])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Top bar with sidebar trigger */}
          <header className="flex h-10 shrink-0 items-center gap-2 border-b px-3 lg:hidden">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="font-heading text-sm font-bold">Selvo</span>
          </header>

          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="mx-auto max-w-6xl p-3 lg:p-5">
              <Outlet />
            </div>
          </main>

          {/* Mobile Bottom Nav */}
          <BottomNav />
        </SidebarInset>

        <Toaster position="bottom-right" richColors />
      </SidebarProvider>
    </TooltipProvider>
  )
}
