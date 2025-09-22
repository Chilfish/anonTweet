import { MyTweet, TweetComponent } from "~/components/Tweet";
import { TweetInputForm } from "~/components/TweetInputForm";
import { PageHeader } from "~/components/PageHeader";
import { BackButton } from "~/components/BackButton";
import { SettingsPanel } from "~/components/SettingsPanel";
import { useSearchParams } from "react-router";
import { getTweet } from "~/lib/react-tweet/api";
import { Await, useLoaderData } from "react-router"
import { Suspense, useEffect, useRef } from "react";
import { TweetNotFound, TweetSkeleton } from "~/lib/react-tweet";
import { useTranslationStore } from "~/lib/stores/translation";
import { SaveAsImageButton } from "~/components/saveAsImage";

export function meta() {
  return [
    { title: `Chill Tweets` },
    {
      name: 'description',
      content: `一个第三方 Twitter 查看器，专注于阅读体验和用户友好的界面设计。`,
    },
  ]
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url)
  const tweetId = url.searchParams.get('id');
  if (tweetId) {
    const tweet = await getTweet(tweetId)
    return { tweet }
  }
  return { tweet: null }
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const tweetId = searchParams.get('id');
  const plain = searchParams.get('plain') === 'true';
  const { tweet } = useLoaderData<typeof loader>();
  const tweetRef = useRef<HTMLDivElement>(null);
  const { setTweetElRef, setTweet } = useTranslationStore();

  if (plain && tweetId) {
    return <TweetComponent id={tweetId} />;
  }

  useEffect(() => {
    if (tweetRef.current) {
      setTweetElRef(tweetRef.current);
    }
  }, [tweetRef])

  useEffect(() => {
    if (tweet) {
      setTweet(tweet);
    }
  }, [tweet])

  return (
    <div className="container mx-auto px-2 py-8 flex flex-col justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <PageHeader />

      <div className="flex flex-col items-center justify-center space-y-6">
        {!tweetId ? (
          <TweetInputForm />
        ) : (
          <div className="w-full flex flex-col items-center justify-center gap-6">
            <div className="flex items-center w-full max-w-2xl gap-4">
              <BackButton />
              <SaveAsImageButton />
              <SettingsPanel />
            </div>

            <div
              className="w-full max-w-2xl"
              ref={tweetRef}>
              <Suspense fallback={<TweetSkeleton />}>
                <Await
                  resolve={tweet}
                  errorElement={
                    <div>Could not load tweet 😬</div>
                  }
                  children={(resolvedTweet) => resolvedTweet
                    ? <MyTweet tweet={resolvedTweet} />
                    : <TweetNotFound />
                  }
                />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
