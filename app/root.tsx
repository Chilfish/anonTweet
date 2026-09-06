import type { Route } from './+types/root'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import { ThemeProvider } from '~/components/ThemeProvider'
import { AnchoredToastProvider, ToastProvider } from '~/components/ui/toast'
import stylesheet from './app.css?url'
import { ProgressBar } from './components/progress-bar'
import { Button } from './components/ui/button'
import { useNonce } from './hooks/use-nonce'
import { registerServiceWorker } from './lib/pwa/register'
import './fonts.css'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Noto+Sans+SC:wght@400;500;700&display=swap',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap',
  },
  { rel: 'manifest', href: '/manifest.webmanifest' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const nonce = useNonce()

  return (
    <html
      lang="zh"
      className="touch-manipulation overflow-x-hidden"
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" type="image/jpeg" href="/icon.webp" />
        {/* iOS PWA 外壳：Safari 忽略多数 manifest 字段，靠这些 head 声明进入全屏 App 形态（AC-PWA-004） */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AnonTweet" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1D9BF0" />
        <title>Anon Tweet — 匿名推文浏览器</title>
        <meta name="description" content="Anon Tweet — 第三方 Twitter/X 推文浏览器，支持 AI 翻译、推文卡片导出、匿名浏览。无需登录即可查看推文内容与评论区。" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta property="og:site_name" content="Anon Tweet" />
        <meta property="og:locale" content="zh_CN" />
        <meta name="twitter:card" content="summary_large_image" />
        <Meta />
        <Links />
        {import.meta.env.DEV && (
          <script src="//unpkg.com/react-scan/dist/auto.global.js" />
        )}
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
      </body>
    </html>
  )
}

export default function App(_props: Route.ComponentProps) {
  // 生产构建下注册极简 service worker（网络透传，满足可安装判定；见 app/lib/pwa/register.ts）
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <ThemeProvider>
      <Outlet />
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
