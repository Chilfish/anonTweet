import type { useVisionLogic } from '~/hooks/use-vision-logic'
import type { VisionMode } from '~/types/vision'
import { ImageIcon, Languages, Loader2, Save, Sparkles } from 'lucide-react'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from '~/components/ui/dialog'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group'

const MODE_OPTIONS: Array<{ label: string, value: VisionMode }> = [
  { label: '看图说话', value: 'describe' },
  { label: 'OCR 识别', value: 'ocr' },
  { label: '自定义', value: 'custom' },
]

/**
 * 无底色 textarea（对齐 AltEntityList 既有范式）：textarea 融入卡片本身，
 * 避免「卡片套输入框」的多层背景叠层。min-h/padding 用 [&_textarea:] 落到内层
 * 才生效（外层 span 无样式）；文本贴左与「图 N」label 对齐。
 */
const EDITOR_TEXTAREA = [
  'min-h-14 resize-none border-none bg-transparent p-0 text-sm leading-relaxed shadow-none',
  'focus-visible:ring-0 [&_textarea]:min-h-14 [&_textarea]:p-0',
].join(' ')

/**
 * AI 视觉描述 —— 编辑弹窗（app/components/translation/AIVisionEditorDialog.tsx）
 *
 * 模式用分段控件（iOS 风格，裸露在标题下，不装进卡片）；编辑区是单张
 * `bg-card` 卡片，textarea 无底色融入卡片、hairline 分隔，custom 提示词与
 * 逐图编辑同卡片。逐图编辑：ocr「原文 + 译文」、describe/custom「描述」，
 * 均可手动修正。翻译走独立步（AI 翻译 → 翻译模型 + 推文上下文）。
 * 编辑器状态由 useVisionLogic 提供（AIVisionBlock 持有，空态 CTA 与头栏入口共用）。
 */
export function AIVisionEditorDialog({ editor }: { editor: ReturnType<typeof useVisionLogic> }) {
  const hasOcr = editor.mode === 'ocr' || editor.visionInfo.some(v => v.mode === 'ocr')

  return (
    <Dialog open={editor.isOpen} onOpenChange={editor.setIsOpen} dismissible={false}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="size-5" />
            图片描述
          </DialogTitle>
        </DialogHeader>

        <DialogPanel className="space-y-4">
          {/* 模式分段控件（裸露，iOS 风格） */}
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[editor.mode]}
            onValueChange={value => value.length > 0 && editor.setMode(value[0] as VisionMode)}
          >
            {MODE_OPTIONS.map(opt => (
              <ToggleGroupItem key={opt.value} value={opt.value}>
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {/* 编辑区（单张卡片：custom 提示词 + 逐图 + 附上下文开关） */}
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="divide-y divide-border/50">
              {editor.mode === 'custom' && (
                <div className="px-4 py-3">
                  <div className="pb-1 text-xs text-muted-foreground">提示词</div>
                  <Textarea
                    value={editor.customPrompt}
                    onChange={e => editor.setCustomPrompt(e.target.value)}
                    placeholder="自定义描述提示词…"
                    className={EDITOR_TEXTAREA}
                  />
                </div>
              )}

              {editor.photoIndexes.map((i) => {
                const aiInfo = editor.visionInfo.find(v => v.index === i)
                const entryMode = aiInfo?.mode ?? editor.mode
                const isOcr = entryMode === 'ocr'
                return (
                  <div key={i} className="px-4 py-3">
                    {aiInfo?.status === 'error' && (
                      <p className="pb-2 text-xs break-words text-destructive">{aiInfo.error}</p>
                    )}

                    <div className="pb-1 text-xs text-muted-foreground">
                      图
                      {i + 1}
                    </div>

                    <Textarea
                      value={isOcr
                        ? editor.drafts[i]?.originalText ?? ''
                        : editor.drafts[i]?.description ?? ''}
                      onChange={e => isOcr
                        ? editor.updateDraft(i, { originalText: e.target.value })
                        : editor.updateDraft(i, { description: e.target.value })}
                      placeholder={isOcr ? 'OCR 识别文字，可手动修正…' : '图片描述，可手动修改…'}
                      className={EDITOR_TEXTAREA}
                    />

                    {isOcr && (
                      <div className="-mx-4 mt-2 border-t border-border/50 px-4 pt-2">
                        <div className="pb-1 text-xs text-muted-foreground">译文</div>
                        <Textarea
                          value={editor.drafts[i]?.translatedText ?? ''}
                          onChange={e => editor.updateDraft(i, { translatedText: e.target.value })}
                          placeholder={aiInfo ? '手动输入翻译（优先于 AI 结果）…' : '翻译由「AI 翻译」生成，或手动输入…'}
                          className={EDITOR_TEXTAREA}
                        />
                      </div>
                    )}
                  </div>
                )
              })}

              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 px-4">
                <span className="text-sm text-muted-foreground">附推文上下文</span>
                <Switch checked={editor.withContext} onCheckedChange={editor.setWithContext} />
              </label>
            </div>
          </div>
        </DialogPanel>

        <DialogFooter className="flex-row items-center justify-end gap-2">
          {hasOcr && (
            <Button
              variant="outline"
              size="sm"
              onClick={editor.translateOcr}
              disabled={editor.isTranslating}
              className="text-muted-foreground hover:text-foreground"
            >
              {editor.isTranslating
                ? <Loader2 className="size-3.5 animate-spin" />
                : <Languages className="size-3.5" />}
              <span className="hidden sm:inline-block">
                翻译
              </span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={editor.generate}
            disabled={editor.isGenerating}
            className="text-muted-foreground hover:text-foreground"
          >
            {editor.isGenerating
              ? <Loader2 className="size-3.5 animate-spin" />
              : <Sparkles className="size-3.5" />}
            <span className="hidden sm:inline-block">
              生成
            </span>
          </Button>
          <Button
            size="sm"
            onClick={editor.save}
          >
            <Save className="size-4" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
