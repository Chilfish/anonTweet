import type { Route } from './+types/layout'
import { href, Outlet, redirect } from 'react-router'
import { getServerSession } from '~/lib/auth/auth.server'

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getServerSession(request)

  if (session) {
    throw redirect(href('/home'))
  }

  return null
}

export default function AuthLayout() {
  return <Outlet />
}
