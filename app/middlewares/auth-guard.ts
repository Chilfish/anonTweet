import type { MiddlewareFunction } from 'react-router'
import type { AuthServerSession } from '~/lib/auth/auth.server'
import { AsyncLocalStorage } from 'node:async_hooks'
import { createContext } from 'react-router'
import { serverAuth } from '~/lib/auth/auth.server'
import { anonSession, anonUser } from '~/lib/config'

export const authContext = createContext<AuthServerSession>()
const authStorage = new AsyncLocalStorage<AuthServerSession>()

export function getCurrentSession(): AuthServerSession {
  return authStorage.getStore() ?? null
}

export function getCurrentUser() {
  const session = getCurrentSession()
  return session?.user ?? null
}

export function requireUser() {
  const session = getCurrentSession()
  if (!session) {
    throw new Error(
      'requireUser() called but no authenticated user found. '
      + 'This indicates a programming error - make sure you\'re using '
      + 'requireAuth middleware on this route!',
    )
  }
  return session
}

export const requireAuth: MiddlewareFunction = async (
  { request, context },
  next,
) => {
  let session = await serverAuth.api.getSession({
    headers: request.headers,
  })

  // 如果需要登录但用户不存在，则使用默认匿名User，但无Id
  if (!session?.user) {
    session = {
      session: anonSession,
      user: anonUser,
    }
  }
  context.set(authContext, session)
  return authStorage.run(session, next)
}
