import type { Tweet } from "~/lib/react-tweet/api";
import {
  type TwitterComponents,
  TweetContainer,
  TweetHeader,
  TweetBody,
  TweetMedia,
  TweetInfo,
  TweetActions,
} from "~/lib/react-tweet";
import { Suspense } from "react";
import { getTweet } from "~/lib/react-tweet/api";
import { type TweetProps, TweetNotFound, TweetSkeleton } from "~/lib/react-tweet";
import { enrichTweet } from "~/lib/react-tweet";
import { TranslationDisplay } from "./TranslationDisplay";
import { TranslationEditor } from "./TranslationEditor";

type Props = {
  tweet: Tweet;
  components?: TwitterComponents;
};

/**
 * 如果是 Thread （查看的是评论）：
 *  - 显示被回复的推文、评论的推文
 *  - 头像之间有竖线、源推文除了 header 有 padding
 * 
 * 条件：
 *  - 推文有 parent 且 parent 是 Tweet
 *  - 推文的 in_reply_to_user_id_str 与 parent 的 user.id_str 相等
 */

const ThreadTweet = ({ tweet: t, components }: Props) => {
  const tweet = enrichTweet(t);

  return (
    <TweetContainer
      className="border-none! px-0! my-0! py-2 relative"
    >
      <div
        className="flex items-center justify-between mt-2"
      >
        <TweetHeader
          tweet={tweet}
          components={components}
          className="pb-1!"
          createdAtInline
        />
        <TranslationEditor
          tweetId={tweet.id_str}
          originalTweet={tweet}
        />
      </div>
      <div
        className="pl-14! relative"
      >
        {/* Thread 的那根对齐头像的竖线 */}
        <div className="absolute left-5.5 -top-1 bottom-0 h-[calc(100%+2rem)] w-1 bg-[#cfd9de]"></div>

        {/* 原推文 */}
        <TweetBody tweet={tweet} />

        {/* 翻译显示 */}
        <TranslationDisplay
          tweetId={`${tweet.id_str}`}
          originalTweet={tweet}
        />

        {tweet.mediaDetails?.length ? (
          <TweetMedia tweet={tweet} components={components} />
        ) : null}

      </div>
    </TweetContainer>
  )
}

export const MyTweet = ({ tweet: t, components }: Props) => {
  const tweet = enrichTweet(t);
  const parentTweet = tweet.parent as unknown as Tweet;

  return (
    <TweetContainer
      className="mx-auto!"
    >
      {parentTweet && <ThreadTweet tweet={parentTweet} components={components} />}

      <div
        className="flex items-center justify-between"
      >
        <TweetHeader
          tweet={tweet}
          components={components}
        />
        <TranslationEditor
          tweetId={`${tweet.id_str}`}
          originalTweet={tweet}
        />
      </div>

      <TweetBody tweet={tweet} />

      {/* 源推文翻译显示 */}
      <TranslationDisplay
        tweetId={`${tweet.id_str}`}
        originalTweet={tweet}
      />

      {tweet.mediaDetails?.length ? (
        <TweetMedia tweet={tweet} components={components} />
      ) : null}

      {tweet.quoted_tweet && (
        <div className="p-4! border-2 rounded-2xl mt-2!">
          <div
            className="flex items-center justify-between"
          >
            <TweetHeader
              tweet={tweet.quoted_tweet as any}
              components={components}
              createdAtInline
            />
            <TranslationEditor
              tweetId={`${tweet.quoted_tweet.id_str}`}
              originalTweet={tweet.quoted_tweet}
            />
          </div>

          <TweetBody tweet={tweet.quoted_tweet as any} />

          {/* 引用推文翻译显示 */}
          <TranslationDisplay
            tweetId={`${tweet.quoted_tweet.id_str}`}
            originalTweet={tweet.quoted_tweet}
          />

          {tweet.quoted_tweet.mediaDetails?.length ? (
            <TweetMedia tweet={tweet.quoted_tweet} components={components} />
          ) : null}
        </div>
      )}

        <div className="flex items-center gap-3 pt-2">
          <TweetInfo tweet={tweet} />
          <TweetActions tweet={tweet} />
        </div>
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
