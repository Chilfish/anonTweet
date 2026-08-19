// Twitter Card Types
export interface TwitterCardImage {
  url: string
  width: number
  height: number
}

export interface TwitterCardBindingValue {
  key: string
  value: {
    type: 'STRING' | 'IMAGE' | 'IMAGE_COLOR' | 'USER'
    string_value?: string
    image_value?: {
      height: number
      width: number
      url: string
    }
    image_color_value?: {
      palette: Array<{
        rgb: {
          blue: number
          green: number
          red: number
        }
        percentage: number
      }>
    }
    user_value?: {
      id_str: string
      path: any[]
    }
    scribe_key?: string
  }
}

export interface TwitterCard {
  rest_id?: string
  legacy?: {
    binding_values?: TwitterCardBindingValue[]
    card_platform?: {
      platform: {
        audience: {
          name: string
        }
        device: {
          name: string
          version: string
        }
      }
    }
    name?: string
    url?: string
    user_refs_results?: any[]
  }
  // Processed fields for easier access
  type?: 'summary' | 'summary_large_image' | 'unified_card' | 'unknown' | 'player'
  url?: string
  title?: string
  description?: string
  domain?: string
  image?: TwitterCardImage
  images?: {
    small?: TwitterCardImage
    medium?: TwitterCardImage
    large?: TwitterCardImage
    original?: TwitterCardImage
  }
}

export interface LinkPreviewCard {
  type: 'summary' | 'summary_large_image' | 'unified_card' | 'unknown' | 'player'
  /** 跳转链接 */
  url: string
  /** 显示标题 */
  title: string
  /** 显示描述 */
  description: string
  /** 显示域名  */
  domain: string
  /** 图片地址 */
  imageUrl: string
  /** jetfuel 增强信息（Trending/topic 等官方渲染卡，可选） */
  trending?: TrendingCardInfo
}

/**
 * jetfuel_attachment payload 解析出的 Trending 卡片全量信息
 * （官方前端渲染同源数据：分类/头像/posts 数/更新版描述与图片）。
 */
export interface TrendingCardInfo {
  source: 'jetfuel'
  /** 跳转目标（如 x.com/i/trending/...） */
  url: string
  /** 主图 URL（官方渲染用大图） */
  imageUrl: string
  /** 话题分类（Entertainment / Celebrity 等，仅当 payload 内明确携带） */
  categories: string[]
  /** 贡献者头像组（最多 3 个） */
  avatars: string[]
  /** 帖文计数显示文本（如 "16.5k posts"） */
  postsCount?: string
  /** 标题 */
  title: string
  /** 描述（可选） */
  description?: string
}
