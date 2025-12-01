import axios from 'axios'
import { LoaderIcon, SaveIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { toastManager } from '~/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useTranslationStore } from '~/lib/stores/translation'
import { flatTweets, toast } from '~/lib/utils'

export default function UpdateTranslation() {
  const { tweets, translations } = useTranslationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitTweet() {
    setIsSubmitting(true)
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

    await axios.post('/api/tweet/set', {
      data,
      intent: 'updateEntities',
    })
      .then(({ data }) => {
        if (data.success) {
          toast.success('翻译结果已保存')
        }
        else if (data.status === 401) {
          const id = toastManager.add({
            actionProps: {
              children: '不再提醒',
              onClick: () => {
                toastManager.close(id)
                console.log(id)
              },
            },
            description: '需要先登录才能保存翻译结果。',
            timeout: 1000000,
            title: '尚未登录',
            type: 'error',
          })

          console.log(id)
        }
      })
      .catch((error) => {
        toast.error('保存翻译结果失败')
        console.error(error)
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <Button
            onClick={submitTweet}
            size="icon"
            variant="ghost"
            disabled={isSubmitting || !!translations.length}
          />
        )}
      >

        {isSubmitting
          ? <LoaderIcon className="animate-spin" />
          : <SaveIcon />}
      </TooltipTrigger>
      <TooltipContent>
        <p>保存翻译结果</p>
      </TooltipContent>
    </Tooltip>
  )
}
