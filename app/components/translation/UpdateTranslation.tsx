import axios from 'axios'
import { LoaderIcon, SaveIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useTranslationStore } from '~/lib/stores/translation'
import { flatTweets } from '~/lib/utils'

export default function UpdateTranslation() {
  const { tweets, translations } = useTranslationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submitTweet() {
    setIsSubmitting(true)
    const flatedTweet = flatTweets(tweets)
    await axios.postForm('/api/tweet/set', {
      tweet: JSON.stringify(flatedTweet),
      intent: 'update',
    })
    setIsSubmitting(false)
    toast.success('翻译结果已保存')
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
