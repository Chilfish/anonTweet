import { TweetContainer } from './tweet-container'
import styles from './tweet-not-found.module.css'

interface Props {
  error?: any
  tweetId?: string
}

export function TweetNotFound(_props: Props) {
  const errorMessage = _props.error?.message?.split('Invalid tweet id:')[1] || _props.tweetId || 'Unknown'
  return (
    <TweetContainer>
      <div className={styles.root}>
        <h3>
          找不到推文 ID:
          {errorMessage}
        </h3>
        <p>
          该推文未找到或已不可见，可能已被删除。
        </p>
      </div>
    </TweetContainer>
  )
}
