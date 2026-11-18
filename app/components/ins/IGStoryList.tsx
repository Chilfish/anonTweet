import type { IGPost } from '~/types'
import { Download, Loader2, PlayIcon } from 'lucide-react'
import { useReducer, useState } from 'react'
import { Button } from '~/components/ui/button'
import { MediaImage, MediaVideo } from '~/components/ui/media'
import { downloadFiles } from '~/lib/downloader'
import { storySelectionReducer } from '~/lib/ig/storyViewer'
import { extractIGStoryDownloadItems } from '~/lib/igDownloader'
import { cn, formatIGTime, toast } from '~/lib/utils'
import { IGCardHeader } from './IGCardHeader'
import { IGStoryGrid } from './IGStoryGrid'
import { IGStoryMeta } from './IGStoryMeta'
import { IGStoryViewer } from './IGStoryViewer'

interface IGStoryListProps {
  posts: IGPost[]
  className?: string
}

/** 头部副标题的类别文案：单条/列表共用，精选集带上标题。 */
function storyKind(post: IGPost | undefined): string {
  if (post?.type === 'highlight') {
    return post.highlight_title
      ? `精选 · ${post.highlight_title}`
      : '精选集'
  }
  return '快拍'
}

/** 按条目数收敛列数：少量快拍不在 5 列网格里空掉大半张卡。 */
function gridColumnsClass(total: number): string {
  if (total <= 2)
    return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2'
  if (total === 3)
    return 'grid-cols-3 sm:grid-cols-3 md:grid-cols-3'
  if (total === 4)
    return 'grid-cols-2 sm:grid-cols-4 md:grid-cols-4'
  if (total <= 8)
    return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-4'
  return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5'
}

/**
 * 快拍 / 精选集列表（相册卡片，下载优先）。
 *
 * 与帖子卡共用同一套外壳：`rounded-2xl` 卡片 + `IGCardHeader` 身份头，
 * 不再在页面背景上铺一张贴边网格。列表型（tray / 精选集）在卡片内展示
 * 缩略图网格与条数工具栏；单条快拍显示 9:16 的 story 画布，点击进全屏查看器。
 *
 * 列表仍只保留下载：无帖子互动栏、截图与翻译入口。
 */
