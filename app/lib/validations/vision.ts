import { z } from 'zod'

/**
 * AI 视觉描述 —— 落盘校验（app/lib/validations/vision.ts）
 *
 * POST /api/ai-vision 的 save/generate 路径会把 tweet 连同 visionInfo 写回服务端
 * localCache（cache/tweet-<id>.json）。客户端不可信，落盘前必须强校验：
 * - visionInfo 结构完整、index 在 [0, 20000)（与 media_alt 的 20000+i 语义不冲突）、无重复
 * - status/createdAt 等类型精确，多余键被 strict 拒绝
 * Postmortem #007（新功能无验收）/#002（逻辑下沉 lib）。
 */

export const visionInfoItemSchema = z.object({
  /** 对应 tweet.mediaDetails 数组索引（0-based，与 media_alt 20000+i 语义一致，不冲突） */
  index: z.number().int().min(0).max(19999),
  mode: z.enum(['describe', 'ocr', 'custom']),
  promptId: z.enum(['describe', 'ocr', 'custom']),
  provider: z.string(),
  model: z.string(),
  description: z.string().optional(),
  originalText: z.string().optional(),
  translatedText: z.string().optional(),
  status: z.enum(['done', 'error']),
  error: z.string().optional(),
  createdAt: z.number().int().positive(),
}).strict()

export const visionInfoArraySchema = z.array(visionInfoItemSchema)
  .refine(arr => new Set(arr.map(v => v.index)).size === arr.length, {
    message: 'visionInfo index 不能重复',
  })

export type VisionInfoItemSchema = z.infer<typeof visionInfoItemSchema>
export type VisionInfoArraySchema = z.infer<typeof visionInfoArraySchema>
