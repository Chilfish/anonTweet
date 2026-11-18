import type { Route } from './+types/about'
import { Code2, ExternalLink, ShieldCheck } from 'lucide-react'

export function meta() {
  return [
    { title: '关于 | Anon Tweet' },
    {
      name: 'description',
      content: '关于 Anon Tweet：技术栈、构建信息、数据与隐私说明、机器可读接口入口。',
    },
  ]
}

/** 版本只在服务端读取，避免把整个 package.json 打进客户端 bundle */
export async function loader() {
  const pkg = await import('../../package.json')
  return { version: pkg.version }
}

const GITHUB = 'https://github.com/Chilfish/anonTweet'

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="rounded-xl border border-border/60 bg-card/40 px-4 py-3">
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
  const builtAt = dateStr
    ? new Date(dateStr)
    : null

  return (
    <article className="w-full max-w-2xl space-y-8 text-sm leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">关于 Anon Tweet</h1>
        <p className="text-muted-foreground">
          匿名浏览 Twitter/X 推文与 Instagram 帖子的开源阅读器，支持 AI 翻译、长文阅读、回复查看、截图与 Markdown 导出。
        </p>
      </header>

      <Section title="构建">
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5">
          <dt className="text-muted-foreground">版本</dt>
          <dd className="font-mono tabular-nums">{loaderData.version}</dd>
          <dt className="text-muted-foreground">提交</dt>
          <dd>
            <a
              href={`${GITHUB}/commit/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono hover:text-foreground"
            >
              <Code2 className="size-3.5" aria-hidden />
              {hash.substring(0, 7)}
            </a>
          </dd>
          {builtAt && (
            <>
              <dt className="text-muted-foreground">构建时间</dt>
              <dd className="font-mono tabular-nums">
                {builtAt.toLocaleString('zh-CN', { hour12: false })}
              </dd>
            </>
          )}
        </dl>
      </Section>

      <Section title="数据与隐私">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">
            最近查看与翻译词典保存在浏览器 IndexedDB，主题与 API Key 等设置保存在 localStorage；
            两者都只在本机，不会上传服务端。清理站点数据即可全部删除。
          </p>
        </div>
      </Section>

      <Section title="机器可读接口">
        <ul className="space-y-1.5 text-muted-foreground">
          <li>
            <a href="/llms.txt" className="text-foreground hover:underline">/llms.txt</a>
            ：给 agent 的站点索引
          </li>
          <li>
            <a href="/openapi.json" className="text-foreground hover:underline">/openapi.json</a>
            ：全部后端接口的 OpenAPI 3.1 规范
          </li>
          <li>
            <a href="/skills/anon-tweet/SKILL.md" className="text-foreground hover:underline">/skills/anon-tweet/SKILL.md</a>
            ：按任务组织的 API 使用指南
          </li>
        </ul>
      </Section>

      <Section title="链接">
        <ul className="space-y-1.5 text-muted-foreground">
          <li>
            <a
              href={GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground hover:underline"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              GitHub 仓库
            </a>
          </li>
          <li>
            <a
              href={`${GITHUB}/blob/main/CHANGELOG.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:underline"
            >
              CHANGELOG
            </a>
            ：变更记录
          </li>
          <li>
            MIT License
          </li>
        </ul>
      </Section>
    </article>
  )
}
