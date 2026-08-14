import type { AITransportError } from '~/lib/ai-error'

function truncate(text: string, max: number): string {
  if (text.length <= max)
    return text
  return `${text.slice(0, max)}…`
}

/**
 * AI 连接失败详情（结构化展示）。
 *
 * 设计约束：toast 的 description 渲染在 `<p>` 容器内，因此这里只使用
 * span / code 等 phrasing 元素（通过 CSS `block` / `flex` 实现块级排版），
 * 避免 div/pre 内嵌 `<p>` 导致的非法 HTML。
 */
export function AIErrorDetail({ error }: { error: AITransportError }) {
  const hasMeta = error.statusCode != null || error.type || error.isRetryable

  return (
    <span className="mt-1 flex w-full flex-col items-stretch gap-1 text-left">
      {hasMeta && (
        <span className="flex flex-wrap items-center gap-1">
          {error.statusCode != null && (
            <code className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-destructive">
              HTTP
              {' '}
              {error.statusCode}
            </code>
          )}
          {error.type && (
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {error.type}
            </code>
          )}
          {error.isRetryable && (
            <span className="text-[10px] text-muted-foreground/70">可重试</span>
          )}
        </span>
      )}

      {error.providerMessage && (
        <span className="font-medium text-foreground">
          {error.providerMessage}
        </span>
      )}

      {error.url && (
        <span className="flex items-center gap-1">
          <span className="shrink-0 text-[10px] text-muted-foreground/70">
            端点
          </span>
          <code
            className="min-w-0 flex-1 truncate font-mono text-[10px]"
            title={error.url}
          >
            {error.url}
          </code>
        </span>
      )}

      {error.responseBody && (
        <code className="block max-h-24 overflow-hidden whitespace-pre-wrap break-all rounded-md bg-black/5 px-1.5 py-1 font-mono text-[10px] leading-relaxed dark:bg-white/10">
          {truncate(error.responseBody, 300)}
        </code>
      )}
    </span>
  )
}
