import { Filter, FilterX } from 'lucide-react'
import { Toggle } from '~/components/ui/toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { useCommentsCount, useTranslationActions, useTranslationSettings } from '~/lib/stores/hooks'
import { cn } from '~/lib/utils'

export function FilterUnrelatedToggle() {
  const { filterUnrelated } = useTranslationSettings()
  const { updateSettings } = useTranslationActions()
  const commentsCount = useCommentsCount()

  // 只有在加载出评论（commentsCount > 0）时才显示此开关
  if (commentsCount === 0) {
    return null
  }

  const handlePressedChange = (pressed: boolean) => {
    updateSettings({ filterUnrelated: pressed })
  }

  return (
    <Tooltip>
      <TooltipTrigger render={(
        <Toggle
          variant="outline"
          pressed={filterUnrelated}
          onPressedChange={handlePressedChange}
          className={cn(
            'gap-1.5 transition-all duration-200 border-dashed sm:border-solid',
            filterUnrelated
              ? 'text-primary border-primary/50 bg-primary/10 hover:bg-primary/20 hover:text-primary'
              : 'text-muted-foreground border-muted-foreground/30 hover:border-muted-foreground/60',
          )}
        >
          {filterUnrelated ? (
            <Filter className="size-4 animate-in zoom-in-50 duration-300" />
          ) : (
            <FilterX className="size-4 animate-in zoom-in-50 duration-300" />
          )}
          <span className="hidden sm:inline">
            {filterUnrelated ? '仅相关性' : '全部评论'}
          </span>
        </Toggle>
      )}
      />
      <TooltipContent side="bottom">
        <div className="flex flex-col gap-1">
          <p className="font-bold">{filterUnrelated ? '当前：仅相关性' : '当前：显示全部'}</p>
          <p className="opacity-80">
            {filterUnrelated ? '只显示与博主互动的评论' : '按热度排序显示全量评论'}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
