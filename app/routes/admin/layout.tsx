import type { Route } from './+types/layout'
import { data, Outlet, redirect } from 'react-router'
import { AppHeader } from '~/components/admin/layout/header'
import { AppSidebar } from '~/components/admin/layout/sidebar'
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar'
import { requireAuth, requireUser } from '~/middlewares/auth-guard'

export const middleware = [requireAuth]

export async function loader({ context }: Route.LoaderArgs) {
  const user = requireUser(context)
  if (user.user.role !== 'admin')
    throw redirect('/')
  return data(user)
}

export default function AuthenticatedLayout(_: Route.ComponentProps) {
  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 64)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col space-y-4 p-4 sm:px-8 sm:py-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
