import type { Components } from 'react-markdown'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * `MARKDOWN` 实体的渲染器。
 *
 * X Article 没有独立的代码/表格块类型——作者写的 GFM（表格、```代码```、列表等）
 * 原样存在 `entityMap[].value.data.markdown` 里，故这里用 react-markdown + remark-gfm 呈现。
 * react-markdown 不产出 `dangerouslySetInnerHTML`，天然规避 XSS。
 */

/**
 * react-markdown 会给每个自定义组件注入 `node`（mdast 节点）。它不是合法 DOM 属性，
 * 直接 `{...props}` 会把它渲染成 HTML 属性并触发 React 警告，故统一剥离后再透传。
 */
function withoutNode<T extends { node?: unknown }>(props: T): Omit<T, 'node'> {
  const { node: _node, ...rest } = props
  return rest
}

const components: Components = {
  h1: props => <h3 className="mt-6 mb-2 text-lg font-semibold text-foreground/90" {...withoutNode(props)} />,
  h2: props => <h4 className="mt-5 mb-2 text-base font-semibold text-foreground/90" {...withoutNode(props)} />,
  h3: props => <h5 className="mt-4 mb-1.5 text-sm font-semibold text-foreground/90" {...withoutNode(props)} />,
  p: props => <p className="my-2 text-[15px] whitespace-pre-wrap leading-7 text-foreground/90" {...withoutNode(props)} />,
  ul: props => <ul className="my-2 list-disc space-y-1 pl-5 text-[15px] leading-7 text-foreground/90" {...withoutNode(props)} />,
  ol: props => <ol className="my-2 list-decimal space-y-1 pl-5 text-[15px] leading-7 text-foreground/90" {...withoutNode(props)} />,
  li: props => <li className="leading-7" {...withoutNode(props)} />,
  blockquote: props => <blockquote className="my-3 border-l-2 border-border pl-3 text-muted-foreground italic" {...withoutNode(props)} />,
  a: props => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer nofollow" {...withoutNode(props)} />,
  hr: props => <hr className="my-4 border-border" {...withoutNode(props)} />,
  strong: props => <strong className="font-semibold" {...withoutNode(props)} />,
  em: props => <em className="italic" {...withoutNode(props)} />,
  code: props => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]" {...withoutNode(props)} />,
  pre: props => <pre className="my-3 overflow-x-auto rounded-md bg-muted/60 p-3 font-mono text-[13px] leading-relaxed" {...withoutNode(props)} />,
  table: props => (
    <div className="my-3 overflow-x-auto rounded-md border border-border/60">
      <table className="w-full border-collapse text-sm" {...withoutNode(props)} />
    </div>
  ),
  thead: props => <thead className="bg-muted/40" {...withoutNode(props)} />,
  th: props => <th className="border-b border-border/60 px-3 py-2 text-left font-semibold text-foreground/90" {...withoutNode(props)} />,
  td: props => <td className="border-b border-border/40 px-3 py-2 text-muted-foreground" {...withoutNode(props)} />,
}

export function ArticleMarkdown({ text }: { text: string }) {
  return (
    <div className="article-markdown">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </Markdown>
    </div>
  )
}
