import type { IGPost } from '~/types'

/**
 * app/stories/ig.fixtures.ts —— Instagram 组件 story 共享数据
 *
 * 与 InstagramPostCard.stories.tsx 同源结构（真实 SDK ParsedPost 标准化结构），
 * 供新增的 8 个 ins 组件 story（IGCaption/IGHeader/IGOptionsMenu/IGScreenshotButton/
 * IGTranslateToggle/IGTranslateDialog/InsLogo/PlainIGPost）复用。
 */

export function makePost(overrides: Partial<IGPost> = {}): IGPost {
  return {
    id: 'CxAbCdEfGh',
    post_id: '123456789',
    url: 'https://www.instagram.com/p/CxAbCdEfGh/',
    username: 'chilfish',
    fullname: 'Chil Fish',
    description: 'A peaceful evening walk along the shore 🌊\nGolden hour never disappoints.',
    tags: ['sunset', 'peaceful'],
    likes: 47969,
    type: 'post',
    media: [],
    avatar_url: 'https://picsum.photos/seed/avatar/200/200',
    created_at: '2026-05-31T15:32:00Z',
    verified: false,
    ...overrides,
  }
}

/** 带翻译的帖子（IGCaption 双语/仅译文场景） */
export const postWithTranslation = makePost({
  captionTranslation: '傍晚沿着海岸散步 🌊\n黄金时刻从不让人失望。',
})

/** 带多图 + 音乐（Reel）的帖子（PlainIGPost 场景） */
export const reelPost = makePost({
  id: 'CxReel01',
  post_id: '987654321',
  url: 'https://www.instagram.com/reel/CxReel01/',
  type: 'reel',
  media: [{
    num: 1,
    media_id: 'reel1',
    shortcode: 'DReel01',
    display_url: 'https://picsum.photos/seed/reel/640/640',
    video_url: null,
    width: 640,
    height: 640,
    type: 'video',
    tagged_users: [],
  }],
  audio: {
    title: 'Blue Bird',
    subtitle: 'NARUTO OP 3 Cover',
    artist: 'Ikimono Gakari',
    duration: 45,
    has_lyrics: true,
    is_explicit: false,
  },
  captionTranslation: '新出发的旅途 🕊️ #BlueBird 翻唱',
})

/** Story：单媒体 + 链接贴纸，无 caption、无互动区 */
export const storyPost = makePost({
  id: 'DQ1a2b3c4dE',
  post_id: '3901234567890123456',
  url: 'https://www.instagram.com/stories/chilfish/3901234567890123456/',
  type: 'story',
  description: '',
  created_at: '2026-09-11T09:15:00.000Z',
  expires: '2026-09-12T09:15:00.000Z',
  media: [{
    num: 1,
    media_id: 'story1',
    shortcode: 'DQ1a2b3c4dE',
    display_url: 'https://picsum.photos/seed/story/1080/1920',
    video_url: null,
    width: 1080,
    height: 1920,
    type: 'photo',
    tagged_users: [],
  }],
  storyLink: {
    url: 'https://example.com/live',
    title: 'Live 配信はこちら',
    display: 'example.com',
    type: 'web',
  },
})

/** Highlight：精选集标题 + 转发来源 + 视频媒体 */
export const highlightPost = makePost({
  id: 'DQ9z8y7x6wV',
  post_id: '3909876543210987654',
  url: 'https://www.instagram.com/stories/highlights/17912345678901234/',
  type: 'highlight',
  description: '',
  created_at: '2026-08-30T18:05:00.000Z',
  highlight_title: '佐世保遠征',
  resharedFrom: { username: 'sasebo_live', fullname: 'Sasebo Live' },
  media: [{
    num: 1,
    media_id: 'highlight1',
    shortcode: 'DQ9z8y7x6wV',
    display_url: 'https://picsum.photos/seed/highlight/1080/1920',
    video_url: 'https://example.com/highlight.mp4',
    width: 1080,
    height: 1920,
    type: 'video',
    tagged_users: [],
  }],
})

/** 用户当前快拍 tray —— 每个 item 一张卡（IGPostList 多卡场景） */
export const trayPosts: IGPost[] = [
  makePost({
    ...storyPost,
    id: 'story~chilfish~3984520955544140029',
    post_id: '3984520955544140029',
    url: 'https://www.instagram.com/stories/chilfish/3984520955544140029/',
    created_at: '2026-09-12T10:02:00.000Z',
    media: [{
      num: 1,
      media_id: '3984520955544140029',
      shortcode: 'DdL3LK7Tvj9',
      display_url: 'https://picsum.photos/seed/story-1/1080/1920',
      video_url: null,
      width: 1179,
      height: 2096,
      type: 'photo',
      tagged_users: [],
    }],
  }),
  makePost({
    ...storyPost,
    id: 'story~chilfish~3984520955544149999',
    post_id: '3984520955544149999',
    url: 'https://www.instagram.com/stories/chilfish/3984520955544149999/',
    created_at: '2026-09-12T11:18:00.000Z',
    storyLink: undefined,
    media: [{
      num: 1,
      media_id: '3984520955544149999',
      shortcode: 'DdL3LK7Tvj0',
      display_url: 'https://picsum.photos/seed/story-2/1080/1920',
      video_url: 'https://example.com/story-2.mp4',
      width: 1080,
      height: 1920,
      type: 'video',
      tagged_users: [],
    }],
  }),
]
