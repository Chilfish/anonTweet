/**
 * Instagram 媒体项 — 对应 SDK ParsedMedia
 */
export interface IGMedia {
  /** 在帖子里的序号 */
  num: number
  /** Instagram 媒体 ID */
  media_id: string
  /** 媒体级短码（用于深层链接） */
  shortcode?: string
  /** 图片/视频缩略图 CDN URL */
  display_url: string
  /** 视频 CDN URL（图片则为 undefined） */
  video_url?: string | null
  /** 缩略图宽度 */
  width: number
  /** 缩略图高度 */
  height: number
  /** 原图宽度 */
  width_original?: number
  /** 原图高度 */
  height_original?: number
  /** 媒体类型 */
  type: 'photo' | 'video'
  /** 被 @ 的用户列表 */
  tagged_users?: { id: string, username: string, full_name: string }[]
  /** Reel / 帖子独立音频 */
  audio_url?: string
  audio_title?: string
  audio_subtitle?: string
  audio_artist?: string
  audio_duration?: number
  audio_cover_artwork_uri?: string
  audio_has_lyrics?: boolean
  audio_is_explicit?: boolean
}

/**
 * Instagram 帖子 — SDK ParsedPost 标准化后的前端消费结构
 */
export interface IGPost {
  /** URL shortcode，作路由主键 */
  id: string
  /** 帖子数字 ID */
  post_id: string
  /** 完整 URL */
  url: string
  /** 作者 @ */
  username: string
  /** 显示名 */
  fullname: string
  /** 帖子描述（caption）—— 翻译目标文本 */
  description: string
  /** #hashtag 列表 */
  tags?: string[]
  /** 点赞数 */
  likes: number
  /** 帖子类型 */
  type: 'post' | 'reel' | 'story' | 'highlight'
  /** 多图/视频列表 */
  media: IGMedia[]
  /** 作者头像 URL */
  avatar_url?: string
  /** 创建时间（ISO 字符串） */
  created_at?: string
  /** 位置名称（如有） */
  location_name?: string
  /** 合作者列表 */
  coauthors?: { username: string, fullname: string }[]
  /** 是否认证用户 */
  verified?: boolean
  /** AI / 手动翻译后的 caption 文本 */
  captionTranslation?: string
}

/** API 返回的帖子数组 */
export type IGPostData = IGPost[]
