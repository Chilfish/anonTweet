import type { Tweet } from "~/lib/react-tweet/api";
import {
  type TwitterComponents,
  TweetContainer,
  TweetHeader,
  TweetBody,
  TweetMedia,
  TweetInfo,
  TweetActions,
  type EnrichedTweet,
} from "~/lib/react-tweet";
import { Suspense } from "react";
import { getTweet } from "~/lib/react-tweet/api";
import { type TweetProps, TweetNotFound, TweetSkeleton } from "~/lib/react-tweet";
import { enrichTweet } from "~/lib/react-tweet";
import { TranslationDisplay } from "../TranslationDisplay";
import { TranslationEditor } from "../TranslationEditor";
import { TweetLinkCard } from "./TweetCard";

type Props = {
  tweet: Tweet;
  quotedTweet?: Tweet | null;
  parentTweets?: Tweet[];
  components?: TwitterComponents;
  showMp4CoverOnly?: boolean;
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

const ThreadTweet = ({ tweet: t, components, showMp4CoverOnly }: Props) => {
  const tweet = enrichTweet(t);

  return (
    <TweetContainer
      className="border-none! p-0! m-0! pb-2! relative"
    >
      <div
        className="flex items-center justify-between"
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
        className="pl-14!"
      >
        {/* Thread 的那根对齐头像的竖线 */}
        <div className="absolute left-5.5 top-12 bottom-0 h-full w-[2px] bg-[#cfd9de] dark:bg-[#333639] z-0"></div>

        {/* 原推文 */}
        <TweetBody tweet={tweet} />

        {/* 翻译显示 */}
        <TranslationDisplay
          tweetId={`${tweet.id_str}`}
          originalTweet={tweet}
        />

        {tweet.mediaDetails?.length ? (
          <TweetMedia tweet={tweet} components={components} showCoverOnly={showMp4CoverOnly} />
        ) : null}

      {tweet.card && <TweetLinkCard tweet={tweet} />}

        <TweetActions
          tweet={tweet}
          className="mt-2 gap-12!"
        />

      </div>
    </TweetContainer>
  )
}

export const MyTweet = ({ tweet: t, parentTweets = [], quotedTweet: q, components, showMp4CoverOnly }: Props) => {
  const tweet = enrichTweet(t);
  let quotedTweet: EnrichedTweet | null = null;
  if (tweet.quoted_tweet?.id_str && q) {
    quotedTweet = enrichTweet(q);
  }

  return (
    <TweetContainer>
      {parentTweets.map((parentTweet) => (
        <ThreadTweet
          key={parentTweet.id_str}
          tweet={parentTweet}
          components={components}
        />
      ))}

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
        <TweetMedia tweet={tweet} components={components} showCoverOnly={showMp4CoverOnly} />
      ) : null}

      {tweet.card && <TweetLinkCard tweet={tweet} />}

      {quotedTweet && (
        <div className="p-4! border-2 rounded-2xl mt-2!">
          <div
            className="flex items-center justify-between"
          >
            <TweetHeader
              tweet={quotedTweet as any}
              components={components}
              createdAtInline
            />
            <TranslationEditor
              tweetId={`${quotedTweet.id_str}`}
              originalTweet={quotedTweet}
            />
          </div>

          <TweetBody tweet={quotedTweet} />

          {/* 引用推文翻译显示 */}
          <TranslationDisplay
            tweetId={`${quotedTweet.id_str}`}
            originalTweet={quotedTweet}
          />

          {quotedTweet.mediaDetails?.length ? (
            <TweetMedia tweet={quotedTweet} components={components} showCoverOnly={showMp4CoverOnly} />
          ) : null}

          {quotedTweet.card && <TweetLinkCard tweet={quotedTweet} />}
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
