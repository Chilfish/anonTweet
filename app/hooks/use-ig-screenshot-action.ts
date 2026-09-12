import type { Options as ScreenshotOptions } from 'modern-screenshot'
import type { RefObject } from 'react'
import type { IGPost } from '~/types'
import { domToJpeg, domToPng } from 'modern-screenshot'
import { useCallback, useRef, useState } from 'react'
import { toastManager } from '~/components/ui/toast'
import { dataUrlToFile, shareImageOut } from '~/lib/share'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { waitForRenderReady } from '~/lib/utils'

interface UseIGScreenshotActionProps {
  post: IGPost | null
  /**
   * 捕获节点覆写：列表/多卡场景传列表容器（导出整列）。
   * 不传则用内部 `containerRef`（单卡，绑在 `InstagramPostCard` 上）。
   */
  captureRef?: RefObject<HTMLDivElement | null>
}

/**
 * Instagram 帖子的截图 hook。
 *
 * 复用 modern-screenshot 管线，与 Twitter 的 useScreenshotAction 模式一致。
 */
export function useIGScreenshotAction({ post, captureRef }: UseIGScreenshotActionProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { screenshotFormat } = useAppConfigStore()

  const resolveNode = useCallback(
    () => captureRef?.current ?? containerRef.current,
    [captureRef],
  )

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

  // 私有：下载文件
  const downloadImage = (dataUrl: string, filename: string) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    a.click()
  }

  // 公开：主流程（mode='share' 走 AC-PWA-007，系统分享卡片图片，不支持则回退下载）
  const runCapture = useCallback(async (mode: 'download' | 'share') => {
    const node = resolveNode()

    if (!node || !post) {
      toastManager.add({ title: '截图失败：未找到 IG 帖子节点', type: 'error' })
      return
    }

    setIsCapturing(true)
    toastManager.add({ title: '正在截图中……', type: 'info' })

    await waitForRenderReady(node)

    try {
      const dataUrl = await performCapture(node)

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

        if (mode === 'share') {
          // AC-PWA-007：优先系统分享图片，不支持/失败回退下载；shared/aborted 静默收尾
          const outcome = await shareImageOut(
            dataUrlToFile(dataUrl, fileName),
            `${post.fullname || `@${post.username}`} (@${post.username}) 的帖子卡片`,
          )
          if (outcome === 'unsupported') {
            downloadImage(dataUrl, fileName)
            toastManager.add({ title: '已保存图片（当前环境不支持直接分享图片）', type: 'success' })
          }
          else if (outcome === 'failed') {
            toastManager.add({ title: '图片分享失败', type: 'error' })
          }
        }
        else {
          downloadImage(dataUrl, fileName)
          toastManager.add({ title: '截图保存成功', type: 'success' })
        }
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
  }, [post, performCapture, resolveNode, screenshotFormat])

  /** 截图后下载保存（默认行为）。 */
  const handleScreenshot = useCallback(() => runCapture('download'), [runCapture])

  /** AC-PWA-007：截图后系统分享卡片图片（不支持则回退下载）。 */
  const shareScreenshot = useCallback(() => runCapture('share'), [runCapture])

  return {
    containerRef,
    handleScreenshot,
    shareScreenshot,
    isCapturing,
  }
}
