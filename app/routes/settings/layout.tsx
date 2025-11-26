import type { Route } from './+types/layout'

import { Outlet } from 'react-router'
import { Menu } from '~/components/settings/settings-menu'

export default function Layout(_: Route.ComponentProps) {
  return (
    <>
      <Menu />
      <Outlet />
    </>
  )
}
