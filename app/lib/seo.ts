import type { MetaDescriptor } from 'react-router'

/**
 * 站点级 SEO 元信息单源（`app/lib/seo.ts`）。
 *
 * React Router 的 `<Meta />` 只渲染**最深匹配路由**的 meta：路由没写 meta 时才继承
 * 父级。因此标题/描述/robots 必须走 `meta()`，不能再在 `root.tsx` 的 `<head>` 里
 * 写死——否则同一页面会出现两个 `<title>`，路由 meta 被静态标签压掉。
 *
 * 动态详情页（推文 / IG / List / 长文）统一 `noindex, follow`：内容是第三方转载且
 * 页面集合无限，索引价值低、重复内容风险高（策略见 `docs/planning/seo-strategy.md`）。
 * 只对工具页（`/`、`/about`、`/search`）保留可索引与 canonical。
 */
export const SITE = {
  name: 'Anon Tweet',
  title: 'Anon Tweet — 匿名推文浏览器',
  description: '匿名浏览 Twitter/X 推文与 Instagram 帖子，支持 AI 翻译、回复查看与卡片导出，无需登录。',
  /** 部署示例站；自部署时由请求 origin 覆盖 */
  url: 'https://anon-tweet.chilfish.top',
  image: '/screenshots/pwa-home-wide.png',
  twitterSite: '@anonTweet',
  locale: 'zh_CN',
} as const

export interface PageMetaOptions {
  /** 页面标题（缺省用站点标题） */
  title?: string
  /** 页面描述（缺省用站点描述，建议 80–160 字） */
  description?: string
  /** canonical 相对路径，如 `/about`；仅在可索引页传 */
  canonicalPath?: string
  /** 请求 origin，用于拼绝对 canonical / og:url */
  baseUrl?: string
  /** 分享图 URL，null 表示无图（降级为 summary 卡片） */
  image?: string | null
  type?: 'website' | 'article'
  locale?: string
  /** 不收录：输出 `noindex, follow` 且不输出 canonical */
  noindex?: boolean
  extra?: MetaDescriptor[]
}

/** 内容语言 → og:locale */
export function ogLocale(lang?: string | null): string {
  switch (lang) {
    case 'zh':
      return 'zh_CN'
    case 'ja':
      return 'ja_JP'
    case 'ko':
      return 'ko_KR'
    case undefined:
    case null:
    case 'en':
      return 'en_US'
    default:
      return SITE.locale
  }
}

/**
 * 生成单页完整 meta：title / description / robots / OG / Twitter Card / canonical。
 * 每个键只输出一次，调用方不需要再手写兜底标签。
 */
export function buildMeta(options: PageMetaOptions = {}): MetaDescriptor[] {
  const {
    title = SITE.title,
    description = SITE.description,
    canonicalPath,
    baseUrl,
    image = SITE.image,
    type = 'website',
    locale = SITE.locale,
    noindex = false,
    extra = [],
  } = options

  const canonicalUrl = !noindex && canonicalPath
    ? new URL(canonicalPath, baseUrl ?? SITE.url).href
    : undefined

  const tags: MetaDescriptor[] = [
    { title },
    { name: 'description', content: description },
    {
      name: 'robots',
      content: noindex ? 'noindex, follow' : 'index, follow',
    },
    { property: 'og:site_name', content: SITE.name },
    { property: 'og:type', content: type },
    { property: 'og:locale', content: locale },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    {
      name: 'twitter:card',
      content: image ? 'summary_large_image' : 'summary',
    },
    { name: 'twitter:site', content: SITE.twitterSite },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ]

  if (canonicalUrl) {
    tags.push({ property: 'og:url', content: canonicalUrl })
    tags.push({ tagName: 'link', rel: 'canonical', href: canonicalUrl })
  }

  if (image) {
    tags.push({ property: 'og:image', content: new URL(image, baseUrl ?? SITE.url).href })
    tags.push({ name: 'twitter:image', content: new URL(image, baseUrl ?? SITE.url).href })
  }

  return [
    ...tags,
    ...extra,
  ]
}

/** 截断正文作为 description（按字符数，去掉换行） */
export function clampDescription(text: string, limit = 160): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > limit
    ? `${normalized.slice(0, limit - 3)}...`
    : normalized
}
