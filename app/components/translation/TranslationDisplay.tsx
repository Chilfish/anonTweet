import type { EnrichedTweet } from '~/types'
import React from 'react'
import { TweetBody } from '~/lib/react-tweet/twitter-theme/tweet-body'
import { useAppConfigStore } from '~/lib/stores/appConfig'
import { useTranslationStore } from '~/lib/stores/translation'

interface TranslationDisplayProps {
  tweetId: string
  originalTweet: EnrichedTweet
}

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  tweetId,
  originalTweet,
}) => {
  const { settings, showTranslations, getTranslation } = useTranslationStore()
  const { enableAITranslation } = useAppConfigStore()
  const { autoTranslationEntities } = originalTweet

  // getTranslation 返回值含义：
  // - Entity[]: 存在人工编辑的翻译
  // - null: 用户显式隐藏/删除了翻译
  // - undefined: 无人工记录
  const manualTranslation = getTranslation(tweetId)

  // 1. 全局开关检查
  if (!showTranslations) {
    return null
  }

  // 2. 显式隐藏检查：如果用户删除了翻译，则不再显示（即使有 AI 翻译也不显示）
  if (manualTranslation === null) {
    return null
  }

  // 3. 确定显示内容：人工翻译 > AI 翻译
  let contentToShow = manualTranslation

  if (!contentToShow) {
    // 如果没有人工翻译，检查是否启用并存在 AI 翻译
    if (enableAITranslation && autoTranslationEntities?.length) {
      contentToShow = autoTranslationEntities
    }
  }

  // 4. 如果最终没有可显示的内容，渲染 null
  if (!contentToShow) {
    return null
  }

  return (
    <>
      <div
        className="translation-separator"
        dangerouslySetInnerHTML={{ __html: settings.customSeparator }}
      >
      </div>
      <TweetBody
        lang="zh"
        className="font-bold! mt-2!"
        tweet={{
          ...originalTweet,
          entities: contentToShow,
        }}
        isTranslated
      />
    </>
  )
}
