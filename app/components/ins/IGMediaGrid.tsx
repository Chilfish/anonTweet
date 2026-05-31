import type { IGMedia } from '~/types'
import { ChevronUpIcon, PlayIcon } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { MediaImage, MediaVideo } from '~/components/ui/media'
import { cn } from '~/lib/utils'

interface IGMediaGridProps {
  media: IGMedia[]
  /** Compact mode max rows. Default 2 — keeps card height predictable for screenshots. */
  maxRows?: number
  /** Max columns per row. Default 3. */
  maxCols?: number
  /** Show "此帖共 N 张" subtitle beneath grid. For screenshot export context. */
  showInfoLabel?: boolean
  className?: string
}

// ─── Row Distribution ────────────────────────────────────────────

/**
 * Smart row distribution — prioritize maxCols, never orphan a single image.
 *
 * | count | maxCols=3   |
 * |-------|-------------|
 * | 1     | [1]         |
 * | 2     | [2]         |
 * | 3     | [3]         |
 * | 4     | [2,2]       |
 * | 5     | [3,2]       |
 * | 6     | [3,3]       |
 * | 7     | [3,2,2]     |
 * | 8     | [3,3,2]     |
 * | 9     | [3,3,3]     |
 * | 10    | [3,3,2,2]   |
 */
function distributeRows(count: number, maxCols: number): number[] {
  if (count === 0)
    return []
  if (count <= maxCols)
    return [count]

  const rows: number[] = []
  let remaining = count

  while (remaining >= maxCols) {
    rows.push(maxCols)
    remaining -= maxCols
  }

  if (remaining === 1) {
    if (rows.length >= 2) {
      rows.pop()!
      rows.pop()!
      rows.push(maxCols - 1, maxCols - 1)
    }
    else {
      rows.pop()!
      rows.push(maxCols - 1, maxCols - 1)
    }
  }
  else if (remaining > 0) {
    rows.push(remaining)
  }

  return rows
}

// ─── Object Fit ──────────────────────────────────────────────────

/**
 * Content-aware object-position — avoids decapitating portrait photos
 * in square thumbnails.
 *
 * Instagram thumbnails may be pre-cropped; we use `width_original` /
 * `height_original` when available, fall back to display dimensions.
 */
function getImageFitClass(media: IGMedia): string {
  const w = media.width_original ?? media.width
  const h = media.height_original ?? media.height
  if (!w || !h)
    return 'object-cover object-center'

  const ratio = w / h
  // Tall portrait — show upper portion (faces are rarely at the bottom)
  if (ratio < 0.8)
    return 'object-cover object-[center_15%]'
  // Mild portrait — slight top bias
  if (ratio < 0.95)
    return 'object-cover object-[center_25%]'
  // Square / landscape — center crop is safe
  return 'object-cover object-center'
}

// ─── Photo Stack ─────────────────────────────────────────────────

/** At most this many layers behind the top image. */
const MAX_STACK_LAYERS = 3

/**
 * Per-layer visual config, deepest-first (DOM order).
 *
 * z-index is intentionally inverted: the most-offset layer
 * (deepest in the physical pile) sits on top visually.  This mimics
 * real photo stacks — each print partially covers the one below it.
 *
 * Translates push beyond the cell boundary (~8-10 px) for a slight
 * "break out of the frame" tension.  White photo-frame borders +
 * escalating drop shadows reinforce the skeuomorphic depth.
 *
 * Hover: fan the pile wider by exaggerating offsets and rotation.
 */
const LAYER_CONFIGS = [
  {
    // Deepest physical position — highest visual z, peeks from top-left
    translate: 'translate-x-[8px] translate-y-[9px]',
    rotate: 'rotate-[5.5deg]',
    shadow: 'shadow-[0_6px_20px_rgba(0,0,0,0.15)]',
    z: 'z-30',
    hover: 'group-hover/stack:translate-x-[13px] group-hover/stack:translate-y-[14px] group-hover/stack:rotate-[9deg]',
  },
  {
    // Middle — peeks from bottom-right
    translate: '-translate-x-[7px] -translate-y-[6px]',
    rotate: '-rotate-[3.5deg]',
    shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.10)]',
    z: 'z-20',
    hover: 'group-hover/stack:-translate-x-[11px] group-hover/stack:-translate-y-[10px] group-hover/stack:-rotate-[6deg]',
  },
  {
    // Nearest to base — peeks from top-right
    translate: '-translate-x-[3.5px] translate-y-[4px]',
    rotate: 'rotate-[1.5deg]',
    shadow: 'shadow-[0_2px_5px_rgba(0,0,0,0.07)]',
    z: 'z-10',
    hover: 'group-hover/stack:-translate-x-[6px] group-hover/stack:translate-y-[7px] group-hover/stack:rotate-[3deg]',
  },
] as const

