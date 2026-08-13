import type { EnrichedTweet } from '~/types'
import { ImageIcon } from 'lucide-react'
import { AIVisionEditorDialog } from '~/components/translation/AIVisionEditorDialog'
import { Switch } from '~/components/ui/switch'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { resolveVisionView } from '~/lib/vision/parse'

/**
 * AI 视觉描述 —— 媒体区展示块（app/components/tweet/AIVisionBlock.tsx）
 *
 * 挂在 TweetNode 的 TweetMediaAlt 之后。enableAIVision 开启且存在 photo 时才渲染：
 * 头部栏「AI 图片描述」+ 「仅译文」开关（visionShowTranslatedOnly，隐藏 OCR 原文）+
 * 编辑弹窗入口；正文逐图渲染 resolveVisionView 结果（ocr → 译文||原文；describe → 描述）。
 */
export function AIVisionBlock({ tweet }: { tweet: EnrichedTweet }) {
  const enableAIVision = useAppConfigStore(s => s.enableAIVision)
  const visionShowTranslatedOnly = useAppConfigStore(s => s.visionShowTranslatedOnly)
  const setVisionShowTranslatedOnly = useAppConfigStore(s => s.setVisionShowTranslatedOnly)

  const photos = (tweet.mediaDetails ?? [])
    .map((m, i) => ({ m, i }))
    .filter(x => x.m.type === 'photo')
  if (!enableAIVision || photos.length === 0)
    return null

  const visionInfo = tweet.visionInfo ?? []
  const hasContent = visionInfo.some(v => v.status === 'done' || v.status === 'error')

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border/10 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <ImageIcon className="size-3" />
          AI 图片描述
        </span>
        <span className="flex items-center gap-3">
          {hasContent && (
            <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <Switch
                checked={visionShowTranslatedOnly}
                onCheckedChange={setVisionShowTranslatedOnly}
              />
              仅译文
            </label>
          )}
          <AIVisionEditorDialog originalTweet={tweet} />
        </span>
      </div>

      {hasContent
        ? (
            <div className="space-y-1">
              {photos.map(({ i }) => {
                const aiInfo = visionInfo.find(v => v.index === i)
                const view = resolveVisionView(aiInfo, { translatedOnly: visionShowTranslatedOnly })
                if (!view.hasView && aiInfo?.status !== 'error')
                  return null
                return (
                  <div
                    key={i}
                    className="flex flex-col py-2.5 px-2 border border-border/50 rounded bg-muted/70"
                  >
                    <span className="inline-flex w-fit min-w-fit h-4 items-center justify-center rounded bg-card/30 border border-border/50 px-1.5 text-[10px] font-bold text-muted-foreground">
                      图
                      {i + 1}
                    </span>
                    {aiInfo?.status === 'error' && (
                      <p className="mt-1.5 text-xs text-destructive break-words">{aiInfo.error}</p>
                    )}
                    {view.originalText && (
                      <p className="mt-1.5 tweet-body text-[13px] leading-relaxed break-words opacity-70">
                        {view.originalText}
                      </p>
                    )}
                    {view.displayText && (
                      <p className="mt-1.5 tweet-body text-[13px] font-bold leading-relaxed break-words">
                        {view.displayText}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        : (
            <p className="px-3 py-2 text-[11px] text-muted-foreground/50">
              点击右上角图标为配图生成 AI 描述
            </p>
          )}
    </div>
  )
}
