import type { Options as ScreenshotOptions } from 'modern-screenshot'
import type { IGPost } from '~/types'
import { domToJpeg, domToPng } from 'modern-screenshot'
import { useCallback, useRef, useState } from 'react'
import { toastManager } from '~/components/ui/toast'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { waitForRenderReady } from '~/lib/utils'

interface UseIGScreenshotActionProps {
  post: IGPost | null
}

/**
 * Instagram 帖子的截图 hook。
 *
 * 复用 modern-screenshot 管线，与 Twitter 的 useScreenshotAction 模式一致。
 */
export function useIGScreenshotAction({ post }: UseIGScreenshotActionProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { screenshotFormat } = useAppConfigStore()

  const performCapture = useCallback(async (node: HTMLElement) => {
    const filter = (n: Node) => {
      if (n instanceof Element && n.hasAttribute('data-ignore-screenshot'))
        return false
      return true
    }

    const options: ScreenshotOptions = {
      quality: 1,
      filter,
      font: {
        preferredFormat: 'woff2',
        cssText: `
        p {
          font-family:
            'Inter',
            "Apple Color Emoji",
            "Segoe UI Emoji",
            "Noto Color Emoji",
            "Segoe UI Symbol",
            'UnifontEX',
            'Noto Sans JP',
            sans-serif;
        }
        `,
      },
    }

    return screenshotFormat === 'png'
      ? domToPng(node, { ...options, scale: 1.7 })
      : domToJpeg(node, { ...options, scale: 2, backgroundColor: '#ffffff' })
  }, [screenshotFormat])

  const handleScreenshot = useCallback(async () => {
    if (!containerRef.current || !post) {
      toastManager.add({ title: '截图失败：未找到 IG 帖子节点', type: 'error' })
      return
    }

    setIsCapturing(true)
    toastManager.add({ title: '正在截图中……', type: 'info' })

    await waitForRenderReady(containerRef.current)

    try {
      const dataUrl = await performCapture(containerRef.current)

      if (dataUrl) {
        const now = new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/[/\s:]/g, '-')
        const ext = screenshotFormat === 'png' ? 'png' : 'jpg'
        const fileName = `ig-${post.username}-${post.id}-${now}.${ext}`

        const a = document.createElement('a')
        a.href = dataUrl
        a.download = fileName
        a.click()

        toastManager.add({ title: '截图保存成功', type: 'success' })
      }
      else {
        throw new Error('生成的图片数据为空')
      }
    }
    catch (error) {
      console.error('[IG] Screenshot failed:', error)
      toastManager.add({ title: '图片保存失败', type: 'error' })
    }
    finally {
      setIsCapturing(false)
    }
  }, [post, performCapture, screenshotFormat])

  return {
    containerRef,
    handleScreenshot,
    isCapturing,
  }
}
