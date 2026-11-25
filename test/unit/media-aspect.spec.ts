import type { MediaDetails } from '~/types'
import { describe, expect, it } from 'vitest'
import { clampAspectRatio, getMediaAspectRatio } from '~/lib/media-aspect'

function photo(width: number, height: number): MediaDetails {
  return {
    type: 'photo',
    index: 0,
    media_url_https: 'https://pbs.twimg.com/media/photo.jpg',
    original_info: { width, height },
  }
}

function video(aspectRatio: [number, number], original: [number, number]): MediaDetails {
  return {
    type: 'video',
    index: 0,
    media_url_https: 'https://pbs.twimg.com/amplify_video_thumb/cover.jpg',
    original_info: { width: original[0], height: original[1] },
    video_info: { aspect_ratio: aspectRatio, duration: 7000, variants: [] },
  }
}

describe('AC-TWEET-022: media aspect helpers', () => {
  it('AC-TWEET-022: photo ratio comes from original_info', () => {
    expect(getMediaAspectRatio(photo(1440, 1800))).toBe(0.8)
    expect(getMediaAspectRatio(photo(1920, 1080))).toBeCloseTo(1.7778, 3)
  })

  it('AC-TWEET-022: video prefers video_info.aspect_ratio over cover size', () => {
    // 封面 1440×1800，但官方裁切比例是 16:9 → 取 16:9
    expect(getMediaAspectRatio(video([16, 9], [1440, 1800]))).toBeCloseTo(1.7778, 3)
  })

  it('AC-TWEET-022: video falls back to original_info when aspect_ratio is invalid', () => {
    expect(getMediaAspectRatio(video([0, 0], [1440, 1800]))).toBe(0.8)
  })

  it('AC-TWEET-022: clamp keeps ratio in range and rounds to two decimals', () => {
    expect(clampAspectRatio(0.8, 0.6, 1.91)).toBe(0.8)
    expect(clampAspectRatio(3.2, 0.6, 1.91)).toBe(1.91)
    expect(clampAspectRatio(0.1, 0.6, 1.91)).toBe(0.6)
    expect(clampAspectRatio(2 / 3, 0.6, 1.91)).toBe(0.67)
  })

  it('AC-TWEET-022: invalid input falls back to 1', () => {
    expect(clampAspectRatio(0, 0.6, 1.91)).toBe(1)
    expect(clampAspectRatio(Number.NaN, 0.6, 1.91)).toBe(1)
    expect(clampAspectRatio(Number.POSITIVE_INFINITY, 0.6, 1.91)).toBe(1)
  })
})
