import type { IRawAudioSpace } from '~/lib/rettiwt-api'
import type { EnrichedTweet, SpaceDetails } from '~/types'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TweetSpaceCard } from '~/components/tweet/TweetSpaceCard'
import { TweetBody } from '~/lib/react-tweet'
import { mapSpaceDetails } from '~/lib/react-tweet/utils/space'
import { loadFixture } from '../helpers/load-fixture'

/**
 * test/acceptance/space-render.spec.ts
 *
 * AC-SPACE-005~007 / 009~010 —— Space 卡片与正文去重的真实渲染测试。
 *
 * 输入为真实 fixture（`tweets/with-space-ja.json`，由线上 enrichTweet +
 * mapSpaceDetails 派生；墓碑态用已删除 Space 的真实响应 `space/audio-space-unavailable.json`），
 * 断言对齐官方卡片实测 DOM：紫色底白字、主播行、标题、`收听/回放 · 日期 · 时长`、录音按钮，
 * 且正文不再重复渲染同一个 Space 链接。
 */

const baseTweet = loadFixture<EnrichedTweet>('tweets/with-space-ja.json')

const SPACE_URL = 'https://x.com/i/spaces/1yoKMPnjEbOxQ'

// 外链必须带 noopener（安全约定）
const REL_NOOPENER_RE = /rel="[^"]*noopener/

function render(tweet: EnrichedTweet): string {
  return renderToString(createElement(TweetSpaceCard, { tweet }))
}

/** 只替换 space 字段，其余保持真实推文数据 */
function withSpace(space: SpaceDetails): EnrichedTweet {
  return { ...baseTweet, space }
}

