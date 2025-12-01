import type { FC, SVGProps } from 'react'
// import { GithubIcon, GoogleIcon } from '~/components/icons'

/**
 * App info
 */
export const AppInfo = {
  name: 'Anon Tweet',
  description: '匿名地查看和分享 Twitter 推文。一个简洁美观的推文查看/媒体下载器。可以手动输入推文翻译内容并导出推文卡片为图片。',
  domain: 'chilfish.top',
} as const

/**
 * Social provider configs
 */
// 1. social provider configs (note: this provider configuration should be synchronized with `~/lib/auth/auth.server.ts`)
export const SOCIAL_PROVIDER_CONFIGS = [
  // {
  //   id: 'github',
  //   name: 'GitHub',
  //   icon: GithubIcon,
  // },
  // {
  //   id: 'google',
  //   name: 'Google',
  //   icon: GoogleIcon,
  // },
] as const

// 2. Derive type from configs
export type AllowedProvider = (typeof SOCIAL_PROVIDER_CONFIGS)[number]['id']
export interface SocialProviderConfig {
  id: AllowedProvider
  name: string
  icon: FC<SVGProps<SVGSVGElement>>
}

// 3. Use z.enum needed string tuple format
// This approach is closest to the original code's intent and solves the type issue
export const ALLOWED_PROVIDERS = [
  // SOCIAL_PROVIDER_CONFIGS[0].id,
  // ...SOCIAL_PROVIDER_CONFIGS.slice(1).map(config => config.id),
] as const

export const anonUser = {
  id: 'anonymous',
  createdAt: new Date(),
  updatedAt: new Date(),
  email: '',
  emailVerified: false,
  name: '访客',
  banned: false,
}

export const anonSession = {
  id: 'anonymous',
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 'anonymous',
  expiresAt: new Date(),
  token: '',
}

export const isAnonUser = (user: any) => user.id === anonUser.id
