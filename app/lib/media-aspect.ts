import type { MediaDetails } from '~/types'

/**
 * 媒体原始宽高比（宽 / 高）。
 * 视频优先取 `video_info.aspect_ratio`（官方裁切后的比例），缺失时回退 `original_info`。
 */
export function getMediaAspectRatio(media: MediaDetails): number {
  if (media.type !== 'photo') {
    const [width, height] = media.video_info.aspect_ratio
    if (width > 0 && height > 0)
      return width / height
  }

  const { width, height } = media.original_info
  return width > 0 && height > 0
    ? width / height
    : 1
}

/** 夹住比例并保留两位小数（轮播容器比例，防止极端长图/长横幅撑爆卡片） */
export function clampAspectRatio(ratio: number, min: number, max: number): number {
  if (!Number.isFinite(ratio) || ratio <= 0)
    return 1
  return Math.round(Math.min(max, Math.max(min, ratio)) * 100) / 100
}
