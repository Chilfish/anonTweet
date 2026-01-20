import { cn } from '~/lib/utils'

interface ThreadLineProps {
  topOffset?: number
  bottomOffset?: number
  className?: string
  visible?: boolean
}

export function ThreadLine({ topOffset = 0, bottomOffset = 0, className, visible = true }: ThreadLineProps) {
  if (!visible)
    return null

  return (
    <div
      style={{
        height: `calc(100% - ${topOffset}px - ${bottomOffset}px - 1rem)`,
        top: `${topOffset + 16}px`, // 16px approximates the 'top-4'
      }}
      className={cn(
        'absolute z-0 left-[1.2rem] w-[2px] bg-[#cfd9de] dark:bg-[#333639]',
        className,
      )}
    />
  )
}
