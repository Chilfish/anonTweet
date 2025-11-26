import type { Route } from './+types/layout'
import { Link, Outlet } from 'react-router'
import { AppLogo } from '~/components/app-logo'
import { SettingsPanel } from '~/components/SettingsPanel'
import { UserNav } from '~/components/user-nav'
import { requireAuth, requireUser } from '~/middlewares/auth-guard'

export const middleware = [requireAuth]

export async function loader({ context }: Route.LoaderArgs) {
  return requireUser(context)
}

export default function AuthenticatedLayout(_: Route.ComponentProps) {
  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="flex w-full items-center justify-between p-4 sm:px-10">
          <Link to="/" className="flex items-center gap-2">
            <AppLogo />
          </Link>
          <div className="flex items-center gap-4">
            <SettingsPanel />
            <UserNav />
          </div>
        </div>
      </header>
      <Outlet />
    </>
  )
}
