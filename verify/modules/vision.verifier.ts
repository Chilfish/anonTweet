/**
 * verify/modules/vision.verifier.ts
 *
 * Covers: AC-VISION-001 ~ AC-VISION-005（Phase 2，纯函数离线确定性）
 *         AC-VISION-006 ~ 007 在 Phase 3 扩展（依赖 runImageVision / buildVisionMessages 上下文注入）
 * Postmortem: 001（解析器零测试）、002（逻辑耦合 React）、005（媒体 URL 重复）
 *
 * 验证对象：
 * - app/types/vision.ts（AIVisionInfo 结构）
 * - app/lib/vision/prompts.ts（describe / ocr / custom 预设 + strict schema）
 * - app/lib/vision/parse.ts（parseVisionResult / resolveVisionView 决策链）
 * - app/lib/vision/messages.ts（buildVisionMessages 图片 file part + index 语义）
 */

import type { StepResult, Verifier, VerifyContext } from '../framework/types.js'
import type { VisionImageInput } from '~/lib/vision/messages.js'
import type { EnrichedTweet } from '~/types'
import type { AIVisionInfo } from '~/types/vision'
import fs from 'node:fs'
import path from 'node:path'
import { buildVisionMessages } from '~/lib/vision/messages.js'
import { parseVisionResult, resolveVisionView } from '~/lib/vision/parse.js'
import { VISION_PROMPT_PRESETS } from '~/lib/vision/prompts.js'

function loadFixture<T = unknown>(fixtureDir: string, name: string): T {
  const filepath = path.join(fixtureDir, name)
  const raw = fs.readFileSync(filepath, 'utf8')
  const parsed = JSON.parse(raw)
  // tweet 类 fixture 形如 { _meta, data: EnrichedTweet }，直接解包
  return (parsed.data ?? parsed.items ?? parsed) as T
}

const DATA_URI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'

export class VisionVerifier implements Verifier {
  readonly id = 'vision-pipeline'
  readonly module = 'vision'
  readonly label = 'Vision Pipeline'
  readonly acIds = [
    'AC-VISION-001',
    'AC-VISION-002',
    'AC-VISION-003',
    'AC-VISION-004',
    'AC-VISION-005',
  ]

  canRun(_ctx: VerifyContext): string | null {
    return null // All offline
  }

  async run(ctx: VerifyContext): Promise<StepResult[]> {
    const results: StepResult[] = []
    const tweet = loadFixture<EnrichedTweet>(ctx.fixtureDir, 'vision/tweet-multi-photo.json')

    results.push(this.verifyStructure())
    results.push(this.verifyDescribeSchema())
    results.push(this.verifyOcrSchema())
    results.push(this.verifyResolveView())
    results.push(this.verifyMediaIndexMapping(tweet))

    return results
  }

  private pass(id: string, name: string, detail: string): StepResult {
    return { id, name, verdict: 'PASS', durationMs: 0, detail }
  }

  private fail(id: string, name: string, error: string): StepResult {
    return { id, name, verdict: 'FAIL', durationMs: 0, error }
  }

  // ── AC-VISION-001: AIVisionInfo 结构完整 ──────────────────
  private verifyStructure(): StepResult {
    try {
      const describe = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
        descriptions: [{ index: 0, description: '一只猫蹲在窗台上' }],
      })[0]!
      const ocr = parseVisionResult(VISION_PROMPT_PRESETS.ocr, {
        texts: [{ index: 0, originalText: 'こんにちは', translatedText: '你好' }],
      })[0]!

      const describeOk
        = describe.index === 0
          && describe.mode === 'describe'
          && describe.promptId === 'describe'
          && describe.status === 'done'
          && typeof describe.createdAt === 'number'
          && typeof describe.provider === 'string'
          && typeof describe.model === 'string'
          && describe.description === '一只猫蹲在窗台上'
      const ocrOk
        = ocr.mode === 'ocr'
          && ocr.originalText === 'こんにちは'
          && ocr.translatedText === '你好'
          && ocr.description === undefined

