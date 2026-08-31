import { z } from 'zod'

/**
 * GET /api/tweet/search 请求 Schema。
 *
 * - `q`：关键词（等价 TweetFilter.includeWords，多词空格分词）
 * - `type`：搜索结果类型，`top` 热门 | `latest` 最新（默认）
 * - `cursor`：上一页返回的 bottom cursor（翻页）
 * - `count`：每页数量（SearchTimeline 上限约 20，取 1..50 容错）
 */
export const searchTweetSchema = z.object({
  q: z.string().trim().min(1, '搜索关键词不能为空').max(500),
  type: z.enum(['top', 'latest']).optional().default('latest'),
  cursor: z.string().optional(),
  count: z.coerce.number().int().min(1).max(50).optional().default(20),
})

export type SearchTweetSchema = z.infer<typeof searchTweetSchema>
