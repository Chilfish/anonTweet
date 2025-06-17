import type { Tweet } from "react-tweet/api";
import {
  type TwitterComponents,
  TweetContainer,
  TweetHeader,
  TweetInReplyTo,
  TweetBody,
  TweetMedia,
  TweetInfo,
  TweetActions,
  enrichTweet,
} from "react-tweet";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { getTweet as _getTweet } from "react-tweet/api";
import { type TweetProps, TweetNotFound, TweetSkeleton } from "react-tweet";

type Props = {
  tweet: Tweet;
  components?: TwitterComponents;
};

export const getTweet = unstable_cache(
  async (id: string) => _getTweet(id),
  ["tweet"],
  { revalidate: 3600 * 24 },
);

const MyTweet = ({ tweet: t, components }: Props) => {
  const tweet = enrichTweet(t);
  const parentTweet = tweet.parent as unknown as Tweet;
  return (
    <TweetContainer>
      {parentTweet && <MyTweet tweet={parentTweet} components={components} />}

      <TweetHeader tweet={tweet} components={components} />
      {tweet.in_reply_to_status_id_str && <TweetInReplyTo tweet={tweet} />}
      <TweetBody tweet={tweet} />
      {tweet.mediaDetails?.length ? (
        <TweetMedia tweet={tweet} components={components} />
      ) : null}
      {tweet.quoted_tweet && (
        <div className="p-4! border-2 rounded-2xl mt-2!">
          <TweetHeader tweet={tweet.quoted_tweet} components={components} />
          <TweetBody tweet={tweet.quoted_tweet} />

          {tweet.quoted_tweet.mediaDetails?.length ? (
            <TweetMedia tweet={tweet.quoted_tweet} components={components} />
          ) : null}
          <TweetInfo tweet={tweet.quoted_tweet} />
        </div>
      )}
      <TweetInfo tweet={tweet} />
      <TweetActions tweet={tweet} />
    </TweetContainer>
  );
};

const TweetContent = async ({ id, components, onError }: TweetProps) => {
  const tweet = id
    ? await getTweet(id).catch((err) => {
        if (onError) {
          onError(err);
        } else {
          console.error(err);
        }
      })
    : undefined;

  if (!tweet) {
    const NotFound = components?.TweetNotFound || TweetNotFound;
    return <NotFound />;
  }

  return <MyTweet tweet={tweet} components={components} />;
};

export const TweetComponent = ({
  fallback = <TweetSkeleton />,
  ...props
}: TweetProps) => (
  <Suspense fallback={fallback}>
    <TweetContent {...props} />
  </Suspense>
);
