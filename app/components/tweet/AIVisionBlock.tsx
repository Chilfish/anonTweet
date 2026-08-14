import type { EnrichedTweet } from '~/types'
import { ChevronDown, ImageIcon, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { AIVisionEditorDialog } from '~/components/translation/AIVisionEditorDialog'
import { Button } from '~/components/ui/button'
import { useVisionLogic } from '~/hooks/use-vision-logic'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import {
  useScreenshoting,
  useTranslationActions,
  useVisionVisibility,
} from '~/lib/stores/hooks'
import { cn, waitForRenderReady } from '~/lib/utils'
import { resolveVisionBlockState, resolveVisionView } from '~/lib/vision/parse'

interface AIVisionBlockProps {
  tweet: EnrichedTweet
  /**
   * 截图/纯展示场景：隐藏交互 chrome（仅译文 toggle、隐藏入口、编辑入口、空态 CTA）。
   * 主页面截图由 isScreenshoting 触发；plain-tweet 截图路由显式传 true。
   */
  hideChrome?: boolean
  /**
   * 外部持有的编辑器状态（TweetNode 上提 useVisionLogic）：翻译按钮旁的图片描述
   * 入口与块内入口共用同一弹窗。缺省时组件自持一份。
   */
  editor?: ReturnType<typeof useVisionLogic>
}

/**
 * AI 视觉描述 —— 媒体区展示块（app/components/tweet/AIVisionBlock.tsx）
 *
 * 挂在 TweetNode 的 TweetMediaAlt 之后；plain-tweet 截图路由（hideChrome）也渲染。
 * 可见性走 resolveVisionBlockState 纯函数（AC-VISION-010）：
 * - 缓存内容默认跟随全局 enableAIVision 开关；逐推文覆盖（visionVisibility）优先
 * - 全局关 + 有内容：交互模式折叠成「图片描述」细条（点按展开），截图完全隐藏
 * - 头栏「隐藏」= 本次不展示描述（截图不再包含）
 * 编辑弹窗状态（useVisionLogic）上提到这里持有——头栏编辑入口与空态 CTA 共用
 * 同一打开入口，弹窗自身不再自带 trigger（TweetNode 可上提复用）。
 * 截图时（isScreenshoting / hideChrome）隐藏交互元素，只留描述内容；
 * 截图上下文挂载时调用 waitForRenderReady（AC-VISION-008 / AC-SHOT-003，
 * Postmortem #008 防 headless 截图排版塌陷）。
 */
export function AIVisionBlock({
  tweet,
  hideChrome = false,
  editor: externalEditor,
}: AIVisionBlockProps) {
  const enableAIVision = useAppConfigStore(s => s.enableAIVision)
  const visionShowTranslatedOnly = useAppConfigStore(
    s => s.visionShowTranslatedOnly,
  )
  const setVisionShowTranslatedOnly = useAppConfigStore(
    s => s.setVisionShowTranslatedOnly,
  )
  const isScreenshoting = useScreenshoting()
  const visionOverride = useVisionVisibility(tweet.id_str)
  const { setVisionVisibility } = useTranslationActions()
  const internalEditor = useVisionLogic(tweet)
  const editor = externalEditor ?? internalEditor

  const photos = (tweet.mediaDetails ?? [])
    .map((m, i) => ({ m, i }))
    .filter(x => x.m.type === 'photo')
  const visionInfo = tweet.visionInfo ?? []
  const hasContent = visionInfo.some(
    v => v.status === 'done' || v.status === 'error',
  )
  const chromeHidden = hideChrome || isScreenshoting

  const state = resolveVisionBlockState({
    hasContent,
    enableAIVision,
    override: visionOverride,
    chromeHidden,
  })

  useEffect(() => {
    if (chromeHidden && state === 'content') {
      // 截图上下文：确保字体/图片解码完成再被截取
      void waitForRenderReady()
    }
  }, [chromeHidden, state])

  if (photos.length === 0)
    return null

  return (
    <>
      {/* 折叠态（全局关 + 有缓存内容 + 交互模式）：一条细条作为渐进披露入口，点按展开 */}
      {state === 'collapsed' && (
        <button
          type="button"
          onClick={() => setVisionVisibility(tweet.id_str, true)}
          title="展开图片描述"
          className="mt-3 flex w-full items-center gap-1.5 rounded-xl border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-background/40 hover:text-foreground"
        >
          <ImageIcon className="size-3.5" />
          图片描述
          <ChevronDown className="ml-auto size-3.5" />
        </button>
      )}

      {/* 内容 / 空态 CTA：state==='content'（有内容且展示）或 state==='cta'（无内容但全局开） */}
      {(state === 'content' || state === 'cta') && (
        <section className="mt-3 overflow-hidden rounded-xl border bg-card">
          {hasContent && (
            <header className="flex items-center justify-between gap-2 border-b border-border/50 px-3.5 py-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ImageIcon className="size-3.5" />
                图片描述
              </span>
              {!chromeHidden && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={visionShowTranslatedOnly}
                    onClick={() =>
                      setVisionShowTranslatedOnly(!visionShowTranslatedOnly)}
                    className="text-xs font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    {visionShowTranslatedOnly ? '显示原文' : '仅译文'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisionVisibility(tweet.id_str, false)}
                    title="本次隐藏图片描述"
                    className="text-xs font-medium text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    隐藏
                  </button>
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
          )}

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
        </section>
      )}

      {/* 编辑器弹窗常驻挂载：折叠/隐藏态也由翻译按钮旁的入口打开（AC-VISION-010） */}
      <AIVisionEditorDialog editor={editor} />
    </>
  )
}
