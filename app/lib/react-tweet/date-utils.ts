/**
 * Format the date string
 * @param time the date string
 * @param fmt the format string, e.g. `YYYY-MM-DD HH:mm`
 */
export function formatDate(
  time: string | number | Date,
  fmt = 'yyyy年MM月dd日 HH:mm:ss',
) {
  if (typeof time === 'number' && time < 1e12)
    time *= 1000

  let date = new Date(time)
  if (Number.isNaN(date.getTime()))
    return ''

  // to beijing time
  date = new Date(date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }))

  const pad = (num: number) => num.toString().padStart(2, '0')

  const year = date.getFullYear().toString()
  const month = pad(date.getMonth() + 1) // Months are zero-based
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())

  return fmt
    .replace('yyyy', year)
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
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
