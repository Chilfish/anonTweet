import type { Route } from './+types/layout'
import { Outlet } from 'react-router'
import { SettingsPanel } from '~/components/translation/SettingsPanel'
import { UserNav } from '~/components/user-nav'
import { requireAuth, requireUser } from '~/middlewares/auth-guard'

export const middleware = [requireAuth]

export async function loader({ context }: Route.LoaderArgs) {
  return requireUser()
}

export default function AuthenticatedLayout(_: Route.ComponentProps) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="flex w-full items-center justify-between p-4 sm:px-10">
          <div className="flex items-center gap-4 ml-auto">
            <SettingsPanel />
            <UserNav />
          </div>
        </div>
      </header>
      <Outlet />
    </>
  )
}
