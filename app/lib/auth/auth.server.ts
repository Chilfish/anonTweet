import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, lastLoginMethod } from 'better-auth/plugins'
import { cache } from 'react'
import { db } from '~/lib/database/db.server'
import { s3Client } from '~/lib/s3Storage'
import { env } from '../env.server'

const baseURL = env.BETTER_AUTH_URL

export const serverAuth = betterAuth({
  baseURL,
  trustedOrigins: [baseURL],
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  secondaryStorage: {
    get: (key: string) => s3Client.getJson(`_auth:${key}`),
    set: (key: string, value: any) => s3Client.setJson(`_auth:${key}`, value),
    delete: (key: string) => s3Client.delete(`_auth:${key}`),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }) => {
      if (env.ENVIRONMENT === 'development') {
        console.log('Send email to reset password')
        console.log('User', user)
        console.log('URL', url)
        console.log('Token', token)
      }
      else {
        // Send email to user ...
      }
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      if (env.ENVIRONMENT === 'development') {
        console.log('Send email to verify email address')
        console.log(user, url, token)
      }
      else {
        // Send email to user ...
      }
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: true,
      trustedProviders: ['google', 'github'],
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      afterDelete: async (user) => {
        if (user.image) {
          await deleteUserImageFromR2(user.image)
        }
      },
    },
  },
  rateLimit: {
    enabled: true,
    storage: 'secondary-storage',
    window: 60, // time window in seconds
    max: 10, // max requests in the window
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'],
    },
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      adminUserIds: ['F9CgW4v5USKvUNTIGBiafa6xrgDjaOhS'],
      impersonationSessionDuration: 60 * 60 * 24, // 1 day
    }),
    lastLoginMethod(),
  ],
})

export const getServerSession = cache(async (request: Request) => {
  const session = await serverAuth.api.getSession({
    headers: request.headers,
  })
  return session
})

export async function deleteUserImageFromR2(imageUrl: string | null) {
  if (!imageUrl)
    return

  await s3Client.deleteByPublicUrl(imageUrl)
}

export type AuthServerSession = Awaited<
  ReturnType<typeof serverAuth.api.getSession>
>
