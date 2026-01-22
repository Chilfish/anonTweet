import { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'

interface ThreadLineProps {
  topOffset?: number
  bottomOffset?: number
  className?: string
  visible?: boolean
}

export function ThreadLine({
  topOffset = 0,
  bottomOffset = 0,
  className,
  visible = true,
}: ThreadLineProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 确保在客户端且布局完成后才渲染
    setMounted(true)
  }, [])

  if (!visible || !mounted) {
    return null
  }

  return (
    <div
      style={{
        height: `calc(100% - ${topOffset}px - ${bottomOffset}px - 1rem)`,
        top: `${topOffset + 16}px`,
      }}
      className={cn(
        'absolute z-0 left-[1.2rem] w-[2px] bg-[#cfd9de] dark:bg-[#333639]',
        className,
      )}
    />
  )
}
