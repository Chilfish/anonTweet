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

/** 图片/视频卡中的单个媒体 */
export interface CardCarouselImage {
  /** 图片 URL 或视频封面 URL（渲染时再走 normalizeMediaUrl / 代理） */
  url: string
  width: number
  height: number
  /** 该张图独立的目标链接；缺省回退卡片主链接 */
  href?: string
  /** 主色（mediaColor 调色板首色），用作加载占位背景 */
  color?: string
  /** 媒体类型（缺省按 photo 处理） */
  type?: 'photo' | 'video'
  /** 视频附加信息（type === 'video' 时存在；UI 只展示封面/时长，播放源留给下游下载） */
  video?: {
    /** 最高码率 mp4 */
    mp4?: string
    /** HLS 播放列表 */
    hls?: string
    durationMs?: number
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
  /** 布局判别；旧缓存无此字段，用于一次性回填 `images` */
  layout?: 'default' | 'image_card' | 'image_carousel' | 'video_card' | 'trending'
  /** 媒体列表（单图/单视频 1 项，多图按 media_list 顺序） */
  images?: CardCarouselImage[]
  /** 官方媒体组件是否排在详情区之前（components 顺序） */
  mediaFirst?: boolean
  /** 官方 CTA 文案（website_cta_card_label 本地化后） */
  ctaLabel?: string
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
