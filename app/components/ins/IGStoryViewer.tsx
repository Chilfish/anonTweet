import type { IGPost } from '~/types'
import { Check, ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '~/components/ui/button'
import { Dialog, DialogPrimitive } from '~/components/ui/dialog'
import { MediaImage, MediaVideo } from '~/components/ui/media'
import { stepViewerIndex } from '~/lib/ig/storyViewer'
import { formatIGTime } from '~/lib/utils'
import { IGStoryMeta } from './IGStoryMeta'

interface IGStoryViewerProps {
  posts: IGPost[]
  /** 当前条目下标 */
  index: number
  onIndexChange: (index: number) => void
  /** 受控开关（Storybook 可直接渲染打开态） */
  open: boolean
  onClose: () => void
  selected?: ReadonlySet<string>
  onToggle?: (id: string) => void
  onDownload: (post: IGPost) => void
  busy?: boolean
}

/** 触摸横滑判定阈值（px）——要短于常见滚动位移，又不能与纵向滚动混淆。 */
const SWIPE_THRESHOLD = 40

/** 查看器主体媒体：`object-contain` 全屏letterbox，切换条目时整体重挂载。 */
function ViewerMedia({ post }: { post: IGPost }) {
  const media = post.media?.[0]

  if (!media)
    return <span className="text-sm text-white/60">该条快拍无可展示媒体</span>

  if (media.type === 'video') {
    return (
      <MediaVideo
        src={media.video_url!}
        controls
        autoPlay
        playsInline
        muted
        loop
        containerClassName="size-full"
        className="object-contain"
      />
    )
  }

  return (
    <MediaImage
      src={media.display_url}
      alt=""
      containerClassName="size-full"
      className="object-contain"
    />
  )
}

/**
 * 快拍全屏查看器。
 *
 * 与列表同源的下载优先口径：顶栏切换/选择/关闭，底部放元信息与下载（移动端拇指区），
 * 主体 `object-contain` 全屏展示。切条三通道：左右按钮、触摸横滑、←/→ 键，末条 ↔ 首条环形。
 *
 * 移动端：`h-[100dvh]` 规避地址栏抖动；上下栏各留 `env(safe-area-inset-*)`，避免刘海/Home
 * 指示条压住序号与下载按钮；遮罩本身 `overscroll-contain`。
 *
 * ⚠️ **背景滚动锁由 base-ui Dialog 负责**（`useScrollLock`，含 iOS overlay-scrollbar 与滚动位置
 * 还原），**不要**自己设 `body.overflow` —— base-ui 若检测到页面已被作者锁住会主动退让（MutationObserver
 * 等待），会在关闭之后才接管锁，把锁的生命周期搞乱。
 */
export function IGStoryViewer({
  posts,
  index,
  onIndexChange,
  open,
  onClose,
  selected,
  onToggle,
  onDownload,
  busy = false,
}: IGStoryViewerProps) {
  const touchStart = useRef<{ x: number, y: number } | null>(null)

  const post = posts[index]
  if (!post)
    return null

  const total = posts.length
  const isSelected = selected?.has(post.id) ?? false

  const step = (direction: 1 | -1) => onIndexChange(stepViewerIndex(index, total, direction))

  // 相邻条目预热，避免切条白屏（display:none 的 img 仍会发起请求）
  const previewUrls = total > 1
    ? [posts[stepViewerIndex(index, total, -1)], posts[stepViewerIndex(index, total, 1)]]
        .map(p => p?.media?.[0])
        .filter(m => m?.type === 'photo')
        .map(m => m!.display_url)
    : []

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0"
        />
        <DialogPrimitive.Popup
          className="fixed inset-0 z-50 flex h-[100dvh] flex-col overscroll-contain bg-black/95 text-white outline-none"
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault()
              step(-1)
            }
            else if (event.key === 'ArrowRight') {
              event.preventDefault()
              step(1)
            }
          }}
          onTouchStart={(event) => {
            const touch = event.touches[0]
            if (touch)
              touchStart.current = { x: touch.clientX, y: touch.clientY }
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current
            const touch = event.changedTouches[0]
            touchStart.current = null
            if (!start || !touch)
              return

            const dx = touch.clientX - start.x
            const dy = touch.clientY - start.y
            // 只认明确的横向滑动，避免与页面纵向滚动抢手势
            if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy))
              step(dx < 0 ? 1 : -1)
          }}
        >
          <DialogPrimitive.Title className="sr-only">快拍查看器</DialogPrimitive.Title>

          {/* 顶栏：序号 · 选择 · 关闭（pt 让开刘海/状态栏） */}
          <div className="flex shrink-0 items-center gap-2 px-3 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-2 sm:px-4">
            <span className="text-sm tabular-nums text-white/75">
              {index + 1}
              {' / '}
              {total}
            </span>

            <div className="flex-1" />

            {onToggle && (
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={isSelected}
                onClick={() => onToggle(post.id)}
                className="text-white hover:bg-white/15 hover:text-white"
              >
                <Check className="size-4" />
                {isSelected ? '已选择' : '选择'}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              aria-label="关闭查看器"
              onClick={onClose}
              className="text-white hover:bg-white/15 hover:text-white"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* 主体：全屏媒体 + 左右切条 */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <ViewerMedia key={post.id} post={post} />

            {total > 1 && (
              <>
                <button
                  type="button"
                  aria-label="上一条快拍"
                  onClick={() => step(-1)}
                  className="absolute left-1 flex size-11 items-center justify-center rounded-full bg-black/40 text-white outline-none transition-colors hover:bg-black/65 focus-visible:ring-2 focus-visible:ring-white/70 sm:left-3"
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  type="button"
                  aria-label="下一条快拍"
                  onClick={() => step(1)}
                  className="absolute right-1 flex size-11 items-center justify-center rounded-full bg-black/40 text-white outline-none transition-colors hover:bg-black/65 focus-visible:ring-2 focus-visible:ring-white/70 sm:right-3"
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>

          {/* 底栏：元信息 + 时间 + 下载（移动端拇指区，pb 让开 Home 指示条） */}
          <div className="flex shrink-0 items-end justify-between gap-3 px-3 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] sm:px-4">
            <div className="min-w-0 flex-1">
              <IGStoryMeta post={post} tone="overlay" />
              {post.created_at && (
                <p className="text-xs tabular-nums text-white/50">
                  {formatIGTime(post.created_at, 'plain')}
                </p>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              aria-label="下载该快拍"
              onClick={() => onDownload(post)}
              className="shrink-0"
            >
              <Download className="size-4" />
              下载
            </Button>
          </div>

          <div className="hidden" aria-hidden="true">
            {previewUrls.map((url, i) => <img key={i} src={url} alt="" />)}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}
