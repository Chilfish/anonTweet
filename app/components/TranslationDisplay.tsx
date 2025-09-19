import React from 'react';
import { useTranslationStore, useTranslation } from '~/lib/stores/translation';
import { TweetBody } from '~/lib/react-tweet/twitter-theme/tweet-body';
import type { EnrichedTweet, EnrichedQuotedTweet } from '~/lib/react-tweet/utils';

interface TranslationDisplayProps {
  tweetId: string;
  originalTweet: any; // 使用any类型以兼容不同的推文类型
  tweetType: 'source' | 'quoted' | 'comment';
}

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  tweetId,
  originalTweet,
  tweetType,
}) => {
  const { settings, showTranslations, createTranslatedTweet, hasTextContent } = useTranslationStore();
  const { translation } = useTranslation(tweetId);

  // 检查是否应该显示翻译
  const shouldShowTranslation = () => {
    // 全局翻译开关关闭
    if (!showTranslations) return false;

    // 检查推文类型开关
    if (tweetType === 'source' && !settings.showSourceTranslation) return false;
    if (tweetType === 'quoted' && !settings.showQuotedTranslation) return false;
    if (tweetType === 'comment' && !settings.showCommentTranslation) return false;

    // 纯图片推文检测 - 使用更严格的检测逻辑
    if (!hasTextContent(originalTweet.text)) return false;

    // 没有翻译内容
    if (!translation?.text || translation.text.trim().length === 0) return false;

    return true;
  };

  if (!shouldShowTranslation()) {
    return null;
  }

  // 创建翻译后的推文对象
  const translatedTweet = createTranslatedTweet(originalTweet, tweetId);

  if (!translatedTweet) {
    return null;
  }

  return (
    <>
      <div
        className='translation-separator'
        dangerouslySetInnerHTML={{ __html: settings.customSeparator }}
      ></div>
      <TweetBody
        className='font-bold! mt-2!'
        tweet={translatedTweet}
      />
    </>
  );
};