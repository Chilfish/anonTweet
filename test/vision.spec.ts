import type { EnrichedTweet } from '~/types'
import { describe, expect, it } from 'vitest'
import { runImageVision } from '~/lib/vision/describeImages'
import { buildMediaUrl } from '~/lib/vision/fetchImage'
import { buildVisionMessages } from '~/lib/vision/messages'
import { parseVisionResult, resolveVisionView } from '~/lib/vision/parse'
import { getVisionPreset, VISION_PROMPT_PRESETS } from '~/lib/vision/prompts'

const DATA_URI = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'

describe('vision AC-VISION-001: AIVisionInfo 结构完整', () => {
  it('describe 结果含 description，不含 ocr 字段', () => {
    const info = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
      descriptions: [{ index: 0, description: '一只猫蹲在窗台上' }],
    })[0]!

    expect(info.index).toBe(0)
    expect(info.mode).toBe('describe')
    expect(info.promptId).toBe('describe')
    expect(info.description).toBe('一只猫蹲在窗台上')
    expect(info.originalText).toBeUndefined()
    expect(info.translatedText).toBeUndefined()
    expect(info.status).toBe('done')
    expect(typeof info.createdAt).toBe('number')
    // provider / model 由编排层回填，结构上存在占位
    expect(info.provider).toBe('')
    expect(info.model).toBe('')
  })

  it('ocr 结果含 originalText + translatedText', () => {
    const info = parseVisionResult(VISION_PROMPT_PRESETS.ocr, {
      texts: [{ index: 0, originalText: 'こんにちは', translatedText: '你好' }],
    })[0]!

    expect(info.index).toBe(0)
    expect(info.mode).toBe('ocr')
    expect(info.originalText).toBe('こんにちは')
    expect(info.translatedText).toBe('你好')
    expect(info.description).toBeUndefined()
    expect(info.status).toBe('done')
  })

  it('enrichedTweet.visionInfo 为独立可选数组，不写入 Entity', () => {
    const info = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
      descriptions: [{ index: 0, description: '描述' }],
    })[0]!
    const tweet: EnrichedTweet = {
      __typename: 'Tweet',
      id_str: '1',
      lang: 'ja',
      created_at: 'x',
      text: 'hi',
      entities: [],
      user: {
        id_str: '1',
        name: 'n',
        screen_name: 's',
        is_blue_verified: false,
        profile_image_url_https: 'https://x/i.jpg',
        profile_image_shape: 'Circle',
        verified: false,
      },
      url: 'https://x.com/s/status/1',
      visionInfo: [info],
    }
    // Entity 上不存在 visionInfo 字段
    expect('visionInfo' in (tweet.entities[0] ?? {})).toBe(false)
    // 独立数组可被挂载 / 读回
    expect(tweet.visionInfo).toHaveLength(1)
    expect(tweet.visionInfo![0]!.description).toBe('描述')
  })
})

describe('vision AC-VISION-002: describe 结构化 schema 校验', () => {
  const valid = { descriptions: [{ index: 0, description: '描述' }] }

  it('合法输入解析为 AIVisionInfo', () => {
    const out = parseVisionResult(VISION_PROMPT_PRESETS.describe, valid)
    expect(out).toHaveLength(1)
    expect(out[0]!.description).toBe('描述')
  })

  it('缺 description → 校验失败', () => {
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: 0 }] }))
      .toThrow(/schema validation failed/)
  })

  it('多余键被 schema 拒绝', () => {
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: 0, description: 'x', extra: 1 }] }))
      .toThrow(/schema validation failed/)
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: 0, description: 'x' }], extra: 1 }))
      .toThrow(/schema validation failed/)
  })

  it('index 非数字 → 校验失败', () => {
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: '0', description: 'x' }] }))
      .toThrow(/schema validation failed/)
  })
})

describe('vision AC-VISION-003: ocr 结构化 schema 校验', () => {
  const valid = { texts: [{ index: 0, originalText: 'こんにちは', translatedText: '你好' }] }

  it('合法输入解析为 AIVisionInfo', () => {
    const out = parseVisionResult(VISION_PROMPT_PRESETS.ocr, valid)
    expect(out).toHaveLength(1)
    expect(out[0]!.originalText).toBe('こんにちは')
    expect(out[0]!.translatedText).toBe('你好')
  })

  it('缺 originalText 或 translatedText → 校验失败', () => {
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [{ index: 0, translatedText: '你好' }] }))
      .toThrow(/schema validation failed/)
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [{ index: 0, originalText: 'こんにちは' }] }))
      .toThrow(/schema validation failed/)
  })

  it('空数组 → 返回空 AIVisionInfo[]（不抛错）', () => {
    expect(parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [] })).toEqual([])
  })
})

describe('vision AC-VISION-004: resolveVisionView 决策链', () => {
  const aiInfo = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
    descriptions: [{ index: 0, description: 'AI 描述' }],
  })[0]!

  it('仅 AI 结果 → 显示 AI', () => {
    const view = resolveVisionView(aiInfo)
    expect(view.hasView).toBe(true)
    expect(view.displayText).toBe('AI 描述')
    expect(view.source).toBe('ai')
  })

  it('aI 结果 + 手动覆盖 → 手动优先', () => {
    const view = resolveVisionView(aiInfo, '手动改写的内容')
    expect(view.hasView).toBe(true)
    expect(view.displayText).toBe('手动改写的内容')
    expect(view.source).toBe('manual')
    expect(view.aiInfo).toBe(aiInfo)
  })

  it('两者皆无 → 无视图', () => {
    const view = resolveVisionView(undefined)
    expect(view.hasView).toBe(false)
    expect(view.displayText).toBe('')
  })
})

