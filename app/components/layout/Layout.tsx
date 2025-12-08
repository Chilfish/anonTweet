import { GitCommitHorizontal, InfoIcon, XIcon } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useSearchParams } from 'react-router'
import { Button } from '~/components/ui/button'
import { formatDate } from '~/lib/react-tweet/date-utils'
import { cn } from '~/lib/utils'
import { PageHeader } from './PageHeader'

const THEME_COLOR = {
  '--primary-brand': 'oklch(0.6 0.18 260)',
  '--primary-fallback': '#1d9bf0',
} as React.CSSProperties

function MinimalBackground() {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none select-none bg-background">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[30vh] opacity-10 blur-[100px]"
        style={{ background: 'var(--primary-brand, var(--primary-fallback))' }}
      />
    </div>
  )
}

interface LinkProps {
  to: string
  className?: string
  children?: React.ReactNode
  emoji?: string
}

function FooterLink({ to, className, children, emoji }: LinkProps) {
  return (
    <a
      href={to}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 transition-colors hover:text-(--primary-brand) hover:underline underline-offset-4 decoration-dotted',
        className,
      )}
    >
      {emoji && <span className="text-[1.1em] grayscale group-hover:grayscale-0 transition-all">{emoji}</span>}
      <span>{children}</span>
    </a>
  )
}

function GitInfo() {
  const hash = typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'DEV'
  const dateStr = typeof __GIT_DATE__ !== 'undefined' ? __GIT_DATE__ : new Date()

  return (
    <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/50 font-mono mt-3 select-all">
      <span title={formatDate(new Date(dateStr))}>
        Last build:
        {' '}
        {formatDate(new Date(dateStr))}
      </span>
      <span>•</span>
      <a
        href={`https://github.com/Chilfish/anonTweet/commit/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <GitCommitHorizontal className="size-3" />
        {hash.substring(0, 7)}
      </a>
    </div>
  )
}

export function LayoutComponent({ children }: { children?: React.ReactNode }) {
  const [showFooter, setShowFooter] = useState(false)

  return (
    <div
      className="relative min-h-screen w-full flex flex-col font-sans text-foreground antialiased"
      style={THEME_COLOR}
    >
      <MinimalBackground />

      <div className="flex-1 w-full max-w-3xl mx-auto sm:px-4 pt-8 pb-12 flex flex-col items-center justify-center  animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="mb-8 w-full">
          <PageHeader />
        </div>

        {children || <Outlet />}
      </div>

      <div className="w-full py-6 flex flex-col items-center justify-center gap-4 z-10">

        <div
          className={cn(
            'w-full overflow-hidden transition-all duration-300 ease-in-out origin-bottom',
            showFooter ? 'max-h-[200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-4',
          )}
        >
          <footer className="text-center text-xs sm:text-sm text-muted-foreground space-y-3 pb-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <p>
                Made by
                {' '}
                <FooterLink to="https://space.bilibili.com/259486090">@Chilfish</FooterLink>
              </p>
              <span className="hidden sm:inline opacity-30">|</span>
              <p>
                More:
                <span className="inline-flex gap-3 ml-2">
                  <FooterLink to="https://tweet.chilfish.top/memo/240y_k">女声优存档</FooterLink>
                  <FooterLink to="https://nishio.chilfish.top/zh">西尾文明暦</FooterLink>
                  <FooterLink to="https://oshitabi.chilfish.top/">推し旅AR</FooterLink>
                  <FooterLink to="/bili">发布到B站</FooterLink>
                </span>
              </p>
            </div>

            <GitInfo />
          </footer>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFooter(!showFooter)}
          className="rounded-full h-8 w-8 p-0 text-muted-foreground/40 hover:text-(--primary-brand) hover:bg-transparent transition-all hover:scale-110"
          aria-label={showFooter ? '隐藏信息' : '显示信息'}
        >
          {showFooter ? (
            <XIcon className="size-4" />
          ) : (
            <InfoIcon className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [searchParams] = useSearchParams()
  const plain = searchParams.get('plain') === 'true'

  if (plain) {
    return (
      <div className="min-h-screen w-full bg-background font-sans antialiased" style={THEME_COLOR}>
        <Outlet />
      </div>
    )
  }

  return (
    <LayoutComponent>
      <Outlet />
    </LayoutComponent>
  )
}
