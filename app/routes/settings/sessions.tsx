import type { Route } from './+types/sessions'
import { Suspense } from 'react'
import { Await, data, useNavigate } from 'react-router'

import { SignOutOfOtherSessions } from '~/components/settings/session-action'
import { SessionItem } from '~/components/settings/session-item'
import { SettingsLayout } from '~/components/settings/settings-layout'
import { Button } from '~/components/ui/button'
import { Skeleton } from '~/components/ui/skeleton'
import { useAuthUser } from '~/hooks/use-auth-user'
import { authClient } from '~/lib/auth/auth.client'
import { serverAuth } from '~/lib/auth/auth.server'
import { AppInfo } from '~/lib/config'
import { toast } from '~/lib/utils'

export const meta: Route.MetaFunction = () => {
  return [{ title: `会话 - ${AppInfo.name}` }]
}

export async function loader({ request }: Route.LoaderArgs) {
  const listSessions = serverAuth.api.listSessions({
    headers: request.headers,
  })
  return data({ listSessions })
}

export async function clientAction(_: Route.ClientActionArgs) {
  const { error } = await authClient.revokeOtherSessions()

  if (error) {
    toast.error(error.message || '发生意外错误。')
    return { status: 'error' }
  }

  toast.success('已成功退出其他会话。')
  return { status: 'success' }
}

export default function SessionsRoute({ loaderData }: Route.ComponentProps) {
  const { session } = useAuthUser()
  const navigate = useNavigate()

  return (
    <SettingsLayout
      title="会话"
      description="如有必要，您可以退出所有其他浏览器会话。下面列出了一些您最近的会话，但此列表可能不完整。如果您认为自己的帐户已被盗用，还应更新密码。"
    >
      <div className="py-4">
        <Suspense
          fallback={(
            <div className="divide-y rounded-lg border shadow-xs">
              <div className="flex flex-col gap-2 px-4 py-3">
                <Skeleton className="h-4 w-6/12" />
                <Skeleton className="h-4 w-8/12" />
              </div>
              <div className="flex flex-col gap-2 px-4 py-3">
                <Skeleton className="h-4 w-8/12" />
                <Skeleton className="h-4 w-10/12" />
              </div>
            </div>
          )}
        >
          <Await
            resolve={loaderData.listSessions}
            errorElement={(
              <div className="flex items-center justify-between rounded-lg border px-4 py-3 shadow-xs">
                <p>加载会话出错。</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate('.')
                  }}
                >
                  刷新
                </Button>
              </div>
            )}
          >
            {resolvedSessions => (
              <div className="space-y-4">
                <div className="divide-y rounded-lg border shadow-xs">
                  {resolvedSessions.length === 0 ? (
                    <div className="px-4 py-3">未找到会话。</div>
                  ) : (
                    resolvedSessions.map(item => (
                      <SessionItem
                        key={item.token}
                        session={item}
                        currentSessionToken={session.token}
                      />
                    ))
                  )}
                </div>
                {resolvedSessions.length > 1 && <SignOutOfOtherSessions />}
              </div>
            )}
          </Await>
        </Suspense>
      </div>
    </SettingsLayout>
  )
}
