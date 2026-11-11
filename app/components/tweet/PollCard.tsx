import type { PollChoice, TweetPoll } from '~/types'
import { MediaImage } from '~/components/ui/media'
import { normalizeMediaUrl } from '~/lib/media-url'
import { formatDate } from '~/lib/react-tweet/utils/date-utils'
import { useProxyMedia } from '~/lib/stores/appConfig'
import { cn } from '~/lib/utils'

/**
 * 投票卡（只读结果快照）。
 *
 * X 把投票放在 card 里，这里按内容分两态：
 * - 纯文字：选项行 + 底层进度填充 + 百分比；
 * - 带图：2 列图片网格 + 标签/百分比 + 细进度条。
 *
 * 不做投票动作（匿名只读）；票数是抓取时快照，不实时刷新。
 */

function statusText(poll: TweetPoll): string {
  if (poll.countsAreFinal)
    return '最终结果'
  if (poll.endDatetime)
    return `${formatDate(poll.endDatetime, 'MM月dd日 HH:mm')} 截止`
  return '投票中'
}

function ChoiceLabel({ choice, leading }: { choice: PollChoice, leading: boolean }) {
  return (
    <span className={cn('min-w-0 break-words text-sm leading-snug', leading && 'font-semibold')}>
      {choice.label}
    </span>
  )
}

function TextChoices({ choices, max, leading }: {
  choices: PollChoice[]
  max: number
  leading: boolean
}) {
  return (
    <ul className="space-y-1.5">
      {choices.map((choice, index) => {
        const isLeading = leading && choice.percentage === max
        return (
          <li
            key={`${index}-${choice.label}`}
            className="relative overflow-hidden rounded border border-border/50"
          >
            <div
              aria-hidden
              className={cn('absolute inset-y-0 left-0', isLeading ? 'bg-primary/20' : 'bg-primary/10')}
              style={{ width: `${choice.percentage}%` }}
            />
            <div className="relative flex items-center justify-between gap-3 px-2.5 py-1.5">
              <ChoiceLabel choice={choice} leading={isLeading} />
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {choice.percentage}
                %
              </span>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function ImageChoices({ choices, max, leading }: {
  choices: PollChoice[]
  max: number
  leading: boolean
}) {
  const proxyMedia = useProxyMedia()

  return (
    <ul className="grid grid-cols-2 gap-1.5">
      {choices.map((choice, index) => {
        const isLeading = leading && choice.percentage === max
        return (
          <li
            key={`${index}-${choice.label}`}
            className="overflow-hidden rounded border border-border/50"
          >
            {choice.imageUrl && (
              <div className="relative aspect-square bg-muted/50">
                <MediaImage
                  src={proxyMedia(normalizeMediaUrl(choice.imageUrl))}
                  alt={choice.label}
                  className="absolute inset-0 size-full object-cover"
                  loading="lazy"
                  decoding="async"
                  loadingFallback={choice.color
                    ? <div className="absolute inset-0" style={{ backgroundColor: choice.color }} />
                    : undefined}
                />
              </div>
            )}
            <div className="px-2 py-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className={cn(
                  'line-clamp-2 min-w-0 break-words text-xs leading-snug',
                  isLeading && 'font-semibold',
                )}
                >
                  {choice.label}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {choice.percentage}
                  %
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div
                  className={cn('h-full rounded-full', isLeading ? 'bg-primary' : 'bg-primary/50')}
                  style={{ width: `${choice.percentage}%` }}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function PollCardView({
  poll,
  className,
}: {
  poll: TweetPoll
  className?: string
}) {
  const max = Math.max(...poll.choices.map(choice => choice.percentage))
  const leading = max > 0 && poll.choices.filter(choice => choice.percentage === max).length === 1

  return (
    <div
      role="group"
      aria-label="投票"
      className={cn('mt-2 rounded-md border border-border/60 p-3', className)}
    >
      {poll.hasImages
        ? <ImageChoices choices={poll.choices} max={max} leading={leading} />
        : <TextChoices choices={poll.choices} max={max} leading={leading} />}

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {poll.totalVotes.toLocaleString('en-US')}
          {' '}
          票
        </span>
        <span>{statusText(poll)}</span>
      </div>
    </div>
  )
}
