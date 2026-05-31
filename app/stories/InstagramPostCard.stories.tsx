import type { Meta, StoryObj } from '@storybook/react-vite'
import type { IGPost } from '~/types'
import { IGActionBar } from '~/components/ins/IGActionBar'
import { IGCaption } from '~/components/ins/IGCaption'
import { IGCardHeader } from '~/components/ins/IGCardHeader'
import { IGMediaGrid } from '~/components/ins/IGMediaGrid'
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

function makePost(overrides: Partial<IGPost>): IGPost {
  return {
    id: 'CxAbCdEfGh',
    post_id: '123456789',
    url: 'https://www.instagram.com/p/CxAbCdEfGh/',
    username: 'chilfish',
    fullname: 'Chil Fish',
    description: 'A peaceful evening walk along the shore 🌊 The sunset painted the sky in shades of orange and pink.',
    tags: ['sunset', 'peaceful', 'eveningvibes'],
    likes: 47969,
    type: 'post',
    media: [],
    avatar_url: 'https://picsum.photos/seed/avatar/200/200',
    created_at: '2026-05-30T18:30:00Z',
    verified: false,
    ...overrides,
  }
}

// ─── Meta ────────────────────────────────────────────────────────────

const meta = {
  title: 'Instagram/PostCard',
  component: InstagramPostCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'app',
      values: [{ name: 'app', value: 'var(--background)' }],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InstagramPostCard>

export default meta
type Story = StoryObj<typeof meta>

// ─── Full Card Stories ───────────────────────────────────────────────

/** 单图 + 翻译 */
export const SingleImageWithTranslation: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: [samplePhotos[0]!],
        captionTranslation: '傍晚沿着海岸散步 🌊 夕阳把天空染成了橙粉色的画卷。',
        verified: true,
      })}
    />
  ),
}

/** 双图宫格 */
export const TwoImageGrid: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: [samplePhotos[0]!, samplePhotos[1]!],
      })}
    />
  ),
}

/** 三图宫格 */
export const ThreeImageGrid: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: [samplePhotos[0]!, samplePhotos[1]!, samplePhotos[2]!],
      })}
    />
  ),
}

/** 四图宫格 */
export const FourImageGrid: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: [samplePhotos[0]!, samplePhotos[1]!, samplePhotos[2]!, samplePhotos[3]!],
      })}
    />
  ),
}

/** 九宫格（完整 9 张） */
export const NineGrid: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: samplePhotos.slice(0, 9),
      })}
    />
  ),
}

/** 超过 9 张 — 毛玻璃折叠 +N */
export const OverflowFolded: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: samplePhotos,
        description: '12 张照片的合集！前 9 张可见，第 9 位显示毛玻璃 +3 折叠层。点击可展开。',
      })}
    />
  ),
}

/** 无 caption */
export const NoCaption: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: [samplePhotos[0]!],
        description: '',
        tags: undefined,
      })}
    />
  ),
}

/** 无头像（占位回退） */
export const NoAvatarFallback: Story = {
  render: () => (
    <InstagramPostCard
      post={makePost({
        media: [samplePhotos[0]!],
        avatar_url: undefined,
      })}
    />
  ),
}

// ─── Sub-Component Stories ───────────────────────────────────────────

/** IGCardHeader 独立测试 */
export const HeaderOnly: Story = {
  render: () => (
    <div className="w-[400px] bg-card rounded-2xl p-4">
      <IGCardHeader
        username="chilfish"
        fullname="Chil Fish"
        avatarUrl="https://picsum.photos/seed/avatar/200/200"
        verified
        timestamp="2026年5月30日"
        locationName="Tokyo, Japan"
      />
    </div>
  ),
}

/** IGMediaGrid 九宫格独立测试 */
export const MediaGridOnly: Story = {
  render: () => (
    <div className="w-[468px]">
      <IGMediaGrid media={samplePhotos.slice(0, 9)} />
    </div>
  ),
}

/** IGMediaGrid 折叠独立测试 */
export const MediaGridFolded: Story = {
  render: () => (
    <div className="w-[468px]">
      <IGMediaGrid media={samplePhotos} maxVisible={6} />
    </div>
  ),
}

/** IGActionBar 独立测试 */
export const ActionBarOnly: Story = {
  render: () => (
    <div className="w-[400px] bg-card rounded-2xl">
      <IGActionBar />
    </div>
  ),
}

/** IGCaption 带翻译独立测试 */
export const CaptionWithTranslation: Story = {
  render: () => (
    <div className="w-[400px] bg-card rounded-2xl p-4">
      <IGCaption
        username="chilfish"
        text="The quick brown fox jumps over the lazy dog. This is a longer caption that should always be fully visible without line-clamp truncation."
        translatedText="敏捷的棕色狐狸跳过了懒惰的狗。这是一段更长的文案，应该始终完整显示，不使用任何截断。"
        tags={['example', 'translation']}
      />
    </div>
  ),
}
