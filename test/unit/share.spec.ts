import type { EnrichedTweet, IGPost } from '~/types'
import { describe, expect, it } from 'vitest'
import {
  buildIGSharePayload,
  buildTweetSharePayload,
  canNativeShare,
  canShareFiles,
  dataUrlToFile,
  hasSharedContent,
  pickSharedInput,
  resolveShareTarget,
  shareImageOut,
} from '~/lib/share'

/**
 * AC-PWA-003/006/007 单元验证：
 * - AC-PWA-003：Web Share Target 接收决策（app/lib/share.ts）与首页 TweetInputForm
 *   手动提交同语义——可识别 X/IG 链接 → 自动跳转目标；不可识别 → 留框报错。
 * - AC-PWA-006：出向分享载荷（buildTweetSharePayload / buildIGSharePayload）与
 *   原生分享能力判定（canNativeShare，无 navigator 的环境返回 false 供降级复制链接）。
 * - AC-PWA-007：截图卡片转 File 系统分享（dataUrlToFile / canShareFiles / shareImageOut，
 *   无 navigator.canShare 的环境返回 false / 'unsupported' 供回退下载保存）。
 */

function mkTweet(overrides: Record<string, unknown> = {}): EnrichedTweet {
  return {
    id_str: '1234567890',
    url: 'https://x.com/elonmusk/status/1234567890',
    text: 'Hello world',
    user: { name: 'Elon Musk', screen_name: 'elonmusk' },
    entities: [{ type: 'text', index: 0, text: 'Hello world' }],
    ...overrides,
  } as unknown as EnrichedTweet
}

function mkIGPost(overrides: Record<string, unknown> = {}): IGPost {
  return {
    id: 'AbCdEf',
    post_id: '987654321',
    url: 'https://www.instagram.com/p/AbCdEf/',
    username: 'nasa',
    fullname: 'NASA',
    description: 'Look at this view',
    tags: [],
    likes: 10,
    type: 'post',
    media: [],
    ...overrides,
  } as unknown as IGPost
}
describe('AC-PWA-003: share target receive decision', () => {
  describe('pickSharedInput', () => {
    it('url 优先于 text / title', () => {
      expect(pickSharedInput({
        title: '我的推文',
        text: '看这条 x.com/a/status/1',
        url: 'https://x.com/a/status/1',
      })).toBe('https://x.com/a/status/1')
    })

    it('无 url 时退到 text', () => {
      expect(pickSharedInput({ text: 'https://x.com/a/status/1' })).toBe('https://x.com/a/status/1')
    })

    it('仅 title 也可用', () => {
      expect(pickSharedInput({ title: '123456' })).toBe('123456')
    })

    it('全空时返回空串', () => {
      expect(pickSharedInput({})).toBe('')
      expect(pickSharedInput({ title: '  ', url: '' })).toBe('')
    })
  })

  describe('hasSharedContent', () => {
    it('任一分字段非空即为一次分享落地', () => {
      expect(hasSharedContent({ url: 'https://x.com/a/status/1' })).toBe(true)
      expect(hasSharedContent({ text: 'hi' })).toBe(true)
      expect(hasSharedContent({})).toBe(false)
    })
  })

  describe('resolveShareTarget', () => {
    it('x status URL → /tweets/{id}', () => {
      const r = resolveShareTarget('https://x.com/elonmusk/status/1234567890')
      expect(r).toEqual({ ok: true, to: '/tweets/1234567890' })
    })

    it('twitter.com 与 mobile 前缀亦识别', () => {
      expect(resolveShareTarget('https://twitter.com/u/status/11')).toEqual({ ok: true, to: '/tweets/11' })
      expect(resolveShareTarget('https://mobile.x.com/u/status/22')).toEqual({ ok: true, to: '/tweets/22' })
    })

    it('纯数字推文 id 直接命中', () => {
      expect(resolveShareTarget('1234567890')).toEqual({ ok: true, to: '/tweets/1234567890' })
    })

    it('instagram p/ 与 reel/ → /ins/{shortcode}', () => {
      expect(resolveShareTarget('https://www.instagram.com/p/DWlr-eBgVfR/')).toEqual({ ok: true, to: '/ins/DWlr-eBgVfR' })
      expect(resolveShareTarget('https://instagram.com/reel/AbCd123/')).toEqual({ ok: true, to: '/ins/AbCd123' })
    })

    it('iG stories → /ins/{username}/{id}', () => {
      expect(resolveShareTarget('https://www.instagram.com/stories/foo/987654/')).toEqual({ ok: true, to: '/ins/foo/987654' })
    })

    it('混在正文里的 X 链接也能识别（源 App 常把正文与链接拼在 text）', () => {
      expect(resolveShareTarget('快看这个 https://x.com/a/status/42 好有趣')).toEqual({ ok: true, to: '/tweets/42' })
    })

    it('空串/纯空白 → 提示输入', () => {
      const r = resolveShareTarget('')
      expect(r.ok).toBe(false)
      if (!r.ok)
        expect(r.error).toContain('请输入')
    })

    it('不可识别文本 → ok:false 留框报错（不自动跳转）', () => {
      const r = resolveShareTarget('今天天气不错')
      expect(r.ok).toBe(false)
    })

    it('明显非 URL 的普通文本不误判为推文 id', () => {
      expect(resolveShareTarget('abc def')).toEqual({ ok: false, error: expect.any(String) })
    })
  })
})

