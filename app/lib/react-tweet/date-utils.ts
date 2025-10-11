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
