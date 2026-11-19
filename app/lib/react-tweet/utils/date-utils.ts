import { formatDate as sdkFormatDate, formatSpaceDate as sdkFormatSpaceDate } from '@chilfish/tweet'

const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Space 日期：SDK 返回英文月份（`Sep 17`），app 中文 UI 需要 `9月17日`。
 * 空值/无效值保持空串。
 */
export function formatSpaceDate(ms?: number | null): string {
  const value = sdkFormatSpaceDate(ms)
  if (!value)
    return ''

  const [month, day] = value.split(' ')
  const index = EN_MONTHS.indexOf(month!)
  return index >= 0
    ? `${index + 1}月${day}日`
    : value
}

/**
 * 格式化日期：默认使用中文格式与北京时间（app 既有 UI 期望）。
 *
 * SDK 的 `formatDate` 默认使用运行时本地时区（Workers = UTC），
 * 因此这里显式传入 `Asia/Shanghai`，避免迁移后时间整体偏移。
 */
export function formatDate(
  time: string | number | Date,
  fmt = 'yyyy年MM月dd日 HH:mm:ss',
): string {
  return sdkFormatDate(time, fmt, 'Asia/Shanghai')
}