describe('AC-PWA-006: share-out payload（Web Share 出向）', () => {
  describe('buildTweetSharePayload', () => {
    it('url 取完整链接，title 含作者名与 handle，text 为原文', () => {
      const p = buildTweetSharePayload(mkTweet())
      expect(p.url).toBe('https://x.com/elonmusk/status/1234567890')
      expect(p.title).toContain('Elon Musk')
      expect(p.title).toContain('@elonmusk')
      expect(p.text).toContain('Hello world')
    })

    it('无 url 时回退 x.com 规范链接', () => {
      const p = buildTweetSharePayload(mkTweet({ url: '' }))
      expect(p.url).toBe('https://x.com/elonmusk/status/1234567890')
    })

    it('entities 含翻译时 text 译文优先（原文不翻译段仍保留）', () => {
      const p = buildTweetSharePayload(mkTweet({
        entities: [
          { type: 'text', index: 0, text: 'Hello', translation: '你好' },
          { type: 'text', index: 1, text: ' world' },
        ],
      }))
      expect(p.text).toContain('你好')
    })

    it('无任何翻译时 text 为原文', () => {
      const p = buildTweetSharePayload(mkTweet({ entities: [{ type: 'text', index: 0, text: 'Hello world' }] }))
      expect(p.text).toBe('Hello world')
    })
  })

  describe('buildIGSharePayload', () => {
    it('url/title 来自帖子，text 优先 captionTranslation', () => {
      const p = buildIGSharePayload(mkIGPost({ captionTranslation: '看这个景色' }))
      expect(p.url).toBe('https://www.instagram.com/p/AbCdEf/')
      expect(p.title).toContain('NASA')
      expect(p.title).toContain('@nasa')
      expect(p.text).toBe('看这个景色')
    })

    it('无 captionTranslation 时回退 description 原文', () => {
      const p = buildIGSharePayload(mkIGPost())
      expect(p.text).toBe('Look at this view')
    })
  })

  describe('canNativeShare', () => {
    it('node（无 navigator.share）返回 false，供调用方降级复制链接', () => {
      expect(canNativeShare()).toBe(false)
    })
  })
})

describe('AC-PWA-007: 截图卡片以文件系统分享（Web Share Level 2 files）', () => {
  // 1x1 透明 PNG（真实 base64，非占位）
  const onePixelPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

  describe('dataUrlToFile', () => {
    it('解码 dataURL 为 File：文件名/mime 正确且字节非空', () => {
      const file = dataUrlToFile(onePixelPng, 'card.png')
      expect(file).toBeInstanceOf(File)
      expect(file.name).toBe('card.png')
      expect(file.type).toBe('image/png')
      expect(file.size).toBeGreaterThan(0)
    })

    it('负载内含 `,` 不截断（仅首个逗号作分隔）', () => {
      const withComma = `data:image/jpeg;base64,${btoa('AA,BB')}`
      const file = dataUrlToFile(withComma, 'card.jpg')
      expect(file.type).toBe('image/jpeg')
      expect(file.size).toBe(5)
    })
  })

  describe('canShareFiles', () => {
    it('node（无 navigator.canShare）返回 false', () => {
      expect(canShareFiles(dataUrlToFile(onePixelPng, 'card.png'))).toBe(false)
    })
  })

  describe('shareImageOut', () => {
    it('不支持 files 分享的环境返回 unsupported（调用方回退下载保存）', async () => {
      const outcome = await shareImageOut(dataUrlToFile(onePixelPng, 'card.png'), '标题')
      expect(outcome).toBe('unsupported')
    })
  })
})
