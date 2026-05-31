import type { Meta, StoryObj } from '@storybook/react-vite'
import type { IGPost } from '~/types'
import { IGActionBar } from '~/components/ins/IGActionBar'
import { IGCardHeader } from '~/components/ins/IGCardHeader'
import { IGMediaGrid } from '~/components/ins/IGMediaGrid'
import { IGMusicInfo } from '~/components/ins/IGMusicInfo'
import { InstagramPostCard } from '~/components/ins/InstagramPostCard'

// ─── Mock Data ──────────────────────────────────────────────────────

const samplePhotos: IGPost['media'] = [
  { num: 1, media_id: '1', display_url: 'https://picsum.photos/seed/ig1/640/640', width: 640, height: 640, type: 'photo' },
  { num: 2, media_id: '2', display_url: 'https://picsum.photos/seed/ig2/640/640', width: 640, height: 640, type: 'photo' },
  { num: 3, media_id: '3', display_url: 'https://picsum.photos/seed/ig3/640/800', width: 640, height: 800, type: 'photo' },
  { num: 4, media_id: '4', display_url: 'https://picsum.photos/seed/ig4/640/640', width: 640, height: 640, type: 'photo' },
  { num: 5, media_id: '5', display_url: 'https://picsum.photos/seed/ig5/800/640', width: 800, height: 640, type: 'photo' },
  { num: 6, media_id: '6', display_url: 'https://picsum.photos/seed/ig6/640/640', width: 640, height: 640, type: 'photo' },
  { num: 7, media_id: '7', display_url: 'https://picsum.photos/seed/ig7/640/640', width: 640, height: 640, type: 'photo' },
  { num: 8, media_id: '8', display_url: 'https://picsum.photos/seed/ig8/640/640', width: 640, height: 640, type: 'photo' },
  { num: 9, media_id: '9', display_url: 'https://picsum.photos/seed/ig9/640/640', width: 640, height: 640, type: 'photo' },
  { num: 10, media_id: '10', display_url: 'https://picsum.photos/seed/ig10/640/640', width: 640, height: 640, type: 'photo' },
  { num: 11, media_id: '11', display_url: 'https://picsum.photos/seed/ig11/640/640', width: 640, height: 640, type: 'photo' },
  { num: 12, media_id: '12', display_url: 'https://picsum.photos/seed/ig12/640/640', width: 640, height: 640, type: 'photo' },
]

/** 带音乐数据的媒体项（模拟 Reel） */
const musicMedia: IGPost['media'] = [{
  num: 1,
  media_id: 'reel1',
  shortcode: 'DReel01',
  display_url: 'https://picsum.photos/seed/reel/640/640',
  video_url: null,
  width: 640,
  height: 640,
  type: 'video' as const,
  tagged_users: [],
}]

function makePost(overrides: Partial<IGPost>): IGPost {
  return {
    id: 'CxAbCdEfGh',
    post_id: '123456789',
    url: 'https://www.instagram.com/p/CxAbCdEfGh/',
    username: 'chilfish',
    fullname: 'Chil Fish',
    description: 'A peaceful evening walk along the shore 🌊',
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

// ─── Meta ────────────────────────────────────────────────────────────

const meta = {
  title: 'Instagram/PostCard',
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// ─── Full Card Stories ───────────────────────────────────────────────

export const SingleImageWithTranslation: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: [samplePhotos[0]!],
        captionTranslation: '傍晚沿着海岸散步 🌊',
        verified: true,
      })}
    />
  ),
}

export const ReelWithMusic: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: musicMedia,
        type: 'reel',
        description: '新しい自分に出会う旅 🕊️ #BlueBird #NARUTO',
        tags: ['BlueBird', 'NARUTO', 'ikimonogakari'],
        audio: {
          title: 'Blue Bird',
          subtitle: 'NARUTO OP 3 Cover',
          artist: 'Ikimono Gakari',
          duration: 45,
          has_lyrics: true,
          is_explicit: false,
        },
      })}
    />
  ),
}

export const LongNickname: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: [samplePhotos[0]!],
        username: 'very_long_nickname_that_should_truncate',
        fullname: 'A Very Long Display Name That Will Truncate Nicely',
      })}
    />
  ),
}

export const TwoImageGrid: Story = {
  render: () => (
    <InstagramPostCard post={makePost({ media: [samplePhotos[0]!, samplePhotos[1]!] })} />
  ),
}

export const ThreeImageGrid: Story = {
  render: () => (
    <InstagramPostCard post={makePost({ media: [samplePhotos[0]!, samplePhotos[1]!, samplePhotos[2]!] })} />
  ),
}

export const NineGrid: Story = {
  render: () => (
    <InstagramPostCard post={makePost({ media: samplePhotos.slice(0, 9) })} />
  ),
}

export const OverflowFolded: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: samplePhotos,
        description: '12 张合集。前 9 张可见，第 9 位毛玻璃 +3。',
      })}
    />
  ),
}

export const NoCaption: Story = {
  render: () => (
    <InstagramPostCard post={makePost({ media: [samplePhotos[0]!], description: '', tags: undefined })} />
  ),
}

export const NoAvatar: Story = {
  render: () => (
    <InstagramPostCard post={makePost({ media: [samplePhotos[0]!], avatar_url: undefined })} />
  ),
}

// ─── Sub-Component Stories ───────────────────────────────────────────

export const HeaderOnly: Story = {
  render: () => (
    <div className="w-[400px] bg-card rounded-sm p-4">
      <IGCardHeader
        username="chilfish"
        fullname="Chil Fish"
        avatarUrl="https://picsum.photos/seed/avatar/200/200"
        verified
      />
    </div>
  ),
}

export const MediaGridOnly: Story = {
  render: () => (<div className="w-[468px]"><IGMediaGrid media={samplePhotos.slice(0, 6)} /></div>),
}

export const ActionBarOnly: Story = {
  render: () => (<div className="w-[400px] bg-card rounded-sm p-4"><IGActionBar /></div>),
}

export const MusicInfoOnly: Story = {
  render: () => (
    <div className="w-[400px] bg-card rounded-sm">
      <IGMusicInfo audio={{
        title: 'Blue Bird',
        subtitle: 'NARUTO OP 3 Cover',
        artist: 'Ikimono Gakari',
        duration: 45,
        has_lyrics: true,
        is_explicit: false,
      }}
      />
    </div>
  ),
}
