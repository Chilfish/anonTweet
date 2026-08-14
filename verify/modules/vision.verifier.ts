/**
 * verify/modules/vision.verifier.ts
 *
 * Covers: AC-VISION-001 ~ AC-VISION-009
 *   AC-VISION-001 ~ 005：Phase 2，纯函数离线确定性
 *   AC-VISION-006 ~ 007：Phase 3，runImageVision 无 photo 短路 + withContext 注入
 *   AC-VISION-008：Phase 5，截图路由渲染 vision 块（source scan，对齐 AC-SHOT-003）
 *   AC-VISION-009：持久化（localCache + DB，source scan）
 * Postmortem: 001（解析器零测试）、002（逻辑耦合 React）、005（媒体 URL 重复）
 *
 * 验证对象：
 * - app/types/vision.ts（AIVisionInfo 结构）
 * - app/lib/vision/prompts.ts（describe / ocr / custom 预设 + strict schema）
 * - app/lib/vision/parse.ts（parseVisionResult / resolveVisionView 决策链）
 * - app/lib/vision/messages.ts（buildVisionMessages 图片 file part + index 语义）
 * - app/lib/vision/describeImages.ts（runImageVision 编排，无 photo 短路）
 * - app/routes/api/ai/vision.ts（save/generate 持久化调用 updateTweetVisionInfo）
 * - app/lib/service/getTweet.server.ts（updateTweetVisionInfo 双层持久化实现）
 * - app/components/tweet/AIVisionBlock.tsx + PlainTweet.tsx（截图路由渲染 + waitForRenderReady）
 */

import type { StepResult, Verifier, VerifyContext } from '../framework/types.js'
import type { VisionImageInput } from '~/lib/vision/messages.js'
import type { EnrichedTweet } from '~/types'
import type { AIVisionInfo } from '~/types/vision'
import fs from 'node:fs'
import path from 'node:path'
import { runImageVision } from '~/lib/vision/describeImages.js'
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