/** Shared border style — like a printed photo with a thin white frame. */
const PRINT_BORDER = 'border-[2px] border-white/85 dark:border-zinc-700'

/**
 * Physical photo pile — a stack of prints.
 *
 * Hidden images stack ON TOP of the last visible one, each offset
 * in a different direction and rotated slightly — like prints thrown
 * onto a pile.  White borders and drop shadows create depth; the
 * z-index is inverted so the deepest (most-offset) layer reads as
 * the "top" of the visual pile.
 *
 * Layers intentionally break out of the cell boundary (~8-10 px)
 * for a "too many to contain" tension.
 *
 * Hover fans the pile wider.  No text label needed.
 */
function PhotoStack({
  topImage,
  behindImages,
  hiddenCount,
  onClick,
}: {
  topImage: IGMedia
  behindImages: IGMedia[]
  hiddenCount: number
  onClick: () => void
}) {
  // Nearest hidden images as layers — deepest-first DOM order
  const layers = behindImages.slice(0, MAX_STACK_LAYERS).reverse()

  return (
    <div
      className="relative aspect-square overflow-visible group/stack cursor-pointer select-none rounded-sm"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Layer images — deepest to nearest */}
      {layers.map((media, i) => {
        const cfg = LAYER_CONFIGS[i]!
        return (
          <div
            key={media.media_id || i}
            className={cn(
              'absolute inset-0 overflow-hidden',
              cfg.translate,
              cfg.rotate,
              cfg.shadow,
              cfg.z,
              PRINT_BORDER,
              'rounded-sm origin-center',
              'transition-all duration-350 ease-out',
              cfg.hover,
            )}
          >
            <MediaImage
              src={media.display_url}
              alt=""
              containerClassName="size-full"
              className={cn(getImageFitClass(media), 'rounded-[1px]')}
            />
          </div>
        )
      })}

      {/* Top layer — base image, sits at the bottom of the z-stack */}
      <div
        className={cn(
          'absolute inset-0 z-0 overflow-hidden',
          PRINT_BORDER,
          'rounded-sm',
          'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
          'transition-transform duration-350 ease-out',
          'group-hover/stack:scale-[1.02]',
        )}
      >
        <MediaImage
          src={topImage.display_url}
          alt=""
          containerClassName="size-full"
          className={cn(getImageFitClass(topImage), 'rounded-[1px]')}
        />
      </div>

      {/* Count badge */}
      <span
        className={cn(
          'absolute bottom-1.5 right-1.5 z-40',
          'bg-black/70 backdrop-blur-sm',
          'text-white text-[10px] font-semibold tabular-nums',
          'px-1.5 py-0.5 rounded-full shadow-sm',
          'pointer-events-none',
        )}
      >
        +
        {hiddenCount}
      </span>
    </div>
  )
}

// ─── Single Image ────────────────────────────────────────────────

