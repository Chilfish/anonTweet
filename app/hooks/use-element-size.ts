// hooks/use-element-size.ts
import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref?.current)
      return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(ref.current)

    // 初始测量
    const { offsetWidth, offsetHeight } = ref.current
    setSize({ width: offsetWidth, height: offsetHeight })

    return () => observer.disconnect()
  }, [ref])

  return size
}
