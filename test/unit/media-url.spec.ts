import { describe, expect, it } from 'vitest'
import { normalizeMediaUrl, normalizeProfileImageUrl } from '~/lib/media-url'

/**
 * test/unit/media-url.spec.ts
 *
 * normalizeMediaUrl —— 媒体图片链接统一为 `<slug>.<ext>` 路径形态：
 * `?name=<size>&format=<ext>`（twimg query 形态）→ `.../<slug>.<ext>`。
 *
 * 例外：`/card_img/` 路径不支持路径形态（会 404），保留 query 并补默认
 * `format=jpg&name=large`。
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
    expect(normalizeMediaUrl('https://pbs.twimg.com/ext_tw_video_thumb/1/2/abc?name=orig&format=png'))
      .toBe('https://pbs.twimg.com/ext_tw_video_thumb/1/2/abc.png')
  })

  it('多级路径 slug 同样归一', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/ext_tw_video_thumb/1/2/abc?format=jpg&name=large'))
      .toBe('https://pbs.twimg.com/ext_tw_video_thumb/1/2/abc.jpg')
  })

  it('card_img 保留 query 形态（路径形态会 404）', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/card_img/2096230549069438976/ZRBr6uOS?format=jpg&name=large'))
      .toBe('https://pbs.twimg.com/card_img/2096230549069438976/ZRBr6uOS?format=jpg&name=large')
  })

  it('card_img 保留已有 format/name（含非默认值/顺序）', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/card_img/2067826373734055936/2dzFQKk9?name=orig&format=png'))
      .toBe('https://pbs.twimg.com/card_img/2067826373734055936/2dzFQKk9?name=orig&format=png')
    expect(normalizeMediaUrl('https://pbs.twimg.com/card_img/1/abc?format=jpg&name=small'))
      .toBe('https://pbs.twimg.com/card_img/1/abc?format=jpg&name=small')
  })

  it('card_img 缺 format/name 时补默认 format=jpg&name=large', () => {
    expect(normalizeMediaUrl('https://pbs.twimg.com/card_img/1/abc'))
      .toBe('https://pbs.twimg.com/card_img/1/abc?format=jpg&name=large')
    expect(normalizeMediaUrl('https://pbs.twimg.com/card_img/1/abc?format=png'))
      .toBe('https://pbs.twimg.com/card_img/1/abc?format=png&name=large')
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

describe('normalizeProfileImageUrl', () => {
  const base = 'https://pbs.twimg.com/profile_images/1722602835299500033/hXskVj9F'

  it('去掉头像尺寸后缀，取原始图', () => {
    expect(normalizeProfileImageUrl(`${base}_normal.png`))
      .toBe(`${base}.png`)
    expect(normalizeProfileImageUrl(`${base}_normal.jpg`))
      .toBe(`${base}.jpg`)
    expect(normalizeProfileImageUrl(`${base}_bigger.png`))
      .toBe(`${base}.png`)
    expect(normalizeProfileImageUrl(`${base}_mini.jpg`))
      .toBe(`${base}.jpg`)
    expect(normalizeProfileImageUrl(`${base}_400x400.png`))
      .toBe(`${base}.png`)
    expect(normalizeProfileImageUrl(`${base}_200x200.png`))
      .toBe(`${base}.png`)
  })

  it('无尺寸后缀时原样返回', () => {
    expect(normalizeProfileImageUrl(`${base}.png`)).toBe(`${base}.png`)
    expect(normalizeProfileImageUrl(`${base}.jpg?foo=bar`)).toBe(`${base}.jpg?foo=bar`)
  })

  it('查询串保留，只替换路径里的尺寸后缀', () => {
    expect(normalizeProfileImageUrl(`${base}_normal.png?x=1`))
      .toBe(`${base}.png?x=1`)
  })

  it('非 X 头像与空串不处理', () => {
    expect(normalizeProfileImageUrl('https://scontent.cdninstagram.com/avatar_normal.jpg'))
      .toBe('https://scontent.cdninstagram.com/avatar_normal.jpg')
    expect(normalizeProfileImageUrl('')).toBe('')
  })
})
