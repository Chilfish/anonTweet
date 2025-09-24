import { TweetContainer } from './tweet-container.js';
import styles from './tweet-not-found.module.css';

type Props = {
  error?: any;
  tweetId?: string;
};

export const TweetNotFound = (_props: Props) => {
  const errorMessage = _props.error?.message?.split('Invalid tweet id:')[1] || _props.tweetId || 'Unknown';
  return (
    <TweetContainer>
      <div className={styles.root}>
        <h3>Tweet not found for ID: {errorMessage}</h3>
        <p>The embedded tweet could not be found. Please check the tweet ID and try again.</p>
      </div>
    </TweetContainer>
  );
};
