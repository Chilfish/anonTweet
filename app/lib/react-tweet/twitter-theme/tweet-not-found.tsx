import { TweetContainer } from './tweet-container'

interface Props {
  error?: any
  tweetId?: string
}

export function TweetNotFound({ error, tweetId }: Props) {
  const errorMessage = error?.message?.split('Invalid tweet id:')[1] || tweetId || 'Unknown'
  return (
    <TweetContainer
      id={errorMessage}
      className="tweet-loaded"
    >
      <div className="flex flex-col items-center pb-3 text-center">
        <h3 className="text-xl mb-2 font-bold">
          找不到推文 ID:
          {errorMessage}
        </h3>
        <p className="mb-2">
          该推文未找到或已不可见，可能已被删除。
        </p>
        <p className="text-sm text-gray-500">
          {error?.message}
        </p>
      </div>
    </TweetContainer>
  )
}
