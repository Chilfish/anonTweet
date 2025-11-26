import type { MiddlewareFunction, RouterContextProvider } from 'react-router'
import type { AuthServerSession } from '~/lib/auth/auth.server'
import { createContext, href, redirect } from 'react-router'
import { serverAuth } from '~/lib/auth/auth.server'

export const authContext = createContext<AuthServerSession>()

export const requireAuth: MiddlewareFunction = async (
  { request, context },
  next,
) => {
  const session = await serverAuth.api.getSession({
    headers: request.headers,
  })

  // 如果需要登录但用户不存在，则重定向
  if (!session?.user) {
    const url = new URL(request.url)
    const pathname = url.pathname || '/'
    throw redirect(
      `${href('/auth/sign-in')}?redirectTo=${encodeURIComponent(pathname)}`,
    )
  }

  context.set(authContext, session)

  return next()
}

export function requireUser(context: Readonly<RouterContextProvider>) {
  const session = context.get(authContext)
  if (!session) {
    throw new Error(
      'requireUserFromContext() called but no session found in context. '
      + 'Ensure requireAuth middleware is applied to this route.',
    )
  }
  return session
}
