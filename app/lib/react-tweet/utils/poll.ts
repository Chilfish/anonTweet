import type { PollChoice, TweetPoll } from '~/types'

/**
 * 投票卡解析（纯函数）。
 *
 * X 没有独立的 poll 对象，投票信息全部挂在 `card.binding_values`：
 * - 纯文字：`poll2choice_text_only` / `poll3choice_text_only` / `poll4choice_text_only`
 * - 带图：  `pollNchoice_image`，syndication 实测还会带前缀 `{id}:poll_choice_images`
 *
 * 判定以 `choice1_label` 为锚点，不依赖 card.name（GraphQL 与 syndication 命名不同）。
 * `counts_are_final` 是 BOOLEAN 类型（不是 string），需单独兼容。
 */

interface BindingImage {
  url?: string
  width?: number
  height?: number
}

interface BindingValue {
  string_value?: string
  boolean_value?: boolean
  image_value?: BindingImage
  image_color_value?: {
    palette?: Array<{
      rgb?: {
        red?: number
        green?: number
        blue?: number
        r?: number
        g?: number
        b?: number
      }
    }>
  }
}

type BindingMap = Map<string, BindingValue>

const ISO_DATE_RE = /\d{4}-\d{2}-\d{2}T/
const UTC_DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/

function toBindingMap(cardData: unknown): BindingMap | null {
  if (!cardData || typeof cardData !== 'object')
    return null

  const legacy = (cardData as { legacy?: unknown }).legacy ?? cardData
  if (!legacy || typeof legacy !== 'object')
    return null

  const raw = (legacy as { binding_values?: unknown }).binding_values
  if (!raw)
    return null

  if (Array.isArray(raw)) {
    const entries = raw
      .filter((item): item is { key: string, value?: BindingValue } =>
        !!item && typeof item === 'object' && typeof (item as { key?: unknown }).key === 'string')
      .map(item => [item.key, item.value ?? {}] as const)
    return entries.length
      ? new Map(entries)
      : null
  }

  if (typeof raw === 'object')
    return new Map(Object.entries(raw) as Array<[string, BindingValue]>)

  return null
}

function getStr(bindings: BindingMap, key: string): string | undefined {
  const value = bindings.get(key)?.string_value
  return typeof value === 'string'
    ? value
    : undefined
}

function parseCount(raw?: string): number {
  if (!raw)
    return 0
  const normalized = raw.replace(/[,\s]/g, '')
  const count = Number.parseInt(normalized, 10)
  return Number.isFinite(count) && count > 0
    ? count
    : 0
}

function pickChoiceImage(bindings: BindingMap, index: number) {
  const suffixes = ['_original', '_x_large', '_large', '']
  for (const suffix of suffixes) {
    const image = bindings.get(`choice${index}_image${suffix}`)?.image_value
    if (image?.url) {
      return {
        imageUrl: image.url,
        imageWidth: image.width,
        imageHeight: image.height,
      }
    }
  }
  return {}
}

function rgbToHex(rgb?: { red?: number, green?: number, blue?: number, r?: number, g?: number, b?: number }) {
  const red = rgb?.red ?? rgb?.r
  const green = rgb?.green ?? rgb?.g
  const blue = rgb?.blue ?? rgb?.b
  if (typeof red !== 'number' || typeof green !== 'number' || typeof blue !== 'number')
    return undefined
  const toHex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')
  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`
}

function pickChoiceColor(bindings: BindingMap, index: number) {
  const palette = bindings.get(`choice${index}_image_color`)?.image_color_value?.palette
  return rgbToHex(palette?.[0]?.rgb)
}

/** 结束时间归一化为 ISO：兼容 `2026-11-09T21:56:31Z` 与 `12/19/2022 11:20:32`（UTC） */
function normalizeUtcDate(raw?: string): string | undefined {
  if (!raw)
    return undefined

  const value = raw.trim()
  if (ISO_DATE_RE.test(value)) {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
      ? undefined
      : date.toISOString()
  }

  const matched = UTC_DATE_RE.exec(value)
  if (!matched)
    return undefined

  const [, month, day, year, hours, minutes, seconds] = matched
  const date = new Date(Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds),
  ))
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toISOString()
}

function parseDurationMinutes(raw?: string): number | undefined {
  if (!raw)
    return undefined
  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) && value > 0
    ? value
    : undefined
}

export function mapPollCard(cardData: unknown): TweetPoll | undefined {
  const bindings = toBindingMap(cardData)
  if (!bindings || !bindings.has('choice1_label'))
    return undefined

  const declaredCount = Number.parseInt(getStr(bindings, 'choice_count') ?? '', 10)
  const limit = Number.isFinite(declaredCount) && declaredCount >= 2 && declaredCount <= 4
    ? declaredCount
    : 4

  const choices: PollChoice[] = []
  for (let index = 1; index <= limit; index++) {
    const label = (getStr(bindings, `choice${index}_label`) ?? '').trim()
    const countRaw = getStr(bindings, `choice${index}_count`)
    const image = pickChoiceImage(bindings, index)
    const color = pickChoiceColor(bindings, index)

    if (!label && !countRaw && !image.imageUrl)
      continue

    choices.push({
      label,
      count: parseCount(countRaw),
      percentage: 0,
      ...image,
      ...(color
        ? { color }
        : {}),
    })
  }

  if (choices.length < 2)
    return undefined

  const totalVotes = choices.reduce((sum, choice) => sum + choice.count, 0)
  for (const choice of choices) {
    choice.percentage = totalVotes > 0
      ? Math.round((choice.count / totalVotes) * 100)
      : 0
  }

  const finalValue = bindings.get('counts_are_final')

  return {
    choices,
    totalVotes,
    countsAreFinal: finalValue?.boolean_value === true || finalValue?.string_value === 'true',
    endDatetime: normalizeUtcDate(getStr(bindings, 'end_datetime_utc')),
    durationMinutes: parseDurationMinutes(getStr(bindings, 'duration_minutes')),
    hasImages: choices.some(choice => !!choice.imageUrl),
  }
}
