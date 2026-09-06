import { describe, expect, it } from 'vitest'
import {
  hasSharedContent,
  pickSharedInput,
  resolveShareTarget,
} from '~/lib/share'

/**
 * AC-PWA-003 单元验证：Web Share Target 接收决策（app/lib/share.ts）与首页
 * TweetInputForm 手动提交同语义——可识别 X/IG 链接 → 自动跳转目标；不可识别 → 留框报错。
 */
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
