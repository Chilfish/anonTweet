import type { IGPost } from '~/types'
import { Check, Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { downloadFiles } from '~/lib/downloader'
import { extractIGStoryDownloadItems } from '~/lib/igDownloader'
import { cn, formatIGTime, toast } from '~/lib/utils'
import { IGMediaGrid } from './IGMediaGrid'
import { IGStoryMeta } from './IGStoryMeta'

interface IGStoryListProps {
  posts: IGPost[]
  className?: string
}

/**
 * 快拍 / 精选集列表（下载优先）。
 *
 * 用户当前快拍 tray 与精选集会被展开成一张张卡；这里的诉求是**把媒体取下来**，
 * 因此不提供帖子那套截图/翻译/复制，只保留：
 * - 顶部：条数 · 全选/取消 · 下载选中(n) · 全部下载（带进度）
 * - 每卡：勾选框（默认不选）+ 媒体 + 链接贴纸/精选标题 + 时间 + 单条下载
 */
export function IGStoryList({ posts, className }: IGStoryListProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [progress, setProgress] = useState<{ done: number, total: number } | null>(null)

  const total = posts.length
  const allSelected = total > 0 && selected.size === total
  const busy = progress !== null

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id))
        next.delete(id)
      else
        next.add(id)
      return next
    })
  }

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

  const downloadSelected = () => download(posts.filter(p => selected.has(p.id)))

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">
          共
          {' '}
          {total}
          {' '}
          条快拍
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelected(allSelected ? new Set() : new Set(posts.map(p => p.id)))}
        >
          {allSelected ? '取消全选' : '全选'}
        </Button>

        <Button
          size="sm"
          disabled={selected.size === 0 || busy}
          onClick={downloadSelected}
        >
          下载选中 (
          {selected.size}
          )
        </Button>

        <Button size="sm" variant="secondary" disabled={busy} onClick={() => download(posts)}>
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
      </div>

      <div className="flex flex-col gap-4">
        {posts.map((post, i) => (
          <IGStoryCard
            key={post.id}
            post={post}
            index={i}
            total={total}
            selected={selected.has(post.id)}
            busy={busy}
            onToggle={() => toggle(post.id)}
            onDownload={() => download([post])}
          />
        ))}
      </div>
    </div>
  )
}

interface IGStoryCardProps {
  post: IGPost
  index: number
  total: number
  selected: boolean
  busy: boolean
  onToggle: () => void
  onDownload: () => void
}

/** 单条快拍卡：勾选框 + 媒体 + 元信息 + 单条下载。 */
function IGStoryCard({
  post,
  index,
  total,
  selected,
  busy,
  onToggle,
  onDownload,
}: IGStoryCardProps) {
  return (
    <article
      className={cn(
        'relative w-full max-w-[468px] mx-auto overflow-hidden rounded-sm',
        'border bg-card',
        selected ? 'border-foreground/30' : 'border-border/20',
      )}
    >
      <button
        type="button"
        aria-label={selected ? '取消选择' : '选择该快拍'}
        aria-pressed={selected}
        onClick={onToggle}
        className={cn(
          'absolute left-2 top-2 z-20 flex size-6 items-center justify-center rounded-full',
          'border shadow-sm transition-colors',
          selected
            ? 'bg-foreground text-background border-foreground'
            : 'bg-background/80 text-transparent border-border',
        )}
      >
        <Check className="size-4" />
      </button>

      {post.media?.length > 0 && <IGMediaGrid media={post.media} />}

      <IGStoryMeta post={post} />

      <div className="flex items-center justify-between gap-2 px-4 py-2">
        <span className="text-xs text-muted-foreground/60 tabular-nums">
          {index + 1}
          /
          {total}
          {post.created_at && (
            <>
              {' · '}
              {formatIGTime(post.created_at, 'plain')}
            </>
          )}
        </span>

        <Button variant="secondary" size="sm" disabled={busy} aria-label="下载该快拍" onClick={onDownload}>
          <Download className="size-4" />
          下载
        </Button>
      </div>
    </article>
  )
}
