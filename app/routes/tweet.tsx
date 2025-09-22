import { MyTweet } from "~/components/Tweet";
import { BackButton } from "~/components/BackButton";
import { SettingsPanel } from "~/components/SettingsPanel";
import { useSearchParams } from "react-router";
import { getTweet, type Tweet } from "~/lib/react-tweet/api";
import { Await, useLoaderData } from "react-router"
import { Suspense, useEffect, useRef, use } from "react";
import { TweetNotFound, TweetSkeleton } from "~/lib/react-tweet";
import { useTranslationStore } from "~/lib/stores/translation";
import { SaveAsImageButton } from "~/components/saveAsImage";
import type { Route } from './+types/tweet'

export function meta() {
    return [
        { title: `Anon Tweets` },
        {
            name: 'description',
            content: `一个第三方 Twitter 查看器，专注于阅读体验和用户友好的界面设计。`,
        },
    ]
}

export function HydrateFallback() {
    return (
        <div className="w-full max-w-2xl">
            <TweetSkeleton />
        </div>
    )
}

export async function loader({
    params,
}: Route.LoaderArgs): Promise<{
    tweet: Tweet | null,
    quotedTweet: Tweet | null,
    parentTweets: Tweet[],
}> {
    const { id: tweetId } = params;
    if (!tweetId) {
        return { tweet: null, parentTweets: [], quotedTweet: null }
    }

    let tweet = await getTweet(tweetId)
    let quotedTweet : Tweet | null = null;
    const mainTweet = tweet || null;

    if (!tweet) {
        return { tweet: null, parentTweets: [], quotedTweet: null }
    }

    const parentTweets: Tweet[] = [];

    while (true) {
        if (!tweet.in_reply_to_status_id_str) {
            break;
        }
        const parentTweet = await getTweet(tweet.in_reply_to_status_id_str);
        if (!parentTweet) {
            break;
        }
        parentTweets.unshift(parentTweet);
        tweet = parentTweet;
    }

    if (tweet.quoted_tweet) {
        quotedTweet = await getTweet(tweet.quoted_tweet.id_str);
    }

    return { tweet: mainTweet, parentTweets, quotedTweet }
}

function TweetContent() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <Suspense fallback={<HydrateFallback />}>
            <Await
                resolve={loaderData}
                errorElement={
                    <TweetNotFound />
                }
                children={(resolvedTweet) => resolvedTweet.tweet
                    ? <MyTweet
                        tweet={resolvedTweet.tweet}
                        quotedTweet={resolvedTweet.quotedTweet}
                        parentTweets={resolvedTweet.parentTweets}
                    />
                    : <TweetNotFound />
                }
            />
        </Suspense>)
}

export default function Tweet({
    params,
    loaderData,
}: Route.ComponentProps) {
    const [searchParams] = useSearchParams();
    const plain = searchParams.get('plain') === 'true';
    const { id: tweetId } = params;

    const tweetRef = useRef<HTMLDivElement>(null);
    const { setTweetElRef, setTweet } = useTranslationStore();

    if (plain && tweetId) {
        return <TweetContent />
    }

    useEffect(() => {
        if (tweetRef.current) {
            setTweetElRef(tweetRef.current);
        }
    }, [tweetRef])

    useEffect(() => {
        if (loaderData.tweet) {
            setTweet(loaderData.tweet);
        }
    }, [loaderData.tweet])

    return (
        <div className="w-full flex flex-col items-center justify-center gap-6">
            <div className="flex items-center w-full max-w-2xl gap-4">
                <BackButton />
                <SaveAsImageButton />
                <SettingsPanel />
            </div>

            <div
                className="w-full max-w-2xl"
                ref={tweetRef}
            >
                <TweetContent />
            </div>
        </div>
    )
}