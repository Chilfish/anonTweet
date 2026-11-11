import type { TweetPoll } from '~/types'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PollCardView } from '~/components/tweet/PollCard'
import { mapPollCard } from '~/lib/react-tweet/utils/poll'
import imagePayload from '../fixtures/poll/image.json'
import textPayload from '../fixtures/poll/text.json'

/**
 * AC-CARD-014：投票卡真实渲染（纯展示、SSR 安全）。
 */

const textPoll = mapPollCard(textPayload)!
const imagePoll = mapPollCard(imagePayload)!

function render(poll: TweetPoll): string {
  // React 会在相邻文本节点之间插入 <!-- -->，先去掉再断言完整文案
  return renderToString(createElement(PollCardView, { poll })).replace(/<!-- -->/g, '')
}

describe('AC-CARD-014: poll card rendering', () => {
  it('AC-CARD-014: renders text poll bars, percentages and final result', () => {
    const html = render(textPoll)

    expect(html).toContain('role="group"')
    expect(html).toContain('aria-label="投票"')
    expect(html).toContain('Yes')
    expect(html).toContain('No')
    expect(html).toContain('57%')
    expect(html).toContain('43%')
    expect(html).toContain('17,502,391 票')
    expect(html).toContain('最终结果')
    expect(html).toContain('width:57%')
    expect(html).toContain('width:43%')
  })

  it('AC-CARD-014: renders image poll grid with labels and images', () => {
    const html = render(imagePoll)

    expect(html).toContain('grid-cols-2')
    expect((html.match(/<img/g) || []).length).toBe(4)
    expect(html).toContain('alt="Cultured"')
    expect(html).toContain('alt="Vogue Adria"')
    expect(html).toContain('oynHvSJh')
    expect(html).toContain('25%')
    expect(html).toContain('49%')
    expect(html).toContain('110 票')
  })

  it('AC-CARD-014: ongoing poll shows fixed timezone deadline instead of final result', () => {
    const poll: TweetPoll = {
      ...textPoll,
      countsAreFinal: false,
      endDatetime: '2026-11-20T08:05:00.000Z',
    }
    const html = render(poll)

    expect(html).toContain('11月20日 16:05 截止')
    expect(html).not.toContain('最终结果')
  })

  it('AC-CARD-014: zero votes render 0% without NaN and long labels do not break', () => {
    const poll: TweetPoll = {
      choices: [
        {
          label: '一个非常非常长的选项标签，用来确认卡片会在任意宽度下正常换行而不是被截断或溢出容器边界',
          count: 0,
          percentage: 0,
        },
        { label: 'B', count: 0, percentage: 0 },
      ],
      totalVotes: 0,
      countsAreFinal: false,
      hasImages: false,
    }
    const html = render(poll)

    expect(html).toContain('0%')
    expect(html).not.toContain('NaN')
    expect(html).toContain('一个非常非常长的选项标签')
  })
})