describe('AC-SPACE-005: space card real render', () => {
  const html = render(baseTweet)

  it('AC-SPACE-005: renders the official card structure from real metadata', () => {
    // 整卡即跳转（本期不站内播放）
    expect(html).toContain(`href="${SPACE_URL}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toMatch(REL_NOOPENER_RE)

    // 主播行 + 标题
    expect(html).toContain('夢限大みゅーたいぷ')
    expect(html).toContain('ゆめみた合宿3日目！ついに最終日！')
    expect(html).toContain('コメントはハッシュタグにてお願いします')

    // 元信息行（官方卡片实测文案）
    expect(html).toContain('2,478')
    expect(html).toContain('收听/回放')
    expect(html).toContain('9月17日')
    expect(html).toContain('42:40')

    // 录音按钮 + 无障碍名称
    expect(html).toContain('播放录音')
    expect(html).toContain('aria-label="播放录音: ')
    expect(html).toContain('aria-label="时长 42:40"')
  })

  it('AC-SPACE-005: keeps decorative images silent and drops noisy labels', () => {
    // 主播头像为装饰图（名称文本已承载可访问名称，避免读屏重复朗读）
    expect(html).toContain('alt=""')
    // 不渲染冗余标签与不可辨识的小徽标
    expect(html).not.toContain('主播')
    expect(html).not.toContain('affiliate')
  })
})

describe('AC-SPACE-006: no space data renders empty string', () => {
  it('AC-SPACE-006: returns empty output when space is absent', () => {
    expect(render({ ...baseTweet, space: undefined })).toBe('')
  })
})

describe('AC-SPACE-007: body does not duplicate the space link', () => {
  it('AC-SPACE-007: hides the space url when the card is rendered', () => {
    const html = renderToString(createElement(TweetBody, { tweet: baseTweet, isTranslated: false }))

    expect(html).not.toContain(SPACE_URL)
    expect(html).not.toContain('x.com/i/spaces/1yoKM…')
  })

  it('AC-SPACE-007: keeps the space url when metadata could not be fetched', () => {
    const html = renderToString(createElement(TweetBody, {
      tweet: { ...baseTweet, space: undefined },
      isTranslated: false,
    }))

    expect(html).toContain(SPACE_URL)
  })

  it('AC-SPACE-007: leaves other url entities untouched', () => {
    const tweet: EnrichedTweet = {
      ...baseTweet,
      entities: [{
        type: 'url',
        index: 0,
        url: 'https://t.co/other',
        text: 'https://t.co/other',
        display_url: 'example.com/a',
        expanded_url: 'https://example.com/a',
        href: 'https://example.com/a',
      }],
    }

    expect(renderToString(createElement(TweetBody, { tweet, isTranslated: false })))
      .toContain('https://example.com/a')
  })
})

describe('AC-SPACE-009: deleted space renders an explanatory tombstone', () => {
  // 真实样本：推文 2057046686871232598 → Space 1DGLdvzVZmLGm 已删除（无 metadata）
  const unavailable = mapSpaceDetails(
    '1DGLdvzVZmLGm',
    loadFixture('space/audio-space-unavailable.json'),
  )!

  it('AC-SPACE-009: renders an explanation instead of a bare link', () => {
    const html = render(withSpace(unavailable))

    expect(html).toContain('Space 已删除或不可访问')
    // 仍给一个可核实的入口（Space 地址由 card binding 的 id 构造）
    expect(html).toContain('在 X 查看')
    expect(html).toContain('href="https://x.com/i/spaces/1DGLdvzVZmLGm"')
    // 不可用态不得出现播放入口
    expect(html).not.toContain('播放录音')
    expect(html).not.toContain('42:40')
  })

  it('AC-SPACE-009: does not use the loud purple card for a tombstone', () => {
    const html = render(withSpace(unavailable))

    // 墓碑走中性色（bg-muted），不再用 Space 品牌紫大喊大叫
    expect(html).not.toContain('bg-[#9c63fa]')
    expect(html).toContain('bg-muted/40')
  })
})

describe('AC-SPACE-010: replay-disabled space offers no playback', () => {
  const endedSpace = loadFixture<IRawAudioSpace>('space/audio-space-ended.json')
  // 以真实元数据为底，仅关闭回放开关 —— availability 交由 mapper 推导，保持链路真实
  const replayDisabled = mapSpaceDetails('1yoKMPnjEbOxQ', {
    ...endedSpace,
    metadata: { ...endedSpace.metadata, is_space_available_for_replay: false },
  })!

  it('AC-SPACE-010: shows "录音不可回放" and no play affordance', () => {
    expect(replayDisabled.availability).toBe('no-replay')

    const html = render(withSpace(replayDisabled))

    expect(html).toContain('录音不可回放')
    expect(html).not.toContain('播放录音')
    // 元数据照常展示（官方卡片也仍列出人数/时长）
    expect(html).toContain('2,478')
    expect(html).toContain('42:40')
    expect(html).toContain('夢限大みゅーたいぷ')
  })

  it('AC-SPACE-010: labels live and upcoming spaces correctly', () => {
    const live = mapSpaceDetails('1yoKMPnjEbOxQ', {
      ...endedSpace,
      metadata: { ...endedSpace.metadata, state: 'Running' },
    })!
    const upcoming = mapSpaceDetails('1yoKMPnjEbOxQ', {
      ...endedSpace,
      metadata: { ...endedSpace.metadata, state: 'NotStarted' },
    })!

    expect(live.availability).toBe('live')
    expect(render(withSpace(live))).toContain('直播中')

    expect(upcoming.availability).toBe('upcoming')
    expect(render(withSpace(upcoming))).toContain('尚未开始')
  })

  // 回归：availability 是后加字段，改动前落地的缓存里没有它 —— 曾经直接查表拿到 undefined
  // 并在渲染时抛 `Cannot read properties of undefined (reading 'aria')`（dev 实测崩溃）。
  it('AC-SPACE-010: a cache entry written before availability existed still renders', () => {
    const stale = { ...replayDisabled, availability: undefined } as unknown as SpaceDetails

    expect(render(withSpace({ ...stale, isReplayAvailable: true }))).toContain('播放录音')

    // 连 isReplayAvailable 也缺失时保守降级，不承诺播放
    const unknown = { ...stale, isReplayAvailable: undefined } as unknown as SpaceDetails
    expect(render(withSpace(unknown))).toContain('录音不可回放')
  })
})
