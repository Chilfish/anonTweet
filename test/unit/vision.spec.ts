import type { EnrichedTweet } from '~/types'
import { describe, expect, it } from 'vitest'
import { visionInfoArraySchema } from '~/lib/validations/vision'
import { runImageVision } from '~/lib/vision/describeImages'
import { assertAllowedMediaHost, buildMediaUrl } from '~/lib/vision/fetchImage'
import { buildVisionMessages } from '~/lib/vision/messages'
import { alignVisionIndexes, applyVisionEdits, assertVisionResultCount, mergeVisionInfo, parseVisionResult, resolveVisionBlockState, resolveVisionView, VisionContentError } from '~/lib/vision/parse'
import { getVisionPreset, VISION_PROMPT_PRESETS } from '~/lib/vision/prompts'
import { parseOcrTranslation } from '~/lib/vision/translateOCR'

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

  it('ocr 结果含 originalText（纯 OCR，不含 translatedText）', () => {
    const info = parseVisionResult(VISION_PROMPT_PRESETS.ocr, {
      texts: [{ index: 0, originalText: 'こんにちは' }],
    })[0]!

    expect(info.index).toBe(0)
    expect(info.mode).toBe('ocr')
    expect(info.originalText).toBe('こんにちは')
    expect(info.translatedText).toBeUndefined()
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

  it('空字符串 / 纯空白 description → 校验失败（模型不得输出空描述）', () => {
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: 0, description: '' }] }))
      .toThrow(/schema validation failed/)
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [{ index: 0, description: '   ' }] }))
      .toThrow(/schema validation failed/)
  })

  it('带首尾空白的 description 被 trim 后通过', () => {
    const out = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
      descriptions: [{ index: 0, description: '  一只猫  ' }],
    })
    expect(out[0]!.description).toBe('一只猫')
  })
})

describe('vision AC-VISION-003: ocr 纯 OCR schema 校验', () => {
  const valid = { texts: [{ index: 0, originalText: 'こんにちは' }] }

  it('合法输入解析为 AIVisionInfo', () => {
    const out = parseVisionResult(VISION_PROMPT_PRESETS.ocr, valid)
    expect(out).toHaveLength(1)
    expect(out[0]!.originalText).toBe('こんにちは')
  })

  it('缺 originalText → 校验失败', () => {
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [{ index: 0 }] }))
      .toThrow(/schema validation failed/)
  })

  it('多余键 translatedText 被 strict 拒绝（翻译走独立翻译步）', () => {
    expect(() => parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [{ index: 0, originalText: 'x', translatedText: '你好' }] }))
      .toThrow(/schema validation failed/)
  })

  it('空数组 → 返回空 AIVisionInfo[]（不抛错）', () => {
    expect(parseVisionResult(VISION_PROMPT_PRESETS.ocr, { texts: [] })).toEqual([])
  })

  it('ocr 单图应为一个条目（多行文字合并进 originalText，含换行）', () => {
    const out = parseVisionResult(VISION_PROMPT_PRESETS.ocr, {
      texts: [{ index: 0, originalText: '第一行\n第二行' }],
    })
    expect(out).toHaveLength(1)
    expect(out[0]!.originalText).toContain('\n')
  })
})

describe('vision translate: parseOcrTranslation 宽容解析翻译结果', () => {
  it('形态 1：{ translations: [{ index, translatedText }] }', () => {
    const out = parseOcrTranslation({ translations: [{ index: 0, translatedText: '你好' }] })
    expect(out).toEqual([{ index: 0, translatedText: '你好' }])
  })

  it('形态 1 容忍多余键（多余键被剥离，不因严格校验失败）', () => {
    const out = parseOcrTranslation({ translations: [{ index: 0, translatedText: '你好', extra: 1 }], extra2: 2 })
    expect(out).toEqual([{ index: 0, translatedText: '你好' }])
  })

  it('形态 2：keyed-object { "0": "译文" }（DeepSeek 等无结构化输出模型形态）', () => {
    const out = parseOcrTranslation({ 0: '你好', 2: '再见' })
    expect(out).toEqual([
      { index: 0, translatedText: '你好' },
      { index: 2, translatedText: '再见' },
    ])
  })

  it('形态 3：裸数组 [{ index, translatedText }]', () => {
    const out = parseOcrTranslation([{ index: 0, translatedText: '你好' }])
    expect(out).toEqual([{ index: 0, translatedText: '你好' }])
  })

  it('缺 translatedText → 校验失败', () => {
    expect(() => parseOcrTranslation({ translations: [{ index: 0 }] }))
      .toThrow(/schema validation failed/)
  })
})

