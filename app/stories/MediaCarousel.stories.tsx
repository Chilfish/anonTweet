import type { Meta, StoryObj } from '@storybook/react-vite'
import { MediaCarousel, MediaCarouselPage } from '~/components/ui/media-carousel'

/**
 * MediaCarousel —— 横向 scroll-snap 媒体轮播 primitive。
 * 消费方：推文 >4 张媒体（计数胶囊）与广告多图卡（圆点 + 整页宽）。
 * 交互（滑动 / 箭头 / 计数）由 Storybook 面板直接操作。
 */
const meta = {
  title: 'UI/MediaCarousel',
  parameters: { layout: 'centered' },
  decorators: [
    Story => (
      <div className="w-full max-w-[520px] bg-card p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const images = Array.from({ length: 8 }, (_, index) => `https://picsum.photos/seed/media-carousel-${index}/720/900`)

function pages(pageClassName: string) {
  return images.map((src, index) => (
    <MediaCarouselPage
      key={src}
      className={pageClassName}
      style={{ aspectRatio: '0.8' }}
    >
      <img
        src={src}
        alt={`第 ${index + 1} 张`}
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
    </MediaCarouselPage>
  ))
}

/** 露边轮播（推文 >4 张媒体）：每页 60% 宽，中间一张 + 左右各露 20%，右上角计数 */
export const CounterPeek: Story = {
  render: () => (
    <MediaCarousel
      itemCount={images.length}
      ariaLabel={`媒体，共 ${images.length} 张`}
      trackClassName="gap-1"
    >
      {pages('basis-[60%] snap-center bg-muted/10')}
    </MediaCarousel>
  ),
}

/** 整页轮播（广告多图卡）：一页一张 + 圆点指示 */
export const DotsFullPage: Story = {
  render: () => (
    <MediaCarousel
      itemCount={images.length}
      ariaLabel={`媒体轮播，共 ${images.length} 个`}
      indicator="dots"
    >
      {pages('w-full snap-center bg-muted/40')}
    </MediaCarousel>
  ),
}

/** 无箭头（引用推文等窄容器）：只保留滑动与计数 */
export const NoArrows: Story = {
  render: () => (
    <MediaCarousel
      itemCount={images.length}
      ariaLabel={`媒体，共 ${images.length} 张`}
      showArrows={false}
      trackClassName="gap-1"
    >
      {pages('basis-[60%] snap-center bg-muted/10')}
    </MediaCarousel>
  ),
}

/** 混合比例：每页按自身比例撑高（竖构图不被裁，超宽图收窄），轨道顶部对齐 */
export const MixedRatios: Story = {
  render: () => {
    const mixed = [
      { src: 'https://picsum.photos/seed/mixed-portrait/720/900', ratio: 0.8 },
      { src: 'https://picsum.photos/seed/mixed-tall/720/2400', ratio: 0.3 },
      { src: 'https://picsum.photos/seed/mixed-wide/2400/1000', ratio: 2.4 },
    ]

    return (
      <MediaCarousel
        itemCount={mixed.length}
        ariaLabel={`媒体，共 ${mixed.length} 张`}
        trackClassName="gap-1"
      >
        {mixed.map((item, index) => (
          <MediaCarouselPage
            key={item.src}
            className="basis-[60%] snap-center bg-muted/10"
            style={{
              aspectRatio: String(item.ratio),
              maxWidth: `calc(${item.ratio} * min(640px, 80vh))`,
            }}
          >
            <img
              src={item.src}
              alt={`第 ${index + 1} 张`}
              loading="lazy"
              className="absolute inset-0 size-full object-cover"
            />
          </MediaCarouselPage>
        ))}
      </MediaCarousel>
    )
  },
}
