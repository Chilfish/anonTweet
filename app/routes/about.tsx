import type { LucideIcon } from 'lucide-react'
import type { Route } from './+types/about'
import {
  Braces,
  Code2,
  ExternalLink,
  Link2,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { buildMeta } from '~/lib/seo'

export function meta({ loaderData }: Route.MetaArgs) {
  return buildMeta({
    title: '关于 | Anon Tweet',
    description: '关于 Anon Tweet：开源匿名推文 / Instagram 阅读器，含功能说明、数据与隐私边界、构建信息与机器可读接口入口。',
    canonicalPath: '/about',
    baseUrl: loaderData?.baseUrl,
  })
}

/** 版本只在服务端读取，避免把整个 package.json 打进客户端 bundle */
export async function loader({ request }: Route.LoaderArgs) {
  const pkg = await import('../../package.json')
  return { version: pkg.version, baseUrl: new URL(request.url).origin }
}

const GITHUB = 'https://github.com/Chilfish/anonTweet'

const MACHINE_READABLE = [
  {
    href: '/llms.txt',
    label: '/llms.txt',
    description: '给 agent 的站点索引、调用约定与接口示例',
  },
  {
    href: '/openapi.json',
    label: '/openapi.json',
    description: '全部 HTTP 接口的 OpenAPI 3.1 规范',
  },
  {
    href: '/skills/anon-tweet/SKILL.md',
    label: '/skills/anon-tweet/SKILL.md',
    description: '按任务组织的 API 使用指南',
  },
] as const

const LINKS = [
  {
    href: GITHUB,
    label: 'GitHub 仓库',
    description: '源码、Issues 与版本历史',
  },
  {
    href: `${GITHUB}/blob/main/CHANGELOG.md`,
    label: 'CHANGELOG',
    description: '逐版本的变更记录',
  },
  {
    href: `${GITHUB}/blob/main/LICENSE`,
    label: 'MIT License',
    description: '可自由使用、修改与分发',
  },
] as const

const linkClass
  = 'inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline'

function Rows({
  items,
}: {
  items: Array<{ label: string, value: React.ReactNode }>
}) {
  return (
    <dl className="space-y-3">
      {items.map(item => (
        <div
          key={item.label}
          className="flex flex-col gap-0.5 sm:grid sm:grid-cols-[7rem_1fr] sm:gap-5"
        >
          <dt className="text-muted-foreground/80">{item.label}</dt>
          <dd className="min-w-0 text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        {title}
      </h2>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

export default function About({ loaderData }: Route.ComponentProps) {
  const hash = typeof __GIT_HASH__ !== 'undefined'
    ? __GIT_HASH__
    : 'DEV'
  const dateStr = typeof __GIT_DATE__ !== 'undefined'
    ? __GIT_DATE__
    : ''
  const committedAt = dateStr
    ? new Date(dateStr)
    : null
  const hasCommit = hash !== 'DEV' && hash !== 'unknown'

  return (
    <article className="w-full min-w-0 max-w-2xl px-4 pb-2 sm:px-0">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">关于 Anon Tweet</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          匿名浏览 Twitter/X 推文与 Instagram 帖子的开源阅读器。无需登录，打开链接即可阅读。
        </p>
      </header>

      <div className="mt-6 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
        <Section icon={Sparkles} title="能做什么">
          <Rows
            items={[
              { label: '推文与长文', value: '查看原推、回复串与 X Article 全文' },
              { label: 'Instagram', value: '查看帖子、Story 并下载媒体' },
              { label: 'AI 翻译', value: '手动或自动翻译推文、回复、长文与配文' },
              { label: '导出', value: '截图保存为图片，或导出 Markdown' },
            ]}
          />
        </Section>

        <Section icon={ShieldCheck} title="数据与隐私">
          <Rows
            items={[
              { label: 'IndexedDB', value: '浏览历史、推文与帖子快照、翻译词典、最近搜索' },
              { label: 'localStorage', value: '主题、AI 服务商与 API Key、翻译偏好' },
              { label: '服务端', value: '只转发上游抓取与 AI 请求，不保存内容与浏览记录' },
              { label: '清除', value: '浏览器「清除站点数据」会一并删除，也可在浏览历史页手动清空' },
            ]}
          />
        </Section>

        <Section icon={Braces} title="机器可读接口">
          <ul className="space-y-2.5">
            {MACHINE_READABLE.map(endpoint => (
              <li key={endpoint.href}>
                <a href={endpoint.href} className={`${linkClass} break-all font-mono`}>
                  {endpoint.label}
                </a>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {endpoint.description}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Package} title="构建">
          <Rows
            items={[
              {
                label: '版本',
                value: <span className="font-mono tabular-nums">{loaderData.version}</span>,
              },
              {
                label: '提交',
                value: hasCommit
                  ? (
                      <a
                        href={`${GITHUB}/commit/${hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${linkClass} font-mono`}
                      >
                        <Code2 className="size-3.5 text-muted-foreground" aria-hidden />
                        {hash.substring(0, 7)}
                      </a>
                    )
                  : <span className="font-mono text-muted-foreground">DEV</span>,
              },
              ...(committedAt
                ? [
                    {
                      label: '提交时间',
                      value: (
                        <span className="font-mono tabular-nums">
                          {committedAt.toLocaleString('zh-CN', { hour12: false })}
                        </span>
                      ),
                    },
                  ]
                : []),
              { label: '运行时', value: 'Cloudflare Workers' },
              { label: '技术栈', value: 'React Router 8 · Bun · Tailwind CSS 4' },
            ]}
          />
        </Section>

        <Section icon={Link2} title="相关链接">
          <ul className="space-y-2.5">
            {LINKS.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  {link.label}
                  <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
                </a>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {link.description}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </article>
  )
}
