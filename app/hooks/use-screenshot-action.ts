import { domToJpeg, domToPng } from 'modern-screenshot'
import { useCallback, useState } from 'react'
import { toastManager } from '~/components/ui/toast'
import { syncTranslationData } from '~/lib/service/translationSync'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import {
  useGlobalTranslationMode,
  useMainTweet,
  useTranslationUIActions,
  useUIState,
} from '~/lib/stores/hooks'
import { useTranslationUIStore } from '~/lib/stores/translationUI'

interface UseScreenshotActionProps {
  tweets: any[] // 根据实际类型定义
}

export function useScreenshotAction({ tweets }: UseScreenshotActionProps) {
  const [isCapturing, setIsCapturing] = useState(false)

  const { tweetElRef, selectedTweetIds } = useUIState()
  const mainTweet = useMainTweet()
  const { translationMode } = useGlobalTranslationMode()
  const {
    setScreenshoting,
    setShowTranslationButton,
    setIsCapturingSelected,
    toggleSelectionMode,
  } = useTranslationUIActions()

  const { screenshotFormat } = useAppConfigStore()

  // 私有：执行截图的底层逻辑
  const performCapture = useCallback(async (node: HTMLElement) => {
    const filter = (n: Node) => {
      if (n instanceof Element && n.hasAttribute('data-ignore-screenshot'))
        return false
      return true
    }

    const options = {
      quality: 1,
      filter,
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

  // 公开：主流程
  const handleScreenshot = useCallback(async (useSelection = false) => {
    if (!tweetElRef || !mainTweet) {
      toastManager.add({ title: '初始化失败：未找到推文节点', type: 'error' })
      return
    }

    if (useSelection && selectedTweetIds.length === 0) {
      toastManager.add({ title: '请至少选择一条推文', type: 'warning' })
      return
    }

    setIsCapturing(true)
    toastManager.add({ title: '正在截图中……', type: 'info' })

    // 1. 准备环境 (Setup)
    setScreenshoting(true)
    setShowTranslationButton(false)

    if (useSelection) {
      setIsCapturingSelected(true)
      // 临时 hack: 直接操作 store 关闭选择模式以隐藏 checkbox，但保留 selectedIds
      useTranslationUIStore.setState({ isSelectionMode: false })
    }

    // 等待 DOM 更新 (React Render + Layout paint)
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      // 2. 执行截图 (Action)
      const dataUrl = await performCapture(tweetElRef)

      if (dataUrl) {
        const now = new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }).replace(/[/\s:]/g, '-') // 稍微清洗下文件名

        const ext = screenshotFormat === 'png' ? 'png' : 'jpg'
        const fileName = `${mainTweet.user.screen_name}-${mainTweet.id_str}-${now}.${ext}`

        downloadImage(dataUrl, fileName)
        toastManager.add({ title: '截图保存成功', type: 'success' })

        // 副作用：同步数据
        await syncTranslationData(tweets)
      }
      else {
        throw new Error('生成的图片数据为空')
      }
    }
    catch (error) {
      console.error('Screenshot failed:', error)
      toastManager.add({ title: '图片保存失败', type: 'error' })
    }
    finally {
      // 3. 恢复环境 (Teardown)
      setScreenshoting(false)
      if (translationMode !== 'original') {
        setShowTranslationButton(true)
      }

      if (useSelection) {
        setIsCapturingSelected(false)
        // 彻底退出选择模式
        toggleSelectionMode(false)
      }
      setIsCapturing(false)
    }
  }, [tweetElRef, mainTweet, selectedTweetIds, performCapture, screenshotFormat, tweets, setScreenshoting, setShowTranslationButton, setIsCapturingSelected, translationMode, toggleSelectionMode])

  return {
    handleScreenshot,
    isCapturing,
  }
}
