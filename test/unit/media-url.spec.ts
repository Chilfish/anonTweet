import { describe, expect, it } from 'vitest'
import { normalizeMediaUrl } from '~/lib/media-url'

/**
 * test/unit/media-url.spec.ts
 *
 * normalizeMediaUrl —— 媒体图片链接统一为 `<slug>.<ext>` 路径形态：
 * `?name=<size>&format=<ext>`（twimg query 形态）→ `.../<slug>.<ext>`。
 */

describe('normalizeMediaUrl', () => {
  it('已带扩展名的 URL 原样保留（无 query 时不变）', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/media/HPxZhM0aQAAZxz3.jpg'))
      .toBe('https://pbs.twimg.com/media/HPxZhM0aQAAZxz3.jpg')
  })

  it('query 形态 ?format=jpg&name=small → /slug.jpg', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/media/HPxZhM0aQAAZxz3?format=jpg&name=small'))
      .toBe('https://pbs.twimg.com/media/HPxZhM0aQAAZxz3.jpg')
  })

  it('参数顺序无关（?name=orig&format=png）→ /slug.png', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/card_img/2067826373734055936/2dzFQKk9?name=orig&format=png'))
      .toBe('https://pbs.twimg.com/card_img/2067826373734055936/2dzFQKk9.png')
  })

  it('多级路径 slug 同样归一', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/ext_tw_video_thumb/1/2/abc?format=jpg&name=large'))
      .toBe('https://pbs.twimg.com/ext_tw_video_thumb/1/2/abc.jpg')
  })

  it('jpg/jpeg/webp 等扩展名都被识别，不被重复追加', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/media/a.jpeg?format=jpeg&name=orig'))
      .toBe('https://pbs.twimg.com/media/a.jpeg')
    expect(normalizeMediaUrl('https://pbs.twimg.com/media/b.webp'))
      .toBe('https://pbs.twimg.com/media/b.webp')
  })

  it('无关查询参数保留，仅清理 format/name', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/media/c.jpg?foo=bar&name=small'))
      .toBe('https://pbs.twimg.com/media/c.jpg?foo=bar')
  })

  it('空串 / 非法 URL 原样返回（不抛错）', () => {
    expect(normalizeMediaUrl('')).toBe('')
    expect(normalizeMediaUrl('not-a-url')).toBe('not-a-url')
  })

  it('无扩展名且无 format 参数 → 原样返回', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/media/xyz'))
      .toBe('https://pbs.twimg.com/media/xyz')
  })
})
