import type { Route } from './+types/layout'
import { Outlet, useNavigation } from 'react-router'
import { Layout } from '~/components/layout/Layout'
import { TweetSkeleton } from '~/lib/react-tweet'

export default function AuthenticatedLayout(_: Route.ComponentProps) {
  const navigation = useNavigation()
  const isNavigating = Boolean(navigation.location)
  const navToHome = navigation.location?.pathname === '/'
  const showSkeleton = isNavigating && !navToHome
  return (
    <Layout>
      {/* <header className="w-full p-2 flex items-center">
        <div className="ml-auto w-fit gap-2 flex items-center rounded-full border-2 border-border/40 px-2 py-1 shadow-2xl backdrop-blur-md transition-all hover:bg-background/90">

          <SettingsPanel />
          <UserNav />
        </div>
      </header> */}

      {
        showSkeleton ? <TweetSkeleton />
          : <Outlet />
      }

    </Layout>
  )
}
