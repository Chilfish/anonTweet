import type { Route } from './+types/user'
import type { IGProfileData } from '~/types'
import { data } from 'react-router'
import { env } from '~/lib/env.server'
import { getIGProfile, getIGProfilePosts } from '~/lib/service/getIGProfile.server'
import { IG_USERNAME_RE } from '~/lib/url-detect'

/** 首屏帖子数：3 列 × 4 行；上限与 SDK 单页条数（30）对齐。 */
const DEFAULT_LIMIT = 12
const MAX_LIMIT = 30

/** 允许客户端把 `@username` 直接塞进路径。 */
const LEADING_AT_RE = /^@/

/**
 * GET /api/ig/user/{username}[?limit=12]
 *
 * 主页资料（`/{username}/info/`）+ 首屏帖子（`/{username}/posts/`）。
 * 未配置 INS_COOKIES 或上游失败时返回错误对象（HTTP 状态如实反映）。
 */
export async function loader({ params, request }: Route.LoaderArgs) {
  const username = (params.username ?? '').replace(LEADING_AT_RE, '').trim()

  if (!IG_USERNAME_RE.test(username)) {
    return data({ success: false, error: 'Invalid Instagram username' }, { status: 400 })
  }

  if (!env.INS_COOKIES) {
    return data(
      { success: false, error: 'Instagram cookies not configured (INS_COOKIES)' },
      { status: 500 },
    )
  }

  const limitParam = new URL(request.url).searchParams.get('limit')
  const parsedLimit = limitParam
    ? Number.parseInt(limitParam, 10)
    : Number.NaN
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT

  try {
    // 私有账号 / 空 feed 时 posts 可能失败或为空，但不该拖垮资料展示
    const [profile, posts] = await Promise.all([
      getIGProfile(username),
      getIGProfilePosts(username, limit).catch((postsError) => {
        console.error(`[IG] Failed to load posts for ${username}:`, postsError)
        return []
      }),
    ])

    if (!profile) {
      return data(
        { success: false, error: 'Failed to parse Instagram profile data' },
        { status: 404 },
      )
    }

    return {
      profile,
      posts,
    } satisfies IGProfileData
  }
  catch (error) {
    const cause = error as { message?: string, status?: number }
    console.error(`[IG] Failed to load profile ${username}:`, error)
    return data(
      {
        success: false,
        error: 'Failed to fetch Instagram profile',
        message: cause.message,
        status: cause.status ?? 500,
      },
      { status: cause.status ?? 500 },
    )
  }
}
