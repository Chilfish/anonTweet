import type { MiddlewareFunction, RouterContextProvider } from 'react-router'
import type { AuthServerSession } from '~/lib/auth/auth.server'
import { createContext } from 'react-router'
import { serverAuth } from '~/lib/auth/auth.server'

export const authContext = createContext<AuthServerSession>()

const anonUser = {
  id: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  email: '',
  emailVerified: false,
  name: '访客',
  banned: false,
}

const anonSession = {
  id: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: '',
  expiresAt: new Date(),
  token: '',
}

export const requireAuth: MiddlewareFunction = async (
  { request, context },
  next,
) => {
  const session = await serverAuth.api.getSession({
    headers: request.headers,
  })

  // 如果需要登录但用户不存在，则使用默认匿名User，但无Id
  if (!session?.user) {
    context.set(authContext, {
      session: anonSession,
      user: anonUser,
    })

  //   const url = new URL(request.url)
  //   const pathname = url.pathname || '/'
  //   throw redirect(
  //     `${href('/auth/sign-in')}?redirectTo=${encodeURIComponent(pathname)}`,
  //   )
  }
  else {
    context.set(authContext, session)
  }
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
