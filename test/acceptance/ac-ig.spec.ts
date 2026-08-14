import type { IGPost } from '~/types'
import fs from 'node:fs'
import path from 'node:path'
/**
 * test/acceptance/ac-ig.spec.ts
 *
 * L3 AC 语义层 — Instagram 离线验收（自 verify/modules/ig.verifier.ts 迁移，Phase B 去重）：
 * AC-IG-001~006（fixture 回归 + 纯函数 + source scan）；
 * AC-IG-007/008/009 为集成测试，迁至 test/integration/（Phase C，需 INS_COOKIES）。
 */
import { describe, expect, it } from 'vitest'
import { extractIGId, formatIGTime } from '~/lib/utils'
import { loadFixture } from '../helpers/load-fixture'

const TRANSLATE_CAPTION_REL = path.join('app', 'lib', 'translateIGCaption.ts')

describe('AC-IG Instagram offline acceptance', () => {
  it('AC-IG-001: post fixture has complete structure', () => {
    const post = loadFixture<IGPost>('ig-posts/post-with-media.json')

    expect(post.id).toBeTruthy()
    expect(post.username).toBeTruthy()
    expect(post.description).toBeDefined()
    expect(post.media?.length).toBeGreaterThan(0)
    expect(['post', 'reel', 'story', 'highlight']).toContain(post.type)
    expect(typeof post.likes).toBe('number')
    expect(post.likes).toBeGreaterThanOrEqual(0)
  })

  it('AC-IG-002: media array entries are valid', () => {
    const post = loadFixture<IGPost>('ig-posts/post-with-media.json')
    const problems: string[] = []

    for (const m of post.media || []) {
      if (!m.display_url)
        problems.push(`media[${m.num}] no display_url`)
      if (!['photo', 'video'].includes(m.type))
        problems.push(`media[${m.num}] bad type: ${m.type}`)
      if (m.type === 'video' && !m.video_url)
        problems.push(`media[${m.num}] video missing video_url`)
      if (m.width <= 0 || m.height <= 0)
        problems.push(`media[${m.num}] bad dimensions (${m.width}x${m.height})`)
    }

    expect(problems).toEqual([])
  })

  it('AC-IG-003: stories URL parsing returns username/story_id', () => {
    expect(extractIGId('https://www.instagram.com/stories/testuser/12345/')).toBe('testuser/12345')
  })

  it('AC-IG-004: post URL parsing returns shortcode', () => {
    expect(extractIGId('https://www.instagram.com/p/DWlr-eBgVfR/')).toBe('DWlr-eBgVfR')
  })

  it('AC-IG-005: formatIGTime produces distinct card/plain formats', () => {
    const testDate = '2026-03-28T12:00:00Z'
    const cardFormat = formatIGTime(testDate, 'card')
    const plainFormat = formatIGTime(testDate, 'plain')

    expect(cardFormat).toBeTruthy()
    expect(plainFormat).toBeTruthy()
    expect(cardFormat).not.toBe(plainFormat)
    expect(String(plainFormat)).toContain('2026')
  })

  it('AC-IG-006: caption translation preserves original description', () => {
    const post = loadFixture<IGPost & { captionTranslation?: string }>('ig-posts/post-with-media.json')
    const desc = post.description
    const caption = post.captionTranslation

    expect(desc).toBeTruthy()
    expect(caption).toBeTruthy()
    expect(caption).not.toBe(desc)

    // translateIGCaption 必须是纯函数 —— 返回字符串且绝不改写 post.description
    const src = fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', TRANSLATE_CAPTION_REL), 'utf8')
    expect(src).not.toMatch(/post\.description\s*=/)
  })
})