      if (describeOk && ocrOk) {
        return this.pass('AC-VISION-001', 'AIVisionInfo structure', 'describe→description, ocr→originalText+translatedText, 独立于 Entity')
      }
      return this.fail('AC-VISION-001', 'AIVisionInfo structure', `describeOk:${describeOk} ocrOk:${ocrOk}`)
    }
    catch (err) {
      return this.fail('AC-VISION-001', 'AIVisionInfo structure', err instanceof Error ? err.message : String(err))
    }
  }

  // ── AC-VISION-002: describe 结构化 schema 校验 ────────────
  private verifyDescribeSchema(): StepResult {
    try {
      const valid = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
        descriptions: [{ index: 0, description: '描述' }],
      })
      const validOk = valid.length === 1 && valid[0]!.description === '描述'

      const missingDesc = throws(() =>
        parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: 0 }] }))
      const extraOuter = throws(() =>
        parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: 0, description: 'x' }], extra: 1 }))
      const extraInner = throws(() =>
        parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: 0, description: 'x', extra: 1 }] }))
      const nonNumericIndex = throws(() =>
        parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: '0', description: 'x' }] }))

      if (validOk && missingDesc && extraOuter && extraInner && nonNumericIndex) {
        return this.pass('AC-VISION-002', 'describe schema', '合法通过；缺字段/多余键/非数字 index 均被 strict 拒绝')
      }
      return this.fail('AC-VISION-002', 'describe schema', `valid:${validOk} missingDesc:${missingDesc} extraOuter:${extraOuter} extraInner:${extraInner} nonNumericIndex:${nonNumericIndex}`)
    }
    catch (err) {
      return this.fail('AC-VISION-002', 'describe schema', err instanceof Error ? err.message : String(err))
    }
  }

  // ── AC-VISION-003: ocr 结构化 schema 校验 ─────────────────
  private verifyOcrSchema(): StepResult {
    try {
      const valid = parseVisionResult(VISION_PROMPT_PRESETS.ocr, {
        texts: [{ index: 0, originalText: 'こんにちは', translatedText: '你好' }],
      })
      const validOk = valid.length === 1 && valid[0]!.originalText === 'こんにちは' && valid[0]!.translatedText === '你好'

      const missingOriginal = throws(() =>
        parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [{ index: 0, translatedText: '你好' }] }))
      const missingTranslated = throws(() =>
        parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [{ index: 0, originalText: 'こんにちは' }] }))

      const empty = parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [] })
      const emptyOk = Array.isArray(empty) && empty.length === 0

      if (validOk && missingOriginal && missingTranslated && emptyOk) {
        return this.pass('AC-VISION-003', 'ocr schema', '合法通过；缺字段拒绝；空数组返回 []')
      }
      return this.fail('AC-VISION-003', 'ocr schema', `valid:${validOk} missingOriginal:${missingOriginal} missingTranslated:${missingTranslated} empty:${emptyOk}`)
    }
    catch (err) {
      return this.fail('AC-VISION-003', 'ocr schema', err instanceof Error ? err.message : String(err))
    }
  }

  // ── AC-VISION-004: resolveVisionView 决策链 ───────────────
  private verifyResolveView(): StepResult {
    try {
      const aiInfo = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
        descriptions: [{ index: 0, description: 'AI 描述' }],
      })[0]!

      // 场景 1：仅 AI → 显示 AI
      const aiOnly = resolveVisionView(aiInfo)
      const aiOk = aiOnly.hasView && aiOnly.displayText === 'AI 描述' && aiOnly.source === 'ai'

      // 场景 2：AI + 手动 → 手动优先
      const manual = resolveVisionView(aiInfo, '手动改写')
      const manualOk = manual.hasView && manual.displayText === '手动改写' && manual.source === 'manual'

      // 场景 3：两者皆无 → 无视图
      const none = resolveVisionView(undefined)
      const noneOk = !none.hasView && none.displayText === ''

      if (aiOk && manualOk && noneOk) {
        return this.pass('AC-VISION-004', 'resolveVisionView chain', 'manual > ai > none')
      }
      return this.fail('AC-VISION-004', 'resolveVisionView chain', `ai:${aiOk} manual:${manualOk} none:${noneOk}`)
    }
    catch (err) {
      return this.fail('AC-VISION-004', 'resolveVisionView chain', err instanceof Error ? err.message : String(err))
    }
  }

  // ── AC-VISION-005: mediaIndex → mediaDetails 映射 ─────────
  private verifyMediaIndexMapping(tweet: EnrichedTweet): StepResult {
    try {
      const photos = (tweet.mediaDetails ?? []).filter(m => m.type === 'photo')
      if (photos.length < 3) {
        return this.fail('AC-VISION-005', 'mediaIndex mapping', `fixture needs >=3 photos, got ${photos.length}`)
      }

      // 请求 [0, 2] → 只生成 2 张图请求
      const indexes = [0, 2]
      const images: VisionImageInput[] = indexes.map(index => ({ index, dataUri: DATA_URI }))
      const messages = buildVisionMessages({ images, preset: VISION_PROMPT_PRESETS.describe })
      const userContent = messages[1]!.content as Array<{ type: string }>
      const fileParts = userContent.filter(p => p.type === 'file')
      const requestOk = fileParts.length === 2

      // 结果 index 与 mediaDetails[0]/[2] 对应，且与 media_alt 20000+i 不冲突
      const out = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
        descriptions: [
          { index: 0, description: '图 A' },
          { index: 2, description: '图 C' },
        ],
      })
      const resultIndexes = out.map(i => i.index).sort((a, b) => a - b)
      const resultOk = resultIndexes.join(',') === '0,2'
      const mediaAltNoConflict = out.every((i: AIVisionInfo) => i.index < 20000)

      if (requestOk && resultOk && mediaAltNoConflict) {
        return this.pass('AC-VISION-005', 'mediaIndex mapping', '请求/结果仅含 [0,2]；与 media_alt 20000+i 不冲突')
      }
      return this.fail('AC-VISION-005', 'mediaIndex mapping', `request:${requestOk} result:${resultOk} noConflict:${mediaAltNoConflict}`)
    }
    catch (err) {
      return this.fail('AC-VISION-005', 'mediaIndex mapping', err instanceof Error ? err.message : String(err))
    }
  }
}

function throws(fn: () => unknown): boolean {
  try {
    fn()
    return false
  }
  catch {
    return true
  }
}
