import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

export function useElementSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref?.current)
      return

    const element = ref.current
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(element)

    // 延迟到下一帧读取，避免在 effect 中触发强制同步布局
    // ResizeObserver 回调会在此帧布局完成后异步触发
    const raf = requestAnimationFrame(() => {
      // 如果 ResizeObserver 尚未触发，则手动读取一次
      // 由于在 rAF 内，此次读取不会造成额外的布局抖动
      if (element.isConnected) {
        setSize({
          width: element.offsetWidth,
          height: element.offsetHeight,
        })
      }
    })

    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [ref])

  return size
}
