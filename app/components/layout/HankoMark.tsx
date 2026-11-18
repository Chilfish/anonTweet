import { cn } from '~/lib/utils'

/**
 * 朱印（はんこ）：品牌印记，唯一允许的暖色装饰。
 * 纯 CSS 绘制，不加载图片；不承载语义，读屏跳过。
 */
export function HankoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-6 shrink-0 -rotate-6 items-center justify-center rounded-[3px] border-[1.5px] border-(--seal) text-[11px] font-semibold leading-none text-(--seal) select-none',
        className,
      )}
    >
      あ
    </span>
  )
}
