import { describe, expect, it } from 'vitest'
import { mapPollCard } from '~/lib/react-tweet/utils/poll'
import imagePayload from '../fixtures/poll/image.json'
import textPayload from '../fixtures/poll/text.json'

/**
 * AC-CARD-013：投票卡解析。
 * fixture 来自真实样本：
 * - text：x.com/elonmusk/status/1604617643973124097（Yes/No，最终结果）
 * - image：x.com/Vaaalrrr___/status/2119549657009578137（4 选项 + 图片）
 */

function toBindingMap(payload: { binding_values: Array<{ key: string, value: unknown }> }) {
  return Object.fromEntries(payload.binding_values.map(item => [item.key, item.value]))
}

describe('AC-CARD-013: poll card parsing', () => {
  it('AC-CARD-013: parses text poll counts, percentages and final state', () => {
    const poll = mapPollCard(textPayload)!

    expect(poll.choices).toHaveLength(2)
    expect(poll.choices[0]).toMatchObject({ label: 'Yes', count: 10063044, percentage: 57 })
    expect(poll.choices[1]).toMatchObject({ label: 'No', count: 7439347, percentage: 43 })
    expect(poll.totalVotes).toBe(17502391)
    expect(poll.countsAreFinal).toBe(true)
    expect(poll.hasImages).toBe(false)
    expect(poll.durationMinutes).toBe(720)
    expect(poll.endDatetime).toBe('2022-12-19T11:20:32.000Z')
  })

  it('AC-CARD-013: parses image poll and prefers original image with dominant color', () => {
    const poll = mapPollCard(imagePayload)!

    expect(poll.hasImages).toBe(true)
    expect(poll.choices).toHaveLength(4)
    expect(poll.totalVotes).toBe(110)
    expect(poll.choices.map(choice => choice.percentage)).toEqual([25, 49, 23, 3])
    expect(poll.choices[0]).toMatchObject({
      label: 'Cultured',
      count: 28,
      imageWidth: 454,
      imageHeight: 587,
      color: '#c99171',
    })
    expect(poll.choices[0]!.imageUrl).toContain('oynHvSJh')
    expect(poll.choices[0]!.imageUrl).toContain('name=orig')
    expect(poll.choices[1]!.color).toBe('#c4c3c1')
  })

  it('AC-CARD-013: accepts legacy wrapper and syndication object binding map', () => {
    const legacy = mapPollCard({ legacy: textPayload })
    expect(legacy?.choices).toHaveLength(2)

    const syndication = mapPollCard({
      name: textPayload.name,
      binding_values: toBindingMap(textPayload),
    })
    expect(syndication?.choices[0]?.label).toBe('Yes')
    expect(syndication?.totalVotes).toBe(17502391)
  })

  it('AC-CARD-013: tolerates string boolean and missing choice_count', () => {
    const { choice_count: _choiceCount, ...rest } = toBindingMap(imagePayload)
    const poll = mapPollCard({
      name: imagePayload.name,
      binding_values: {
        ...rest,
        counts_are_final: { type: 'STRING', string_value: 'true' },
      },
    })!

    expect(poll.choices).toHaveLength(4)
    expect(poll.countsAreFinal).toBe(true)
  })

  it('AC-CARD-013: normalizes ongoing poll end time and zero-vote percentages', () => {
    const poll = mapPollCard({
      name: 'poll3choice_text_only',
      binding_values: [
        {
          key: 'choice1_label',
          value: { string_value: 'A' },
        },
        {
          key: 'choice1_count',
          value: { string_value: '0' },
        },
        {
          key: 'choice2_label',
          value: { string_value: 'B' },
        },
        {
          key: 'choice2_count',
          value: { string_value: '0' },
        },
        {
          key: 'choice3_label',
          value: { string_value: 'C' },
        },
        {
          key: 'choice3_count',
          value: { string_value: '0' },
        },
        {
          key: 'counts_are_final',
          value: { type: 'BOOLEAN', boolean_value: false },
        },
        {
          key: 'end_datetime_utc',
          value: { string_value: '2026-11-20T08:05:00Z' },
        },
      ],
    })!

    expect(poll.choices).toHaveLength(3)
    expect(poll.totalVotes).toBe(0)
    expect(poll.choices.map(choice => choice.percentage)).toEqual([0, 0, 0])
    expect(poll.countsAreFinal).toBe(false)
    expect(poll.endDatetime).toBe('2026-11-20T08:05:00.000Z')
  })

  it('AC-CARD-013: returns undefined for non-poll cards or fewer than two choices', () => {
    expect(mapPollCard(undefined)).toBeUndefined()
    expect(mapPollCard({
      name: 'summary',
      binding_values: [
        {
          key: 'title',
          value: { string_value: 'x' },
        },
      ],
    })).toBeUndefined()
    expect(mapPollCard({
      name: 'poll2choice_text_only',
      binding_values: [
        {
          key: 'choice1_label',
          value: { string_value: 'only' },
        },
      ],
    })).toBeUndefined()
  })
})
