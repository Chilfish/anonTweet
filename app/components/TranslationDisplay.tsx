import React from 'react';
import { useTranslationStore } from '~/lib/stores/translation';
import { TweetBody } from '~/lib/react-tweet/twitter-theme/tweet-body';

interface TranslationDisplayProps {
  tweetId: string;
  originalTweet: any;
}

export const TranslationDisplay: React.FC<TranslationDisplayProps> = ({
  tweetId,
  originalTweet,
}) => {
  const { settings, showTranslations, getTranslation, hasTextContent } = useTranslationStore();

  // 检查是否应该显示翻译
  const shouldShowTranslation = () => {
    // 全局翻译开关关闭
    if (!showTranslations) return false;

    // 纯图片推文检测 - 使用更严格的检测逻辑
    if (!hasTextContent(originalTweet.text)) return false;

    return true;
  };

  if (!shouldShowTranslation()) {
    return null;
  }

  const translation = getTranslation(tweetId);

  if (!translation) {
    return null;
  }

  return (
    <>
      <div
        className='translation-separator'
        dangerouslySetInnerHTML={{ __html: settings.customSeparator }}
      ></div>
      <TweetBody
        lang='zh'
        className='font-bold! mt-2!'
        tweet={{
          ...originalTweet,
          entities: translation,
        }}
      />
    </>
  );
};