function SingleMedia({ media }: { media: IGMedia }) {
  return (
    <div className="relative overflow-hidden bg-muted/10">
      {media.type === 'video'
        ? (
            <MediaVideo
              src={media.video_url!}
              preload="metadata"
              containerClassName="w-full"
            />
          )
        : (
            <MediaImage
              src={media.display_url}
              alt=""
              containerClassName="w-full"
              className={cn(getImageFitClass(media))}
            />
          )}
      {media.type === 'video' && (
        <div className="absolute top-2 right-2 size-5 rounded-full bg-black/50 flex items-center justify-center">
          <PlayIcon className="size-3 text-white fill-white ml-0.5" />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────

/**
 * Instagram media grid with smart folding.
 *
 * Two modes:
 * - **Compact** (default): up to `maxRows` rows, excess folds into a
 *   physical photo pile.  Card height stays predictable for long-screenshot export.
 * - **Expanded**: all images in smart-distributed rows.  Tap "收起" to fold back.
 */
export function IGMediaGrid({
  media,
  maxRows = 2,
  maxCols = 3,
  showInfoLabel = false,
  className,
}: IGMediaGridProps) {
  const [expanded, setExpanded] = useState(false)

  // ── Layout ──
  const layout = useMemo(() => {
    if (!media.length)
      return { rows: [] as number[], hiddenCount: 0, allRows: [] as number[] }

    const allRows = distributeRows(media.length, maxCols)

    if (allRows.length <= maxRows) {
      return { rows: allRows, hiddenCount: 0, allRows }
    }

    const compactRows = allRows.slice(0, maxRows)
    const shown = compactRows.reduce((sum, r) => sum + r, 0)

    return {
      rows: compactRows,
      hiddenCount: media.length - shown,
      allRows,
    }
  }, [media.length, maxRows, maxCols])

  const displayRows = expanded ? layout.allRows : layout.rows
  const shouldShowStack = layout.hiddenCount > 0 && !expanded

  const handleExpand = useCallback(() => setExpanded(true), [])
  const handleCollapse = useCallback(() => setExpanded(false), [])

  if (!media.length)
    return null

  // Single image: full-width, natural ratio
  if (media.length === 1 && media[0]) {
    return (
      <div className={className}>
        <SingleMedia media={media[0]} />
      </div>
    )
  }

  // ── Row-based grid ──
  let cursor = 0

  return (
    <>
      <div className="flex flex-col gap-[1px] bg-muted/20">
        {displayRows.map((cols, rowIdx) => {
          const rowImages = media.slice(cursor, cursor + cols)
          const isLastRow = rowIdx === displayRows.length - 1
          cursor += cols

          return (
            <div key={rowIdx} className="flex gap-[1px]">
              {rowImages.map((m, i) => {
                const isLastItem = isLastRow && i === rowImages.length - 1
                const isStackTarget = isLastItem && shouldShowStack

                if (isStackTarget) {
                  // The next hidden images become the pile layers
                  const behindImages = media.slice(cursor, cursor + MAX_STACK_LAYERS)

                  return (
                    <div key={m.media_id || i} className="flex-1 relative z-10 overflow-visible">
                      <PhotoStack
                        topImage={m}
                        behindImages={behindImages}
                        hiddenCount={layout.hiddenCount}
                        onClick={handleExpand}
                      />
                    </div>
                  )
                }

                return (
                  <div
                    key={m.media_id || i}
                    className={cn(
                      'flex-1 relative aspect-square overflow-hidden bg-muted/10',
                    )}
                  >
                    {m.type === 'video'
                      ? (
                          <MediaVideo
                            src={m.video_url!}
                            preload="metadata"
                            containerClassName="size-full"
                          />
                        )
                      : (
                          <MediaImage
                            src={m.display_url}
                            alt={`${cursor - cols + i + 1}`}
                            containerClassName="size-full"
                            className={getImageFitClass(m)}
                          />
                        )}

                    {m.type === 'video' && (
                      <div className="absolute top-2 right-2 size-5 rounded-full bg-black/50 flex items-center justify-center">
                        <PlayIcon className="size-3 text-white fill-white ml-0.5" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Info label — for screenshot context */}
      {showInfoLabel && layout.hiddenCount > 0 && (
        <p className="pt-1.5 text-[11px] text-muted-foreground/40 text-center tabular-nums select-none">
          此帖共
          {' '}
          {media.length}
          {' '}
          张图片
        </p>
      )}

      {/* Collapse — only when expanded beyond compact */}
      {expanded && layout.hiddenCount > 0 && (
        <button
          data-ignore-screenshot
          type="button"
          onClick={handleCollapse}
          className={cn(
            'w-full pt-1 flex items-center justify-center gap-1',
            'text-xs text-muted-foreground/40 hover:text-muted-foreground/70',
            'transition-colors duration-150',
          )}
        >
          <ChevronUpIcon className="size-3" />
          收起
        </button>
      )}
    </>
  )
}
