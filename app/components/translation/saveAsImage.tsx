import axios from 'axios'
import { domToPng } from 'modern-screenshot'
// import { toast } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { toastManager } from '~/components/ui/toast'
import { useTranslationStore } from '~/lib/stores/translation'
import { flatTweets } from '~/lib/utils'

function toastAction() {
  const dontShowAgain = localStorage.getItem('dontShowAgain') === 'true'
  if (dontShowAgain) {
    return
  }
  const id = toastManager.add({
    actionProps: {
      children: '不再提醒',
      onClick: () => {
        toastManager.close(id)
        localStorage.setItem('dontShowAgain', 'true')
      },
    },
    description: '需要先登录才能保存翻译结果。',
    timeout: 1000000,
    title: '尚未登录',
    type: 'error',
  })
}

function saveAsImage(png: string, fileName: string) {
  const a = document.createElement('a')
  a.href = png
  a.download = `${fileName}.png`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function SaveAsImageButton() {
  const { tweetElRef, mainTweet, setShowTranslationButton, setScreenshoting, showTranslations, tweets } = useTranslationStore()

  async function submitTweet() {
    const flatedTweet = flatTweets(tweets)
    const data = flatedTweet.map((tweet) => {
      const entities = tweet.entities
        .filter(entity => entity.type === 'hashtag' || entity.type === 'text')
        .filter(entity => !!entity.translation?.trim())
      if (entities.length === 0)
        return null
      return {
        tweetId: tweet.id_str,
        entities,
      }
    })
      .filter(Boolean)

    if (data.length === 0)
      return

    await axios.post('/api/tweet/set', {
      data,
      intent: 'updateEntities',
    })
      .then(({ data }) => {
        if (data.success) {
          toastManager.add({
            title: '翻译结果已缓存',
            type: 'success',
          })
        }
        // else if (data.status === 401) {
        //   toastAction()
        // }
      })
      .catch((error) => {
        toastManager.add({
          title: '保存翻译结果失败',
          type: 'error',
        })
        console.error(error)
      })
  }

  async function onSaveAsImage() {
    if (!tweetElRef || !mainTweet) {
      console.log('tweetElRef or tweet is null', { tweetElRef, tweet: mainTweet })

      toastManager.add({
        title: '图片保存失败',
        type: 'error',
      })
      return
    }

    toastManager.add({
      title: '正在截图中……',
      type: 'info',
    })

    // const hasVideo = tweets.some(tweet => tweet.mediaDetails?.some(media => media.type === 'video'))
    // if (hasVideo) {
    setScreenshoting(true)
    // }
    setShowTranslationButton(false)

    await new Promise(resolve => requestAnimationFrame(resolve))

    const png = await domToPng(tweetElRef, {
      quality: 1,
      scale: 1.7,
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
      toastManager.add({
        title: '推文截图保存成功',
        type: 'success',
      })
    }
    else {
      console.log('png is null', { png, tweetElRef, mainTweet })
      toastManager.add({
        title: '图片保存失败',
        type: 'error',
      })
    }
    await submitTweet()
    // 恢复翻译按钮显示
    setScreenshoting(false)
    if (showTranslations) {
      setShowTranslationButton(true)
    }
  }

  return (
    <Button
      onClick={onSaveAsImage}
    >
      截图
    </Button>
  )
}
