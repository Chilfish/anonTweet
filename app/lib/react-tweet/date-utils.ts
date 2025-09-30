import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const tzs = {
  tokyo: 'Asia/Tokyo',
  beijing: 'Asia/Shanghai',
} as const

type Time = string | number | Date
type TZ = keyof typeof tzs

export function formatDateFns(
  time: Time,
  options: {
    timezone?: TZ
    fmt?: string
  } = {},
) {
  const { timezone, fmt = 'yyyy年MM月dd日 HH:mm:ss' } = options

  return format(getDate(time, timezone), fmt, { locale: zhCN })
}

export function getDate(time: Time, timezone?: TZ) {
  return new Date(
    new Date(time).toLocaleString(zhCN.code, {
      timeZone: timezone ? tzs[timezone] : undefined,
    }),
  )
}

export function now(timezone: TZ = 'beijing') {
  return getDate(new Date(), timezone)
}
const DATE_KEYS = [
  'createdAt',
  'updatedAt',
  'date',
  'time',
  'timestamp',
  'created_at',
  'updated_at',
  'date_time',
  'time_stamp',
  'startDate',
  'endDate',
  'start_date',
  'end_date',
]
export function convertDate(obj: Record<string, any>, keys: string[] = DATE_KEYS) {
  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      continue
    }
    if (typeof value === 'object') {
      convertDate(value)
      continue
    }
    if (!keys.includes(key)) {
      continue
    }
    if (typeof value !== 'string') {
      continue
    }

    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      obj[key] = date
    }
  }
}

type PartsObject = Record<keyof Intl.DateTimeFormatPartTypesRegistry, string>

const options: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}

const lang2Locale = {
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
} as const

type Lang = keyof typeof lang2Locale | (string & {})

function partsArrayToObject(parts: Intl.DateTimeFormatPart[]): PartsObject {
  const result = {} as PartsObject

  for (const part of parts) {
    result[part.type] = part.value
  }

  return result
}

function padString(str: string, length: number, padChar = '0') {
  return str.padStart(length, padChar)
}

export function formatDate(date: Date, locale: Intl.LocalesArgument = 'zh-CN') {
  const formatter = new Intl.DateTimeFormat(locale, options)
  const parts = partsArrayToObject(formatter.formatToParts(date))

  const formattedTime = `${padString(parts.hour, 2)}:${padString(parts.minute, 2)} ${parts.dayPeriod}`
  const formattedDate = `${parts.year}/${padString(parts.month, 2)}/${padString(parts.day, 2)}`
  return `${formattedDate} · ${formattedTime}`
}

export function formatDateByLang(date: Date, lang: Lang) {
  return formatDate(date, lang2Locale[lang])
}
