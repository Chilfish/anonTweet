import type { Route } from './+types/root'
import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  data,
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from 'react-router'
import { ThemeProvider } from '~/components/ThemeProvider'
import { AnchoredToastProvider, ToastProvider } from '~/components/ui/toast'
import stylesheet from './app.css?url'
import { ProgressBar } from './components/progress-bar'
import { Button } from './components/ui/button'
import { Toaster } from './components/ui/sonner'
import { useNonce } from './hooks/use-nonce'
import {
  ColorSchemeScript,
  useColorScheme,
} from './lib/color-scheme/components'
import { parseColorScheme } from './lib/color-scheme/server'
import { getPublicEnv } from './lib/env.server'
import { requestMiddleware } from './lib/http.server'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export async function loader({ request }: Route.LoaderArgs) {
  await requestMiddleware(request)
  const colorScheme = await parseColorScheme(request)

  return data({ ENV: getPublicEnv(), colorScheme })
}

export function Layout({ children }: { children: React.ReactNode }) {
  const navigation = useNavigation()
  const isNavigating = Boolean(navigation.location)
  const navToHome = navigation.location?.pathname === '/'
  const showSkeleton = isNavigating && !navToHome
  const nonce = useNonce()
  const colorScheme = useColorScheme()

  return (
    <html
      lang="zh"
      className={`${colorScheme === 'dark' ? 'dark' : ''} touch-manipulation overflow-x-hidden`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/jpeg" href="/icon.webp" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript nonce={nonce} />
        <link rel="stylesheet" href={stylesheet} precedence="high" />
      </head>
      <body>
        <ProgressBar />

        <ToastProvider>
          <AnchoredToastProvider>
            {children}
          </AnchoredToastProvider>
        </ToastProvider>

        <ScrollRestoration getKey={location => location.pathname} />
        <Scripts nonce={nonce} />
        <Toaster theme={colorScheme} />
      </body>
    </html>
  )
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { ENV } = loaderData
  const nonce = useNonce()
  return (
    <ThemeProvider>

      <Outlet />
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(ENV)}`,
        }}
      />
    </ThemeProvider>
  )
}

export function HydrateFallback() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">加载中...</p>
    </div>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops! Something went wrong.'
  let details = 'An unexpected error occurred. Please try again later.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? 'Page Not Found' : 'An Error Occurred'
    details
      = error.status === 404
        ? 'The page you\'re looking for doesn\'t exist.'
        : error.data?.message || error.statusText
  }
  else if (error && error instanceof Error) {
    if (error.message.includes('Invalid tweet id')) {
      message = error.message
      details = 'The tweet id is invalid. Please try again.'
    }
    else {
      message = error.message
      details = 'Something went wrong.'
      stack = error.stack
    }
  }

  console.error('ErrorBoundary caught an error:', error)

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:max-w-3xl max-w-full mx-auto text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-2">
          {message}
        </h1>
        <p className="text-muted-foreground mb-6">{details}</p>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto bg-muted text-muted-foreground rounded text-left text-sm">
            <code>{stack}</code>
          </pre>
        )}
        <div
          className="mt-8 flex items-center gap-4"
        >
          <Button
            variant="link"
            render={<Link to="/" />}
          >
            返回首页
          </Button>

          <Button
            onClick={() => {
              window.location.reload()
            }}
          >
            刷新重试
          </Button>
        </div>
      </div>
    </Layout>
  )
}
