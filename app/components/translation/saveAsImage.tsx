import type { ComponentProps } from 'react'
import axios from 'axios'
import { domToJpeg, domToPng } from 'modern-screenshot'
import { Button } from '~/components/ui/button'
import { toastManager } from '~/components/ui/toast'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'
import { flatTweets } from '~/lib/utils'

function saveAsImage(dataUrl: string, fileName: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  a.click()
}

export function SaveAsImageButton(props: ComponentProps<typeof Button>) {
  const { tweetElRef, mainTweet, setShowTranslationButton, setScreenshoting, showTranslations, tweets } = useTranslationStore()
  const { screenshotFormat } = useAppConfigStore()

  async function submitTweet() {
    const flatedTweet = flatTweets(tweets)
    const data = flatedTweet.map((tweet) => {
      const entities = tweet.entities
        .filter(entity => entity.type === 'hashtag' || entity.type === 'text' || entity.type === 'media_alt')
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

    await new Promise(resolve => setTimeout(resolve, 300))

    const dataUrl = await (screenshotFormat === 'png'
      ? domToPng(tweetElRef, {
          quality: 1,
          scale: 1.7,
        })
      : domToJpeg(tweetElRef, {
          quality: 1,
          scale: 2,
          backgroundColor: '#ffffff',
        }))

    if (dataUrl) {
      const now = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      const fileName = `${mainTweet.user.screen_name}-${mainTweet.id_str}-${now}.${screenshotFormat === 'png' ? 'png' : 'jpg'}`
      saveAsImage(dataUrl, fileName)
      toastManager.add({
        title: '推文截图保存成功',
        type: 'success',
      })
    }
    else {
      console.log('dataUrl is null', { dataUrl, tweetElRef, mainTweet })
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
      {...props}
      onClick={onSaveAsImage}
    >
      {props.children ?? '截图'}
    </Button>
  )
}
