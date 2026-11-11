/** 投票选项（X 把 poll 存在 card.binding_values 里，本类型是解析后的稳定结构） */
export interface PollChoice {
  label: string
  count: number
  /** 已算好的整数百分比（0–100），组件直接使用，避免 SSR/客户端重复计算 */
  percentage: number
  /** 选项图（原图优先），无图投票为 undefined */
  imageUrl?: string
  imageWidth?: number
  imageHeight?: number
  /** 选项图主色 #rrggbb，用作加载占位背景 */
  color?: string
}

export interface TweetPoll {
  choices: PollChoice[]
  totalVotes: number
  countsAreFinal: boolean
  /** 归一化后的 ISO 时间；解析失败为 undefined */
  endDatetime?: string
  durationMinutes?: number
  hasImages: boolean
}
