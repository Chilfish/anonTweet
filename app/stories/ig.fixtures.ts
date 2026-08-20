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
