import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Re-enable auth check when backend is ready
  // const session = await auth.api.getSession({
  //   headers: await headers(),
  // })
  // if (!session) {
  //   redirect('/auth-test')
  // }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
