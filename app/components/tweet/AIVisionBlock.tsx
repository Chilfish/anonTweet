import type { EnrichedTweet } from '~/types'
import { ImageIcon, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { AIVisionEditorDialog } from '~/components/translation/AIVisionEditorDialog'
import { Button } from '~/components/ui/button'
import { useVisionLogic } from '~/hooks/use-vision-logic'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useScreenshoting } from '~/lib/stores/hooks'
import { cn, waitForRenderReady } from '~/lib/utils'
import { resolveVisionView } from '~/lib/vision/parse'

interface AIVisionBlockProps {
  tweet: EnrichedTweet
  /**
   * 截图/纯展示场景：隐藏交互 chrome（仅译文 toggle、编辑入口、空态 CTA）。
   * 主页面截图由 isScreenshoting 触发；plain-tweet 截图路由显式传 true。
   */
  hideChrome?: boolean
}

/**
 * AI 视觉描述 —— 媒体区展示块（app/components/tweet/AIVisionBlock.tsx）
 *
 * 挂在 TweetNode 的 TweetMediaAlt 之后；plain-tweet 截图路由（hideChrome）也渲染。
 * 编辑弹窗状态（useVisionLogic）上提到这里持有——头栏编辑入口与空态 CTA 共用
 * 同一打开入口，弹窗自身不再自带 trigger。
 * 截图时（isScreenshoting / hideChrome）隐藏交互元素，只留描述内容；
 * 截图上下文挂载时调用 waitForRenderReady（AC-VISION-008 / AC-SHOT-003，
 * Postmortem #008 防 headless 截图排版塌陷）。
 */
export function AIVisionBlock({
  tweet,
  hideChrome = false,
}: AIVisionBlockProps) {
  const enableAIVision = useAppConfigStore(s => s.enableAIVision)
  const visionShowTranslatedOnly = useAppConfigStore(
    s => s.visionShowTranslatedOnly,
  )
  const setVisionShowTranslatedOnly = useAppConfigStore(
    s => s.setVisionShowTranslatedOnly,
  )
  const isScreenshoting = useScreenshoting()
  const editor = useVisionLogic(tweet)

  const photos = (tweet.mediaDetails ?? [])
    .map((m, i) => ({ m, i }))
    .filter(x => x.m.type === 'photo')
  const visionInfo = tweet.visionInfo ?? []
  const hasContent = visionInfo.some(
    v => v.status === 'done' || v.status === 'error',
  )
  const chromeHidden = hideChrome || isScreenshoting

  useEffect(() => {
    if (chromeHidden && hasContent) {
      // 截图上下文：确保字体/图片解码完成再被截取
      void waitForRenderReady()
    }
  }, [chromeHidden, hasContent])

  if (photos.length === 0)
    return null
  // 有已缓存结果（hasContent）时始终渲染，不依赖 enableAIVision 开关（数据有值即显示）；
  // 无结果时仅交互模式 + 开关开启才展示空态 CTA（生成入口）。
  // 截图/纯展示：只留内容，无内容则不渲染空块（SSR 拿不到客户端开关，
  // plain 路由依赖缓存里的 visionInfo 渲染）。
  if (chromeHidden) {
    if (!hasContent)
      return null
  }
  else if (!hasContent && !enableAIVision) {
    return null
  }

  return (
    <section className="mt-3 overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border/50 px-3.5 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <ImageIcon className="size-3.5" />
          图片描述
        </span>
        {!chromeHidden && (
          <div className="flex items-center gap-2">
            {hasContent && (
              <button
                type="button"
                aria-pressed={visionShowTranslatedOnly}
                onClick={() =>
                  setVisionShowTranslatedOnly(!visionShowTranslatedOnly)}
                className="text-xs font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                {visionShowTranslatedOnly ? '显示原文' : '仅译文'}
              </button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={editor.initializeEditor}
              className="hover:bg-background/50"
              title="生成 / 编辑图片描述"
            >
              <Sparkles className="size-3.5 text-muted-foreground/70" />
              <span className="sr-only">生成 / 编辑图片描述</span>
            </Button>
          </div>
        )}
      </header>

      {hasContent ? (
        <div className="divide-y divide-border/50">
          {photos.map(({ i }) => {
            const aiInfo = visionInfo.find(v => v.index === i)
            const view = resolveVisionView(aiInfo, {
              translatedOnly: visionShowTranslatedOnly,
            })
            if (!view.hasView && aiInfo?.status !== 'error')
              return null
            return (
              <div key={i} className="px-3.5 py-2.5">
                {aiInfo?.status === 'error' && (
                  <p className="text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap text-destructive">
                    {aiInfo.error}
                  </p>
                )}
                {view.originalText
                  && view.displayText !== view.originalText && (
                  <p className="text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-muted-foreground/80">
                    {view.originalText}
                  </p>
                )}
                {view.displayText && (
                  <p
                    className={cn(
                      'text-[13px] leading-relaxed wrap-break-word whitespace-pre-wrap',
                      view.originalText
                      && view.displayText !== view.originalText
                      && 'mt-1 font-medium',
                    )}
                  >
                    {view.displayText}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        !chromeHidden && (
          <button
            type="button"
            onClick={editor.initializeEditor}
            className="flex w-full items-center justify-center gap-1.5 px-3.5 py-3 text-[13px] text-muted-foreground/70 transition-colors hover:bg-background/40 hover:text-foreground"
          >
            <Sparkles className="size-3.5" />
            为配图生成 AI 描述
          </button>
        )
      )}

      <AIVisionEditorDialog editor={editor} />
    </section>
  )
}
