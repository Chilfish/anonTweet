import type { IGPost } from '~/types'
import { Download, Loader2 } from 'lucide-react'
import { useReducer, useState } from 'react'
import { Button } from '~/components/ui/button'
import { downloadFiles } from '~/lib/downloader'
import { storySelectionReducer } from '~/lib/ig/storyViewer'
import { extractIGStoryDownloadItems } from '~/lib/igDownloader'
import { cn, toast } from '~/lib/utils'
import { IGMediaGrid } from './IGMediaGrid'
import { IGStoryGrid } from './IGStoryGrid'
import { IGStoryMeta } from './IGStoryMeta'
import { IGStoryViewer } from './IGStoryViewer'

interface IGStoryListProps {
  posts: IGPost[]
  className?: string
}

/**
 * 快拍 / 精选集列表（相册网格，下载优先）。
 *
 * 用户当前快拍 tray 与精选集会被展开成 N 条；几十条竖排卡片一屏一条、且不像相册，
 * 故改为**缩略图网格 + 全屏查看器**：
 * - 浏览态：点格 = 打开查看器（细看 + 单条下载）；工具栏 = 共 N 条 · 选择 · 全部下载（进度）
 * - 选择态：点「选择」进入多选，点格 = 勾选；工具栏 = 已选 n/N · 全选 · 下载选中(n) · 取消
 *
 * 仍不提供帖子那套截图/翻译/复制（快拍只保留下载）。仅 1 条时保留自然比例的单卡，
 * 避免一个孤零零的方图缩略图。
 */
export function IGStoryList({ posts, className }: IGStoryListProps) {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, dispatchSelected] = useReducer(storySelectionReducer, new Set<string>())
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [progress, setProgress] = useState<{ done: number, total: number } | null>(null)

  const total = posts.length
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

  return (
    <div className={cn('flex w-full flex-col gap-3 px-2', className)}>
      {/*
        工具栏：手机贴底（拇指区，iOS 相册式），`sm` 起回到贴顶；两种形态都吸附，
        所以几十条滚动时「全选 / 下载选中」始终在手边。
      */}
      <div
        className={cn(
          'sticky bottom-0 z-30 order-last -mx-1 flex flex-wrap items-center gap-2 backdrop-blur',
          'border-t bg-background/90 px-1 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]',
          'sm:top-0 sm:bottom-auto sm:order-first sm:border-t-0 sm:pb-2',
        )}
      >
        {selectionMode
          ? (
              <>
                <span className="text-sm text-muted-foreground tabular-nums">
                  已选
                  {' '}
                  {selected.size}
                  {' '}
                  /
                  {' '}
                  {total}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => dispatchSelected(allSelected
                    ? { type: 'clear' }
                    : { type: 'set', ids: posts.map(p => p.id) })}
                >
                  {allSelected ? '取消全选' : '全选'}
                </Button>

                <Button size="sm" disabled={selected.size === 0 || busy} onClick={downloadSelected}>
                  下载选中 (
                  {selected.size}
                  )
                </Button>

                <Button variant="ghost" size="sm" onClick={exitSelection}>
                  取消
                </Button>
              </>
            )
          : (
              <>
                <span className="text-sm text-muted-foreground tabular-nums">
                  共
                  {' '}
                  {total}
                  {' '}
                  条快拍
                </span>

                {!single && (
                  <Button variant="secondary" size="sm" onClick={() => setSelectionMode(true)}>
                    选择
                  </Button>
                )}

                <Button variant="secondary" size="sm" disabled={busy} onClick={() => download(posts)}>
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

      {single && posts[0]
        ? (
            <IGStorySingleCard
              post={posts[0]}
              busy={busy}
              onOpen={() => setViewerIndex(0)}
              onDownload={() => download(posts)}
            />
          )
        : (
            <IGStoryGrid
              posts={posts}
              selectable={selectionMode}
              selected={selected}
              onOpen={setViewerIndex}
              onToggle={toggle}
            />
          )}

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
    </div>
  )
}

/** 单条快拍：保留自然比例的大图（网格方图裁切对单条是浪费），点击开查看器。 */
function IGStorySingleCard({
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
  return (
    <article className="relative mx-auto w-full max-w-[468px] overflow-hidden rounded-sm border border-border/20 bg-card">
      <button
        type="button"
        aria-label="查看该快拍"
        onClick={onOpen}
        className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        {post.media?.length > 0 && <IGMediaGrid media={post.media} />}
      </button>

      <IGStoryMeta post={post} />

      <div className="flex items-center justify-end px-4 py-2">
        <Button variant="secondary" size="sm" disabled={busy} aria-label="下载该快拍" onClick={onDownload}>
          <Download className="size-4" />
          下载
        </Button>
      </div>
    </article>
  )
}
