import type { RefObject } from 'react'
import { useLayoutEffect, useState } from 'react'

export function useElementSize<T extends HTMLElement = HTMLDivElement>(
  elementRef: RefObject<T | null>,
) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const element = elementRef.current
    if (!element)
      return

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0)
        return
      const { width, height } = entries[0]?.contentRect || { width: 0, height: 0 }
      setSize({ width, height })
    })

    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [elementRef]) // 依赖 ref 对象本身

  return size
}