describe('vision AC-VISION-005: mediaIndex → mediaDetails 映射', () => {
  const preset = VISION_PROMPT_PRESETS.describe
  const images = [
    { index: 0, dataUri: DATA_URI },
    { index: 2, dataUri: DATA_URI },
  ]

  it('只生成请求索引的图片请求（2 张 → 2 个 file part）', () => {
    const messages = buildVisionMessages({ images, preset })
    const userContent = messages[1]!.content as Array<{ type: string, data?: { data: string } }>
    const fileParts = userContent.filter(p => p.type === 'file')
    expect(fileParts).toHaveLength(2)
    // file part 为 base64 data 形态（供 openai-compatible 转 image_url）
    const part = userContent[0]!.data!
    expect(part.data).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD')
  })

  it('结果 index 与 mediaDetails 索引对应，且与 media_alt 20000+i 不冲突', () => {
    const out = parseVisionResult(preset, {
      descriptions: [
        { index: 0, description: '图 A' },
        { index: 2, description: '图 C' },
      ],
    })
    const indexes = out.map(i => i.index)
    expect(indexes).toEqual([0, 2])
    // media_alt 使用 20000+i，vision 的 0-based index 必须低于该基线
    for (const idx of indexes)
      expect(idx).toBeGreaterThanOrEqual(0)
    expect(Math.max(...indexes)).toBeLessThan(20000)
  })

  it('custom 预设回退 describe schema，按 description 清洗', () => {
    const preset = getVisionPreset('custom', '用英文描述')
    const out = parseVisionResult(preset, {
      descriptions: [{ index: 1, description: 'custom desc' }],
    })
    expect(out[0]!.mode).toBe('custom')
    expect(out[0]!.promptId).toBe('custom')
    expect(out[0]!.description).toBe('custom desc')
  })
})

describe('vision AC-VISION-005 配套: buildMediaUrl 复用 format+name 变换', () => {
  it('无 proxy，format/name 与 getMediaUrl 一致（Postmortem #005）', () => {
    const url = buildMediaUrl({
      type: 'photo',
      index: 0,
      media_url_https: 'https://pbs.twimg.com/media/x.jpg',
      original_info: { height: 100, width: 100 },
    })
    expect(url).toContain('format=jpg')
    expect(url).toContain('name=small')
    expect(url).not.toContain('proxy')
  })

  it('默认 small 缩略图（DR-5 token 成本控制），可覆盖为 medium', () => {
    const small = buildMediaUrl({
      type: 'photo',
      index: 0,
      media_url_https: 'https://pbs.twimg.com/media/x.jpg',
      original_info: { height: 100, width: 100 },
    }, 'small')
    const medium = buildMediaUrl({
      type: 'photo',
      index: 0,
      media_url_https: 'https://pbs.twimg.com/media/x.jpg',
      original_info: { height: 100, width: 100 },
    }, 'medium')
    expect(small).toContain('name=small')
    expect(medium).toContain('name=medium')
  })
})

describe('vision AC-VISION-006: 无 photo 返回空，不发起模型请求', () => {
  it('runImageVision 对无 photo 推文返回 []，假 key 不触发请求', async () => {
    const tweet: EnrichedTweet = {
      __typename: 'Tweet',
      id_str: '2',
      lang: 'ja',
      created_at: 'x',
      text: 'video only',
      entities: [],
      user: {
        id_str: '1',
        name: 'n',
        screen_name: 's',
        is_blue_verified: false,
        profile_image_url_https: 'https://x/i.jpg',
        profile_image_shape: 'Circle',
        verified: false,
      },
      url: 'https://x.com/s/status/2',
      mediaDetails: [], // 无 photo
    }

    const out = await runImageVision({
      tweet,
      mediaIndexes: [0],
      mode: 'describe',
      apiKey: 'bogus-key-for-offline-short-circuit',
      model: 'xiaomi/mimo-v2.5',
      provider: 'openrouter',
    })
    expect(out).toEqual([])
  })
})

describe('vision AC-VISION-007: withContext 注入推文上下文', () => {
  const images = [{ index: 0, dataUri: DATA_URI }]
  const textOf = (messages: ReturnType<typeof buildVisionMessages>) =>
    (messages[1]!.content as Array<{ type: string, text?: string }>)
      .filter(p => p.type === 'text')
      .map(p => p.text ?? '')
      .join(' ')

  it('withContext=true 注入推文原文与引用，false 不含上下文', () => {
    const withCtx = buildVisionMessages({
      images,
      preset: VISION_PROMPT_PRESETS.ocr,
      withContext: true,
      tweetText: 'こんにちは世界',
      quotedText: '引用推文内容',
    })
    const noCtx = buildVisionMessages({ images, preset: VISION_PROMPT_PRESETS.ocr, withContext: false })

    expect(textOf(withCtx)).toContain('こんにちは世界')
    expect(textOf(withCtx)).toContain('引用推文内容')
    expect(textOf(noCtx)).not.toContain('こんにちは世界')
  })

  it('图片 file part 始终存在（含 withContext=false）', () => {
    const noCtx = buildVisionMessages({ images, preset: VISION_PROMPT_PRESETS.describe, withContext: false })
    const content = noCtx[1]!.content as Array<{ type: string }>
    const fileParts = content.filter(p => p.type === 'file')
    expect(fileParts).toHaveLength(1)
  })
})
