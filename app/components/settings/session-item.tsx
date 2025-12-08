import type { authClient } from '~/lib/auth/auth.client'

import { MonitorIcon, SmartphoneIcon } from 'lucide-react'
import { formatDate, parseUserAgent } from '~/lib/utils'

export function SessionItem({
  session,
  currentSessionToken,
}: {
  session: typeof authClient.$Infer.Session.session
  currentSessionToken: string
}) {
  const { system, browser, isMobile } = parseUserAgent(session.userAgent || '')
  const isCurrentSession = session.token === currentSessionToken

  return (
    <div className="flex w-full items-center justify-between gap-4 px-4 py-3">
      <div className="flex-shrink-0">
        {isMobile ? (
          <SmartphoneIcon className="size-4 text-muted-foreground" />
        ) : (
          <MonitorIcon className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className="font-mono">
            {system}
            <small className="mx-1 text-muted-foreground">•</small>
            {browser}
          </span>
          {isCurrentSession && (
            <span className="flex h-3 flex-shrink-0 items-center gap-1 rounded-md border border-primary px-0.5 text-primary text-xs sm:h-auto sm:px-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              <span className="hidden sm:inline">当前设备</span>
            </span>
          )}
        </div>

        <div className="space-x-2 text-muted-foreground text-xs">
          <span>
            IP 地址:
            {session.ipAddress || '未知'}
          </span>
          <span>
            上次活跃:
            {' '}
            {formatDate(session.createdAt, 'yyyy/MM/dd hh:mm a')}
          </span>
        </div>
      </div>
    </div>
  )
}
