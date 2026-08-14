import type { EnrichedTweet } from '~/types'
import { ImageIcon } from 'lucide-react'
import { forwardRef, useMemo } from 'react'
import { TranslationEditor } from '~/components/translation/TranslationEditor'
import { Button } from '~/components/ui/button'
import { useVisionLogic } from '~/hooks/use-vision-logic'
import { TweetHeader, TweetMedia } from '~/lib/react-tweet'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import {
  useScreenshoting,
  useTranslationActions,
  useVisionVisibility,
} from '~/lib/stores/hooks'
import { cn } from '~/lib/utils'
import { AIVisionBlock } from './AIVisionBlock'
import { TweetLinkCard } from './TweetCard'
import { TweetMediaAlt } from './TweetMediaAlt'
import { TweetTextBody } from './TweetTextBody'

export type TweetVariant = 'thread' | 'quoted' | 'main' | 'main-in-thread'

interface TweetNodeProps {
  tweet: EnrichedTweet
  variant: TweetVariant
  hasParent?: boolean
}

function TweetMediaSection({ tweet }: { tweet: EnrichedTweet }) {
  const isInlineMedia = useAppConfigStore(state => state.isInlineMedia)

  const tweetWithMediaConfig = useMemo(() => ({
    ...tweet,
    isInlineMeida: isInlineMedia || tweet.isInlineMeida,
  }), [tweet, isInlineMedia])

  if (!(tweet.mediaDetails || []).length)
    return null

  return (
    <TweetMedia
      tweet={tweetWithMediaConfig}
      showCoverOnly={true}
    />
  )
}

/**
 * 翻译按钮旁的图片描述入口（手动添加/编辑，Apple「单一入口」）。受全局设置
 * `showVisionEntry` 门控（默认关闭，较少使用的功能）；展开态块内已有编辑入口时
 * 不再重复放按钮。点击先置逐推文覆盖为展示，再打开编辑器弹窗：全局关 +
 * 手动添加后新内容立即可见。
 */
function VisionEntryButton({
  tweet,
  editor,
}: {
  tweet: EnrichedTweet
  editor: ReturnType<typeof useVisionLogic>
}) {
  const enableAIVision = useAppConfigStore(s => s.enableAIVision)
  const showVisionEntry = useAppConfigStore(s => s.showVisionEntry)
  const isScreenshoting = useScreenshoting()
  const visionOverride = useVisionVisibility(tweet.id_str)
  const { setVisionVisibility } = useTranslationActions()

  const hasPhotos = (tweet.mediaDetails ?? []).some(m => m.type === 'photo')
  const hasContent = (tweet.visionInfo ?? []).some(
    v => v.status === 'done' || v.status === 'error',
  )
  const blockExpanded = hasContent && (visionOverride ?? enableAIVision)

  if (!showVisionEntry || !hasPhotos || isScreenshoting)
    return null
  // 展开态块内已有「生成 / 编辑」入口，不重复放按钮
  if (blockExpanded)
    return null

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon-sm"
      className="bg-transparent"
      title="添加图片描述"
      onClick={() => {
        setVisionVisibility(tweet.id_str, true)
        editor.initializeEditor()
      }}
    >
      <ImageIcon className="size-3.5 text-muted-foreground" />
      <span className="sr-only">添加图片描述</span>
    </Button>
  )
}

export const TweetNode = forwardRef<HTMLDivElement, TweetNodeProps>(({
  tweet,
  variant,
  hasParent,
}, ref) => {
  const isQuoted = variant === 'quoted'
  const isThreadContext = variant === 'thread' || variant === 'main-in-thread'
  const avatarSize = isQuoted ? 'small' : 'medium'

  // 编辑器状态上提：翻译按钮旁的图片描述入口与 AIVisionBlock 内入口共用同一弹窗
  const visionEditor = useVisionLogic(tweet)

  // 样式映射表，替代混乱的 cn
  const styles = useMemo(() => ({
    container: cn('relative', {
      'p-3 border-2 rounded-2xl mt-2': isQuoted,
      'pb-3': hasParent, // 原 isParentTweet
    }),
    body: cn({ 'pl-12': isThreadContext }),
    header: cn({ 'pb-1': variant === 'thread' }),
  }), [isQuoted, hasParent, isThreadContext, variant])

  return (
    <div ref={ref} className={styles.container}>
      <TweetHeader
        tweet={tweet}
        className={styles.header}
        createdAtInline
        avatarSize={avatarSize}
      />

      <div className="absolute top-2 right-1 flex items-center gap-1">
        <TranslationEditor originalTweet={tweet} className="" />
        <VisionEntryButton tweet={tweet} editor={visionEditor} />
      </div>

      <div className={styles.body}>
        <TweetTextBody tweet={tweet} />

        <TweetMediaSection tweet={tweet} />

        <TweetMediaAlt tweet={tweet} />
        <AIVisionBlock tweet={tweet} editor={visionEditor} />
        {tweet.card && <TweetLinkCard tweet={tweet} />}

        {tweet.quotedTweet && (
          <TweetNode
            tweet={tweet.quotedTweet}
            variant="quoted"
            hasParent={false}
          />
        )}
      </div>
    </div>
  )
})

TweetNode.displayName = 'TweetNode'
