import type { EnrichedTweet, Entity } from '~/types'
import React from 'react'
import { SettingsGroup, SettingsRow } from '~/components/settings/SettingsUI'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'

// 辅助函数保持在模块作用域
function shouldSkipEntity(entity: Entity, originalTweet?: EnrichedTweet) {
  if (['mention', 'media', 'url', 'separator', 'media_alt'].includes(entity.type))
    return true
  if (entity.type === 'text') {
    // 只有当原文也是空白时才跳过，防止用户清空翻译后无法找回
    const originalText = originalTweet?.entities?.[entity.index]?.text
    return originalText ? !originalText.trim() : true
  }
  return false
}

export const PrependSection: React.FC<{
  enabled: boolean
  setEnabled: (v: boolean) => void
  text: string
  setText: (v: string) => void
}> = ({ enabled, setEnabled, text, setText }) => (
  <div className="space-y-2">
    <Label className="px-1 text-xs font-medium text-muted-foreground">句首补充</Label>
    <SettingsGroup>
      <SettingsRow>
        <div className="flex flex-col gap-0.5">
          <Label className="text-sm font-medium">启用句首补充</Label>
          <span className="text-xs text-muted-foreground">用于调整语序或补充上下文</span>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </SettingsRow>
      {enabled && (
        <div className="border-t bg-card animate-in fade-in slide-in-from-top-1 duration-200">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="输入句首补充内容..."
            className="min-h-12 border-none shadow-none rounded-none bg-transparent resize-none text-sm"
          />
        </div>
      )}
    </SettingsGroup>
  </div>
)

export const EntityList: React.FC<{
  entities: Entity[]
  originalTweet: EnrichedTweet
  onUpdate: (index: number, value: string) => void
}> = ({ entities, originalTweet, onUpdate }) => {
  return (
    <div className="space-y-2">
      <Label className="px-1 text-xs font-medium text-muted-foreground">译文编辑</Label>
      <SettingsGroup>
        {entities.map((entity) => {
          if (shouldSkipEntity(entity, originalTweet))
            return null

          const isText = entity.type === 'text'
          const displayValue = entity.translation || entity.text || ''

          return (
            <div key={entity.index} className="flex flex-col border-b last:border-0 bg-card">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/40">
                <Label className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-2">
                  {entity.type}
                </Label>
              </div>
              {isText ? (
                <Textarea
                  value={displayValue}
                  onChange={e => onUpdate(entity.index, e.target.value)}
                  className="min-h-8 border-none shadow-none rounded-none bg-transparent resize-none text-sm leading-relaxed"
                />
              ) : (
                <div className="p-2">
                  <Input
                    value={displayValue}
                    onChange={e => onUpdate(entity.index, e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 bg-muted/30 h-9"
                  />
                </div>
              )}
            </div>
          )
        })}
      </SettingsGroup>
    </div>
  )
}
