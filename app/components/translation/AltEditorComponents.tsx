import type { Entity } from '~/types'
import React from 'react'
import { SettingsGroup } from '~/components/settings/SettingsUI'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface AltEntityListProps {
  entities: Entity[]
  onUpdate: (index: number, value: string) => void
}

export const AltEntityList: React.FC<AltEntityListProps> = ({ entities, onUpdate }) => {
  const altEntities = entities.filter(e => e.type === 'media_alt')

  if (altEntities.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground text-center">暂无图片描述可供翻译</div>
  }

  return (
    <SettingsGroup>
      {altEntities.map((entity) => {
        // 计算图片序号，通常 index 大于 20000 用于媒体
        // 保持原逻辑的视觉提示
        const imgNumber = entity.index > 20000 ? entity.index - 20000 + 1 : '1'

        return (
          <div key={entity.index} className="flex flex-col border-b last:border-0 bg-card">
            {/* 标题头 */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border/40">
              <Label className="text-[10px] uppercase font-mono text-muted-foreground flex items-center gap-2">
                ALT TEXT
                <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                  图
                  {' '}
                  {imgNumber}
                </span>
              </Label>
            </div>

            {/* 原文展示区 */}
            <div className="p-3 bg-muted/10 border-b-2">
              <p className="tweet-body text-xs">
                {entity.text}
              </p>
            </div>

            {/* 编辑区 */}
            <Textarea
              value={entity.translation || ''}
              onChange={e => onUpdate(entity.index, e.target.value)}
              className="min-h-16 border-none shadow-none rounded-none bg-transparent resize-none text-sm leading-relaxed focus-visible:ring-0"
              placeholder="输入图片描述翻译..."
            />
          </div>
        )
      })}
    </SettingsGroup>
  )
}
