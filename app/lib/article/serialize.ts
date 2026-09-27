import type { ArticleBlock, ArticleRun } from '~/types'

/**
 * 文章块 → 送入翻译模型的文本（纯函数，无服务端依赖）。
 *
 * 单独成模块的原因：`translate.ts` 引用了服务端专用的 `ai-timeout`（读到 `process`），
 * 不能被客户端 / Storybook 的 story 图引入；而序列化本身是纯逻辑，story 与翻译管线
 * 共用同一套占位符规则。
 *
 * 非文本 run（link / mention / hashtag）按出现顺序换为 `<<__LINK_n__>>`（n 从 0 起）。
 */
export function serializeArticleBlock(
  block: Extract<ArticleBlock, { runs: ArticleRun[] }>,
): { text: string, placeholders: string[] } {
  const placeholders: string[] = []
  let counter = 0
  const text = block.runs
    .map((run) => {
      if (run.type === 'text')
        return run.text
      const placeholder = `<<__LINK_${counter++}__>>`
      placeholders.push(placeholder)
      return placeholder
    })
    .join('')
  return { text, placeholders }
}
