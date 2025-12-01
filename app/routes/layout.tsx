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
      <header className="w-full p-2 flex items-center">
        <div className="ml-auto w-fit gap-2 flex items-center rounded-full border-2 border-border/40 px-2 py-1 shadow-2xl backdrop-blur-md transition-all hover:bg-background/90">

          <SettingsPanel />
          <UserNav />
        </div>
      </header>
      <Outlet />
    </>
  )
}
