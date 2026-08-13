import type { EnrichedTweet } from '~/types'
import { ImageIcon } from 'lucide-react'
import { useEffect } from 'react'
import { AIVisionEditorDialog } from '~/components/translation/AIVisionEditorDialog'
import { Switch } from '~/components/ui/switch'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useScreenshoting } from '~/lib/stores/hooks'
import { waitForRenderReady } from '~/lib/utils'
import { resolveVisionView } from '~/lib/vision/parse'

interface AIVisionBlockProps {
  tweet: EnrichedTweet
  /**
   * 截图/纯展示场景：隐藏交互 chrome（仅译文开关、编辑弹窗入口、空态提示）。
   * 主页面截图由 isScreenshoting 触发；plain-tweet 截图路由显式传 true。
   */
  hideChrome?: boolean
}

/**
 * AI 视觉描述 —— 媒体区展示块（app/components/tweet/AIVisionBlock.tsx）
 *
 * 挂在 TweetNode 的 TweetMediaAlt 之后；plain-tweet 截图路由（hideChrome）也渲染。
 * 头栏「AI 图片描述」+「仅译文」开关（visionShowTranslatedOnly）+ 编辑弹窗入口；
 * 截图时（isScreenshoting / hideChrome）隐藏交互元素，只留描述内容。
 * 截图上下文挂载时调用 waitForRenderReady（AC-VISION-008 / AC-SHOT-003），
 * 等待字体/图片就绪，避免 headless 截图排版塌陷（Postmortem #008）。
 */
export function AIVisionBlock({ tweet, hideChrome = false }: AIVisionBlockProps) {
  const enableAIVision = useAppConfigStore(s => s.enableAIVision)
  const visionShowTranslatedOnly = useAppConfigStore(s => s.visionShowTranslatedOnly)
  const setVisionShowTranslatedOnly = useAppConfigStore(s => s.setVisionShowTranslatedOnly)
  const isScreenshoting = useScreenshoting()

  const photos = (tweet.mediaDetails ?? [])
    .map((m, i) => ({ m, i }))
    .filter(x => x.m.type === 'photo')
  const visionInfo = tweet.visionInfo ?? []
  const hasContent = visionInfo.some(v => v.status === 'done' || v.status === 'error')
  const chromeHidden = hideChrome || isScreenshoting

  useEffect(() => {
    if (chromeHidden && hasContent) {
      // 截图上下文：确保字体/图片解码完成再被截取
      void waitForRenderReady()
    }
  }, [chromeHidden, hasContent])

  if (photos.length === 0)
    return null
  // 截图/纯展示：只留内容，无内容则不渲染空块；交互模式跟随 enableAIVision 开关
  // （SSR 拿不到客户端开关，plain 路由依赖缓存里的 visionInfo 渲染）
  if (chromeHidden) {
    if (!hasContent)
      return null
  }
  else if (!enableAIVision) {
    return null
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border/10 px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <ImageIcon className="size-3" />
          AI 图片描述
        </span>
        {!chromeHidden && (
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
        )}
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
        : !chromeHidden && (
            <p className="px-3 py-2 text-[11px] text-muted-foreground/50">
              点击右上角图标为配图生成 AI 描述
            </p>
          )}
    </div>
  )
}