/** 从 fixture 目录反推项目根，读取项目源码文件（source scan 用）。 */
function readProjectFile(ctx: VerifyContext, rel: string): string | null {
  const filepath = path.resolve(ctx.fixtureDir, '..', '..', rel)
  if (!fs.existsSync(filepath))
    return null
  return fs.readFileSync(filepath, 'utf8')
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
    'AC-VISION-006',
    'AC-VISION-007',
    'AC-VISION-008',
    'AC-VISION-009',
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
    results.push(await this.verifyNoPhoto(tweet))
    results.push(this.verifyWithContext(tweet))
    results.push(this.verifyScreenshotRoute(ctx))
    results.push(this.verifyPersistence(ctx))

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
        texts: [{ index: 0, originalText: 'こんにちは' }],
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
          && ocr.translatedText === undefined
          && ocr.description === undefined

      if (describeOk && ocrOk) {
        return this.pass('AC-VISION-001', 'AIVisionInfo structure', 'describe→description, ocr→originalText(纯OCR), 独立于 Entity')
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

  // ── AC-VISION-003: ocr 纯 OCR schema 校验 ─────────────────
  private verifyOcrSchema(): StepResult {
    try {
      const valid = parseVisionResult(VISION_PROMPT_PRESETS.ocr, {
        texts: [{ index: 0, originalText: 'こんにちは' }],
      })
      const validOk = valid.length === 1 && valid[0]!.originalText === 'こんにちは'

      const missingOriginal = throws(() =>
        parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [{ index: 0 }] }))
      const extraTranslated = throws(() =>
        parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [{ index: 0, originalText: 'こんにちは', translatedText: '你好' }] }))

      const empty = parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [] })
      const emptyOk = Array.isArray(empty) && empty.length === 0

      if (validOk && missingOriginal && extraTranslated && emptyOk) {
        return this.pass('AC-VISION-003', 'ocr schema', '合法通过；缺字段/多余键(translatedText)均被 strict 拒绝；空数组返回 []')
      }
      return this.fail('AC-VISION-003', 'ocr schema', `valid:${validOk} missingOriginal:${missingOriginal} extraTranslated:${extraTranslated} empty:${emptyOk}`)
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

      // 场景 1：describe → 显示描述
      const describeView = resolveVisionView(aiInfo)
      const describeOk = describeView.hasView && describeView.displayText === 'AI 描述'

      // 场景 2：ocr 有译文 → 译文优先（直接编辑模型，无手动覆盖层）
      const ocrInfo = parseVisionResult(VISION_PROMPT_PRESETS.ocr, {
        texts: [{ index: 0, originalText: 'こんにちは' }],
      })[0]!
      const ocrView = resolveVisionView({ ...ocrInfo, translatedText: '你好' })
      const ocrOk = ocrView.hasView && ocrView.displayText === '你好' && ocrView.originalText === 'こんにちは'

      // 场景 3：translatedOnly 隐藏 ocr 原文，只留译文
      const onlyView = resolveVisionView({ ...ocrInfo, translatedText: '你好' }, { translatedOnly: true })
      const onlyOk = onlyView.displayText === '你好' && onlyView.originalText === undefined

      // 场景 4：两者皆无 → 无视图
      const none = resolveVisionView(undefined)
      const noneOk = !none.hasView && none.displayText === ''

      if (describeOk && ocrOk && onlyOk && noneOk) {
        return this.pass('AC-VISION-004', 'resolveVisionView chain', 'describe>ocr:translated|original>none')
      }
      return this.fail('AC-VISION-004', 'resolveVisionView chain', `describe:${describeOk} ocr:${ocrOk} only:${onlyOk} none:${noneOk}`)
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

  // ── AC-VISION-006: 无 photo 返回空，不发起模型请求 ────────
  private async verifyNoPhoto(tweet: EnrichedTweet): Promise<StepResult> {
    try {
      const noPhotoTweet: EnrichedTweet = {
        ...tweet,
        mediaDetails: (tweet.mediaDetails ?? []).filter(m => m.type !== 'photo'),
      }

      // 用假 key：若 runImageVision 真的发起模型请求会失败/超时，返回 [] 即证明短路
      const out = await runImageVision({
        tweet: noPhotoTweet,
        mediaIndexes: [0],
        mode: 'describe',
        apiKey: 'bogus-key-for-offline-short-circuit',
        model: 'xiaomi/mimo-v2.5',
        provider: 'openrouter',
      })

      const ok = Array.isArray(out) && out.length === 0
      if (ok) {
        return this.pass('AC-VISION-006', 'no-photo short-circuit', '全 video/gif → []，未创建 provider / 未发起模型请求')
      }
      return this.fail('AC-VISION-006', 'no-photo short-circuit', `expected [] got ${JSON.stringify(out)}`)
    }
    catch (err) {
      return this.fail('AC-VISION-006', 'no-photo short-circuit', err instanceof Error ? err.message : String(err))
    }
  }

  // ── AC-VISION-007: withContext 注入推文上下文 ─────────────
  private verifyWithContext(tweet: EnrichedTweet): StepResult {
    try {
      const images: VisionImageInput[] = [{ index: 0, dataUri: DATA_URI }]
      const preset = VISION_PROMPT_PRESETS.ocr

      const withCtx = buildVisionMessages({
        images,
        preset,
        withContext: true,
        tweetText: tweet.text,
        quotedText: tweet.quotedTweet?.text,
      })
      const noCtx = buildVisionMessages({ images, preset, withContext: false })

      const textOf = (messages: ReturnType<typeof buildVisionMessages>) =>
        (messages[1]!.content as Array<{ type: string, text?: string }>)
          .filter(p => p.type === 'text')
          .map(p => p.text ?? '')
          .join(' ')

      const withCtxText = textOf(withCtx)
      const noCtxText = textOf(noCtx)

      const hasContext = withCtxText.includes(tweet.text)
      const noContext = !noCtxText.includes(tweet.text)
      const filePartOk = (withCtx[1]!.content as Array<{ type: string }>).some(p => p.type === 'file')

      if (hasContext && noContext && filePartOk) {
        return this.pass('AC-VISION-007', 'withContext injection', 'true 注入推文原文；false 不含上下文；file part 始终存在')
      }
      return this.fail('AC-VISION-007', 'withContext injection', `hasContext:${hasContext} noContext:${noContext} filePart:${filePartOk}`)
    }
    catch (err) {
      return this.fail('AC-VISION-007', 'withContext injection', err instanceof Error ? err.message : String(err))
    }
  }

  // ── AC-VISION-008: 截图路由渲染 vision 块 ──────────────
  private verifyScreenshotRoute(ctx: VerifyContext): StepResult {
    try {
      const plainTweetSrc = readProjectFile(ctx, path.join('app', 'components', 'tweet', 'PlainTweet.tsx'))
      const visionBlockSrc = readProjectFile(ctx, path.join('app', 'components', 'tweet', 'AIVisionBlock.tsx'))

      // 1. 截图路由渲染 vision 块：PlainTweet（plain.tsx → MyPlainTweet 使用）引用 AIVisionBlock
      const rendersBlock = plainTweetSrc?.includes('AIVisionBlock') ?? false
      // 2. waitForRenderReady 覆盖：AIVisionBlock 截图上下文调用（对齐 AC-SHOT-003 source scan）
      const usesRenderReady = visionBlockSrc?.includes('waitForRenderReady') ?? false

      if (rendersBlock && usesRenderReady) {
        return this.pass('AC-VISION-008', 'screenshot route renders vision block', 'PlainTweet 渲染 AIVisionBlock(hideChrome)；AIVisionBlock 使用 waitForRenderReady')
      }
      return this.fail('AC-VISION-008', 'screenshot route renders vision block', `PlainTweet renders AIVisionBlock:${rendersBlock} AIVisionBlock uses waitForRenderReady:${usesRenderReady}`)
    }
    catch (err) {
      return this.fail('AC-VISION-008', 'screenshot route renders vision block', err instanceof Error ? err.message : String(err))
    }
  }

  // ── AC-VISION-009: save/generate 持久化（localCache + DB） ──
  private verifyPersistence(ctx: VerifyContext): StepResult {
    try {
      const visionRouteSrc = readProjectFile(ctx, path.join('app', 'routes', 'api', 'ai', 'vision.ts'))
      const getTweetServerSrc = readProjectFile(ctx, path.join('app', 'lib', 'service', 'getTweet.server.ts'))

      // 1. 路由的 save / generate 都走 updateTweetVisionInfo（不再裸 setLocalCache 丢 DB）
      const routeCallsHelper = visionRouteSrc?.includes('updateTweetVisionInfo') ?? false
      const saveUsesHelper = visionRouteSrc?.split('async function handleSave')[1]?.includes('updateTweetVisionInfo') ?? false
      const generateUsesHelper = visionRouteSrc?.split('async function handleGenerate')[1]?.includes('updateTweetVisionInfo') ?? false

      // 2. helper 双层持久化：DB（isDbAvailable / db.update）+ localCache（setLocalCache）
      const helperExported = getTweetServerSrc?.includes('export async function updateTweetVisionInfo') ?? false
      const helperWritesDb = getTweetServerSrc?.split('export async function updateTweetVisionInfo')[1]?.includes('db.update') ?? false
      const helperWritesLocal = getTweetServerSrc?.split('export async function updateTweetVisionInfo')[1]?.includes('setLocalCache') ?? false

      if (routeCallsHelper && saveUsesHelper && generateUsesHelper && helperExported && helperWritesDb && helperWritesLocal) {
        return this.pass('AC-VISION-009', 'visionInfo persistence', 'save/generate → updateTweetVisionInfo（DB 字段级合并 + localCache）')
      }
      return this.fail('AC-VISION-009', 'visionInfo persistence', `routeCalls:${routeCallsHelper} save:${saveUsesHelper} generate:${generateUsesHelper} helperExported:${helperExported} db:${helperWritesDb} local:${helperWritesLocal}`)
    }
    catch (err) {
      return this.fail('AC-VISION-009', 'visionInfo persistence', err instanceof Error ? err.message : String(err))
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
