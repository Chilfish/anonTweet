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

const partsArrayToObject = (
  parts: Intl.DateTimeFormatPart[]
): PartsObject => {
  const result = {} as PartsObject

  for (const part of parts) {
    result[part.type] = part.value
  }

  return result
}

const padString = (str: string, length: number, padChar = '0') => {
  return str.padStart(length, padChar)
}

export const formatDate = (date: Date, locale: Intl.LocalesArgument = 'en-US') => {
  const formatter = new Intl.DateTimeFormat(locale, options)
  const parts = partsArrayToObject(formatter.formatToParts(date))

  const formattedTime = `${padString(parts.hour, 2)}:${padString(parts.minute, 2)} ${parts.dayPeriod}`
  const formattedDate = `${parts.year}/${padString(parts.month, 2)}/${padString(parts.day, 2)}`
  return `${formattedDate} · ${formattedTime}`
}

export const formatDateByLang = (date: Date, lang: Lang) => {
  return formatDate(date, lang2Locale[lang])
}