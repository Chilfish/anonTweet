import { domToPng } from 'modern-screenshot'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { useTranslationStore } from '~/lib/stores/translation'

function saveAsImage(png: string, fileName: string) {
  const a = document.createElement('a')
  a.href = png
  a.download = `${fileName}.png`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function SaveAsImageButton() {
  const { tweetElRef, mainTweet, setShowTranslationButton, setScreenshoting, showTranslations } = useTranslationStore()

  async function onSaveAsImage() {
    if (!tweetElRef || !mainTweet) {
      console.log('tweetElRef or tweet is null', { tweetElRef, tweet: mainTweet })
      toast.error('图片保存失败', {
        description: '请检查Tweet是否存在',
      })
      return
    }

    toast.info('正在截图中……')

    setShowTranslationButton(false)
    setScreenshoting(true)

    await new Promise(resolve => requestAnimationFrame(resolve))

    const png = await domToPng(tweetElRef, {
      quality: 1,
      scale: 2,
    })
    if (png) {
      const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      const fileName = `${mainTweet.user.screen_name}-${mainTweet.id_str}-${now}`
      saveAsImage(png, fileName)
      toast.success('图片保存成功')
    }
    else {
      console.log('png is null', { png, tweetElRef, mainTweet })
      toast.error('图片保存失败', {
        description: '请检查Tweet是否存在',
      })
    }
    // 恢复翻译按钮显示
    setScreenshoting(false)
    if (showTranslations) {
      setShowTranslationButton(true)
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={onSaveAsImage}
    >
      导出为图片
    </Button>
  )
}
