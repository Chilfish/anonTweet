import { MyTweet, TweetComponent } from "~/components/Tweet";
import { TweetInputForm } from "~/components/TweetInputForm";
import { PageHeader } from "~/components/PageHeader";
import { BackButton } from "~/components/BackButton";
import { useSearchParams } from "react-router";
import { getTweet } from "~/lib/react-tweet/api";
import { Await, useLoaderData } from "react-router"
import { Suspense } from "react";
import { TweetNotFound, TweetSkeleton } from "~/lib/react-tweet";

export function meta() {
  return [
    { title: `推文查看站` },
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

  if (plain && tweetId) {
    return <TweetComponent id={tweetId} />;
  }

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader />

        <div className="flex flex-col items-center justify-center space-y-8">
          {!tweetId ? (
            <TweetInputForm />
          ) : (
            <div className="w-full flex flex-col items-center justify-center gap-6">
              <div className="flex justify-center">
                <BackButton />
              </div>

           <Suspense fallback={<TweetSkeleton />}>
              <Await
                resolve={tweet}
                errorElement={
                  <div>Could not load tweet 😬</div>
                }
                children={(resolvedTweet) => (
                  resolvedTweet ?
                  <MyTweet tweet={resolvedTweet} />
                  : <TweetNotFound/>
                )}
              />
            </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