describe('vision AC-VISION-004: resolveVisionView 决策链', () => {
  const describeInfo = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
    descriptions: [{ index: 0, description: 'AI 描述' }],
  })[0]!
  const ocrInfo = parseVisionResult(VISION_PROMPT_PRESETS.ocr, {
    texts: [{ index: 0, originalText: 'こんにちは' }],
  })[0]!

  it('describe → 显示 description', () => {
    const view = resolveVisionView(describeInfo)
    expect(view.hasView).toBe(true)
    expect(view.displayText).toBe('AI 描述')
    expect(view.aiInfo).toBe(describeInfo)
  })

  it('ocr 无译文 → 显示原文；有译文 → 译文优先', () => {
    expect(resolveVisionView(ocrInfo).displayText).toBe('こんにちは')
    const view = resolveVisionView({ ...ocrInfo, translatedText: '你好' })
    expect(view.hasView).toBe(true)
    expect(view.displayText).toBe('你好')
    expect(view.originalText).toBe('こんにちは')
  })

  it('translatedOnly 隐藏 ocr 原文，只留译文', () => {
    const view = resolveVisionView({ ...ocrInfo, translatedText: '你好' }, { translatedOnly: true })
    expect(view.displayText).toBe('你好')
    expect(view.originalText).toBeUndefined()
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

  it('user 消息含图片 index 映射，模型不再自造 index', () => {
    const messages = buildVisionMessages({ images, preset })
    const text = (messages[1]!.content as Array<{ type: string, text?: string }>)
      .filter(p => p.type === 'text')
      .map(p => p.text ?? '')
      .join(' ')
    expect(text).toContain('0, 2')
    // 索引映射文本不影响 withContext 上下文注入
    expect(text).not.toContain('推文原文')
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

describe('vision Phase 4: mergeVisionInfo 合并 AI 生成结果', () => {
  const base = [
    { index: 0, mode: 'describe' as const, promptId: 'describe', provider: '', model: '', description: '旧描述 0', status: 'done' as const, createdAt: 1 },
    { index: 1, mode: 'describe' as const, promptId: 'describe', provider: '', model: '', description: '旧描述 1', status: 'done' as const, createdAt: 1 },
  ]

  it('incoming 命中 index 时整体替换（直接编辑模型，无手动覆盖层）', () => {
    const merged = mergeVisionInfo(
      [{ ...base[0]!, description: '旧 0' }, base[1]!],
      [{ index: 0, mode: 'describe', promptId: 'describe', provider: 'openrouter', model: 'm', description: '新 0', status: 'done', createdAt: 2 }],
    )
    const hit = merged.find(v => v.index === 0)!
    expect(hit.description).toBe('新 0')
    expect(hit.provider).toBe('openrouter')
    expect(merged).toHaveLength(2)
  })

  it('未命中的 index 保留，结果按 index 排序', () => {
    const merged = mergeVisionInfo(base, [
      { index: 0, mode: 'describe', promptId: 'describe', provider: '', model: '', description: '新 0', status: 'done', createdAt: 2 },
    ])
    expect(merged.map(v => v.index)).toEqual([0, 1])
    expect(merged[1]!.description).toBe('旧描述 1')
  })
})

describe('vision Phase 4: applyVisionEdits 直接编辑草稿保存', () => {
  const base = [
    { index: 0, mode: 'describe' as const, promptId: 'describe', provider: '', model: '', description: 'AI 0', status: 'done' as const, createdAt: 1 },
    { index: 1, mode: 'describe' as const, promptId: 'describe', provider: '', model: '', description: 'AI 1', status: 'done' as const, createdAt: 1 },
  ]

  it('describe 草稿 → 写 description；无草稿的图保留 AI 结果', () => {
    const out = applyVisionEdits(base, { 0: { description: '手动改写 0' } }, [0, 1])
    expect(out.find(v => v.index === 0)!.description).toBe('手动改写 0')
    expect(out.find(v => v.index === 1)!.description).toBe('AI 1')
  })

  it('空草稿 → 保留已有条目', () => {
    const out = applyVisionEdits(base, { 0: {} }, [0, 1])
    expect(out).toHaveLength(2)
    expect(out[0]!.description).toBe('AI 0')
  })

  it('无 AI 条目的图 + ocr 草稿 → 创建手动 ocr 条目（原文+译文）', () => {
    const out = applyVisionEdits(base, { 2: { originalText: '原文', translatedText: '译文' } }, [0, 1, 2])
    const manual = out.find(v => v.index === 2)!
    expect(manual.mode).toBe('ocr')
    expect(manual.originalText).toBe('原文')
    expect(manual.translatedText).toBe('译文')
    expect(out.map(v => v.index)).toEqual([0, 1, 2])
  })

  it('ocr 条目清空译文 → translatedText 被清掉，原文保留', () => {
    const ocrBase = [
      { index: 0, mode: 'ocr' as const, promptId: 'ocr', provider: '', model: '', originalText: '原文', translatedText: '旧译文', status: 'done' as const, createdAt: 1 },
    ]
    const out = applyVisionEdits(ocrBase, { 0: { originalText: '原文', translatedText: '' } }, [0])
    expect(out[0]!.originalText).toBe('原文')
    expect(out[0]!.translatedText).toBe('')
  })
})

describe('vision fix: alignVisionIndexes 结果索引对齐请求', () => {
  const info = (index: number) => ({
    index,
    mode: 'describe' as const,
    promptId: 'describe',
    provider: '',
    model: '',
    description: `描述 ${index}`,
    status: 'done' as const,
    createdAt: 1,
  })

  it('结果数与请求一致 → 按序强制对齐请求索引（模型自造 index 不命中）', () => {
    // 曾出现单图（mediaIndexes [0]）返回 index 1，数量一致时按序重映射
    const out = alignVisionIndexes([info(1)], [0])
    expect(out).toHaveLength(1)
    expect(out[0]!.index).toBe(0)
    expect(out[0]!.description).toBe('描述 1')
  })

  it('多图按序对齐到请求索引', () => {
    const out = alignVisionIndexes([info(0), info(1)], [0, 2])
    expect(out.map(v => v.index)).toEqual([0, 2])
    expect(out[1]!.description).toBe('描述 1')
  })

  it('结果数不一致 → 不强制对齐，保留模型索引', () => {
    const out = alignVisionIndexes([info(0)], [0, 2])
    expect(out).toHaveLength(1)
    expect(out[0]!.index).toBe(0)
  })
})

describe('vision AC-VISION-010: resolveVisionBlockState 可见性门控（默认隐藏 + 逐推文覆盖）', () => {
  it('有内容 + 全局关 + 无覆盖 → 交互折叠 / 截图隐藏（默认不展示缓存描述）', () => {
    expect(resolveVisionBlockState({ hasContent: true, enableAIVision: false, chromeHidden: false })).toBe('collapsed')
    expect(resolveVisionBlockState({ hasContent: true, enableAIVision: false, chromeHidden: true })).toBe('hidden')
  })

  it('有内容 + 全局开 → content（截图同样展示）', () => {
    expect(resolveVisionBlockState({ hasContent: true, enableAIVision: true, chromeHidden: false })).toBe('content')
    expect(resolveVisionBlockState({ hasContent: true, enableAIVision: true, chromeHidden: true })).toBe('content')
  })

  it('逐推文覆盖优先于全局：全局关 + override true → content；全局开 + override false → 折叠/隐藏', () => {
    expect(resolveVisionBlockState({ hasContent: true, enableAIVision: false, override: true, chromeHidden: false })).toBe('content')
    expect(resolveVisionBlockState({ hasContent: true, enableAIVision: true, override: false, chromeHidden: false })).toBe('collapsed')
    expect(resolveVisionBlockState({ hasContent: true, enableAIVision: true, override: false, chromeHidden: true })).toBe('hidden')
  })

  it('无内容：仅全局开 + 交互 → cta（空态生成入口）；其余 → hidden', () => {
    expect(resolveVisionBlockState({ hasContent: false, enableAIVision: true, chromeHidden: false })).toBe('cta')
    expect(resolveVisionBlockState({ hasContent: false, enableAIVision: false, chromeHidden: false })).toBe('hidden')
    expect(resolveVisionBlockState({ hasContent: false, enableAIVision: true, chromeHidden: true })).toBe('hidden')
  })
})

describe('vision 安全: assertAllowedMediaHost host 白名单（防 SSRF）', () => {
  it('pbs.twimg.com 合法通过', () => {
    expect(assertAllowedMediaHost('https://pbs.twimg.com/media/foo.jpg?format=jpg&name=small'))
      .toBeTruthy()
  })

  it('内网/本机 host 被拒绝', () => {
    for (const url of [
      'https://127.0.0.1:8080/admin',
      'http://localhost:3000/foo.jpg',
      'https://169.254.169.254/latest/meta-data/',
      'http://10.0.0.5/secret.png',
      'https://evil.example.com/x.jpg',
    ]) {
      expect(() => assertAllowedMediaHost(url)).toThrow(/Disallowed media host/)
    }
  })
})

describe('vision 落盘校验: visionInfoArraySchema（防未认证缓存污染）', () => {
  const validItem = {
    index: 0,
    mode: 'ocr',
    promptId: 'ocr',
    provider: 'google',
    model: 'models/gemini-3-flash-preview',
    originalText: 'こんにちは',
    translatedText: '你好',
    status: 'done',
    createdAt: 1_700_000_000_000,
  }

  it('合法条目通过', () => {
    const parsed = visionInfoArraySchema.safeParse([validItem])
    expect(parsed.success).toBe(true)
  })

  it('index 越界（>= 20000 与 media_alt 冲突 / 负数）被拒绝', () => {
    expect(visionInfoArraySchema.safeParse([{ ...validItem, index: 20000 }]).success).toBe(false)
    expect(visionInfoArraySchema.safeParse([{ ...validItem, index: -1 }]).success).toBe(false)
  })

  it('重复 index 被拒绝', () => {
    expect(visionInfoArraySchema.safeParse([validItem, { ...validItem }]).success).toBe(false)
  })

  it('非法 status / 多余键被拒绝', () => {
    expect(visionInfoArraySchema.safeParse([{ ...validItem, status: 'pending' }]).success).toBe(false)
    expect(visionInfoArraySchema.safeParse([{ ...validItem, hacked: true }]).success).toBe(false)
  })
})

describe('vision AC-VISION-011: 反幻觉内容防线（空描述拒绝 + 结果数量断言）', () => {
  it('describe 空数组 → 数量断言抛 VisionContentError（模型未输出任何条目）', () => {
    const empty = parseVisionResult(VISION_PROMPT_PRESETS.describe, { descriptions: [] })
    expect(empty).toEqual([])
    expect(() => assertVisionResultCount(empty, 2)).toThrow(VisionContentError)
  })

  it('结果数量与请求图片数一致 → 不抛错', () => {
    const info = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
      descriptions: [{ index: 0, description: '图 A' }],
    })
    expect(() => assertVisionResultCount(info, 1)).not.toThrow()
  })

  it('结果数量不符（模型跳过/合并图片）→ 抛 VisionContentError，带数量信息', () => {
    const info = parseVisionResult(VISION_PROMPT_PRESETS.describe, {
      descriptions: [{ index: 0, description: '图 A' }],
    })
    expect(() => assertVisionResultCount(info, 2)).toThrow(VisionContentError)
    expect(() => assertVisionResultCount(info, 2)).toThrow(/expected 2, got 1/)
  })
})

describe('vision AC-VISION-012: 上下文丰富注入（作者/时间/实体参考/官方 alt/术语表）', () => {
  const images = [{ index: 0, dataUri: DATA_URI }]
  const textOf = (messages: ReturnType<typeof buildVisionMessages>) =>
    (messages[1]!.content as Array<{ type: string, text?: string }>)
      .filter(p => p.type === 'text')
      .map(p => p.text ?? '')
      .join(' ')

  it('术语表注入（不依赖 withContext 开关，HIGH 优先级）', () => {
    const withGlossary = buildVisionMessages({
      images,
      preset: VISION_PROMPT_PRESETS.describe,
      glossary: 'ひなぴよ -> Hinapiyo',
    })
    const text = textOf(withGlossary)
    expect(text).toContain('<Glossary>')
    expect(text).toContain('HIGH')
    expect(text).toContain('ひなぴよ -> Hinapiyo')
  })

  it('官方 alt 文本注入（不依赖 withContext 开关；空白条目被过滤）', () => {
    const withAlt = buildVisionMessages({
      images,
      preset: VISION_PROMPT_PRESETS.describe,
      mediaAltTexts: { 0: '夕阳下的海面', 1: '   ' },
    })
    const text = textOf(withAlt)
    expect(text).toContain('官方 alt 文本')
    expect(text).toContain('图 0: 夕阳下的海面')
    expect(text).not.toContain('图 1')
  })

  it('withContext=true 注入作者/发布时间/推文原文/引用/实体参考', () => {
    const messages = buildVisionMessages({
      images,
      preset: VISION_PROMPT_PRESETS.describe,
      withContext: true,
      tweetText: '今日の一枚',
      quotedText: '引用内容',
      authorName: 'test_user',
      createdAt: 'Mon Jan 01 00:00:00 +0000 2024',
      entityContext: '- <<__HASHTAG_0__>> (hashtag): #Anime\n',
    })
    const text = textOf(messages)
    expect(text).toContain('@test_user')
    expect(text).toContain('今日の一枚')
    expect(text).toContain('引用内容')
    expect(text).toContain('<<__HASHTAG_0__>>')
  })

  it('withContext=false 不含推文上下文区块，但仍含 glossary / alt（两者不随开关）', () => {
    const messages = buildVisionMessages({
      images,
      preset: VISION_PROMPT_PRESETS.describe,
      withContext: false,
      tweetText: '不应出现',
      authorName: 'test_user',
      glossary: '术语内容',
      mediaAltTexts: { 0: 'alt 内容' },
    })
    const text = textOf(messages)
    expect(text).not.toContain('推文上下文')
    expect(text).not.toContain('test_user')
    expect(text).not.toContain('不应出现')
    expect(text).toContain('术语内容')
    expect(text).toContain('alt 内容')
  })
})
