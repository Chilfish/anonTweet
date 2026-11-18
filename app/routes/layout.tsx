import type { Route } from './+types/layout'
import { Outlet, useNavigation } from 'react-router'
import { Layout } from '~/components/layout/Layout'
import { RouteSkeleton } from '~/components/skeletons'

export default function AuthenticatedLayout(_: Route.ComponentProps) {
  const navigation = useNavigation()
  const targetPath = navigation.location?.pathname
  return (
    <Layout>
      {/* <header className="w-full p-2 flex items-center">
        <div className="ml-auto w-fit gap-2 flex items-center rounded-full border-2 border-border/40 px-2 py-1 shadow-2xl backdrop-blur-md transition-all hover:bg-background/90">

          <SettingsPanel />
          <UserNav />
        </div>
      </header> */}

      {
        targetPath
          ? <RouteSkeleton pathname={targetPath} />
          : <Outlet />
      }

    </Layout>
  )
}
