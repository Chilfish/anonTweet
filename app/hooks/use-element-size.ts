import type { RefObject } from 'react'
import { useLayoutEffect, useState } from 'react'

export function useElementSize<T extends HTMLElement = HTMLDivElement>(
  elementRef: RefObject<T | null> | T | null,
) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const element = (elementRef && typeof elementRef === 'object' && 'current' in elementRef)
      ? elementRef.current
      : elementRef

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
  }, [elementRef])

  return size
}
