import { TweetContainer } from './tweet-container'
import styles from './tweet-not-found.module.css'

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
      <div className={styles.root}>
        <h3>
          找不到推文 ID:
          {errorMessage}
        </h3>
        <p>
          该推文未找到或已不可见，可能已被删除。
        </p>
        <p>
          {error?.message}
        </p>
      </div>
    </TweetContainer>
  )
}
