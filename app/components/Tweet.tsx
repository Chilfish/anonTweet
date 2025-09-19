/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Tweet } from "~/lib/react-tweet/api";
import {
  type TwitterComponents,
  TweetContainer,
  TweetHeader,
  TweetInReplyTo,
  TweetBody,
  TweetMedia,
  TweetInfo,
  TweetActions,
} from "~/lib/react-tweet";
import { Suspense } from "react";
import { getTweet } from "~/lib/react-tweet/api";
import { type TweetProps, TweetNotFound, TweetSkeleton } from "~/lib/react-tweet";
import { enrichTweet } from "~/lib/react-tweet";

type Props = {
  tweet: Tweet;
  components?: TwitterComponents;
};


export const MyTweet = ({ tweet: t, components }: Props) => {
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
          <TweetHeader tweet={tweet.quoted_tweet as any} components={components} />
          <TweetBody tweet={tweet.quoted_tweet as any} />

          {tweet.quoted_tweet.mediaDetails?.length ? (
            <TweetMedia tweet={tweet.quoted_tweet} components={components} />
          ) : null}
          <TweetInfo tweet={tweet.quoted_tweet as any} />
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