export function IGStoryList({ posts, className }: IGStoryListProps) {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, dispatchSelected] = useReducer(storySelectionReducer, new Set<string>())
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState<{ done: number, total: number } | null>(null)

  const total = posts.length
  const primary = posts[0]
  const allSelected = total > 0 && selected.size === total
  const busy = progress !== null
  const single = total === 1

  const download = async (targets: IGPost[]) => {
    const items = extractIGStoryDownloadItems(targets)
    if (!items.length) {
      toast.info('未检测到可下载的媒体资源')
      return
    }

    setProgress({ done: 0, total: items.length })
    toast.info(`开始下载 ${items.length} 个文件...`)

    let done = 0
    try {
      await downloadFiles(items, {
        onComplete: () => {
          done += 1
          setProgress({ done, total: items.length })
        },
        onError: (error, filename) => {
          console.error(`[IG Story DownloadError] File: ${filename}`, error)
          toast.error(`文件下载失败: ${filename}`)
        },
      })
      toast.success('下载任务结束', { description: `成功处理 ${done}/${items.length} 个文件` })
    }
    catch {
      toast.error('批量下载进程异常终止')
    }
    finally {
      setProgress(null)
    }
  }

  const toggle = (id: string) => {
    // 查看器里的「选择」也要把工具栏切到选择态，否则选中项在列表上不可见
    setSelectionMode(true)
    dispatchSelected({ type: 'toggle', id })
  }

  const exitSelection = () => {
    setSelectionMode(false)
    dispatchSelected({ type: 'clear' })
  }

  const downloadSelected = () => download(posts.filter(p => selected.has(p.id)))

  if (!primary)
    return null

  const subtitle = `@${primary.username} · ${storyKind(primary)}`

  return (
    <>
      <article
        data-slot="story-album"
        className={cn(
          'mx-auto w-full overflow-hidden rounded-2xl border border-border/60 bg-card',
          single
            ? 'max-w-[420px]'
            : 'max-w-[600px]',
          className,
        )}
      >
        <div data-slot="story-album-header" className="px-4 pt-3 pb-2">
          <IGCardHeader
            username={primary.username}
            fullname={primary.fullname}
            avatarUrl={primary.avatar_url}
            verified={primary.verified}
            subtitle={subtitle}
          />
        </div>

        {single
          ? (
              <SingleStory
                post={primary}
                busy={busy}
                onOpen={() => setViewerIndex(0)}
                onDownload={() => download([primary])}
              />
            )
          : (
              <>
                <div
                  data-slot="story-album-toolbar"
                  className="flex items-center justify-between gap-2 px-4 pb-2"
                >
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {selectionMode
                      ? `已选 ${selected.size} / ${total}`
                      : `共 ${total} 条快拍`}
                  </span>

                  <div className="flex items-center gap-1">
                    {selectionMode
                      ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={exitSelection}>
                              取消
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => dispatchSelected(allSelected
                                ? { type: 'clear' }
                                : {
                                    type: 'set',
                                    ids: posts.map(p => p.id),
                                  })}
                            >
                              {allSelected ? '取消全选' : '全选'}
                            </Button>
                            <Button
                              size="sm"
                              disabled={selected.size === 0 || busy}
                              onClick={downloadSelected}
                            >
                              下载选中
                            </Button>
                          </>
                        )
                      : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setSelectionMode(true)}>
                              选择
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busy}
                              onClick={() => download(posts)}
                            >
                              {busy
                                ? (
                                    <>
                                      <Loader2 className="size-4 animate-spin" />
                                      下载中
                                      {' '}
                                      {progress?.done}
                                      /
                                      {progress?.total}
                                    </>
                                  )
                                : '全部下载'}
                            </Button>
                          </>
                        )}
                  </div>
                </div>

                <div className="px-2 pb-2">
                  <IGStoryGrid
                    posts={posts}
                    selectable={selectionMode}
                    selected={selected}
                    onOpen={setViewerIndex}
                    onToggle={toggle}
                    className={gridColumnsClass(total)}
                  />
                </div>
              </>
            )}
      </article>

      <IGStoryViewer
        posts={posts}
        index={viewerIndex ?? 0}
        open={viewerIndex !== null}
        onIndexChange={setViewerIndex}
        onClose={() => setViewerIndex(null)}
        selected={selected}
        onToggle={toggle}
        onDownload={post => download([post])}
        busy={busy}
      />
    </>
  )
}

/** 单条快拍：9:16 画布 + 元信息 / 时间 / 下载，点击画面进全屏查看器。 */
function SingleStory({
  post,
  busy,
  onOpen,
  onDownload,
}: {
  post: IGPost
  busy: boolean
  onOpen: () => void
  onDownload: () => void
}) {
  const media = post.media?.[0]

  return (
    <>
      <button
        type="button"
        data-slot="story-single-media"
        aria-label="查看该快拍"
        onClick={onOpen}
        className="group block w-full bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <div className="relative aspect-[9/16] w-full overflow-hidden">
          {media?.type === 'video'
            ? (
                <MediaVideo
                  src={media.video_url!}
                  preload="metadata"
                  containerClassName="size-full"
                  className="object-contain"
                />
              )
            : media?.display_url
              ? (
                  <MediaImage
                    src={media.display_url}
                    alt=""
                    containerClassName="size-full"
                    className="object-contain"
                  />
                )
              : (
                  <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
                    该条快拍无可展示媒体
                  </span>
                )}

          {media?.type === 'video' && (
            <span className="pointer-events-none absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-black/55 text-white">
              <PlayIcon className="ml-0.5 size-3.5 fill-white" />
            </span>
          )}
        </div>
      </button>

      <div className="flex items-end justify-between gap-3 border-t border-border/60 px-4 py-2.5">
        <div className="min-w-0 flex-1">
          <IGStoryMeta post={post} className="gap-1 p-0" />
          {post.created_at && (
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatIGTime(post.created_at, 'card')}
            </p>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          aria-label="下载该快拍"
          onClick={onDownload}
          className="shrink-0"
        >
          <Download className="size-4" />
          下载
        </Button>
      </div>
    </>
  )
}
