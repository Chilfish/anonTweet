import { TweetComponent } from "@/components/Tweet";
import { TweetInputForm } from "@/components/TweetInputForm";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";
import { getTweet } from "@/components/Tweet";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

interface HomeProps {
  searchParams: Promise<{ id?: string; raw?: boolean; plain?: boolean }>;
}

export async function generateMetadata({
  searchParams,
}: HomeProps): Promise<Metadata> {
  const { id: tweetId, raw } = await searchParams;

  if (raw) {
    return redirect(`https://x.com/i/status/${tweetId}`);
  }

  if (!tweetId) {
    return {
      title: "Chill Tweet - 优雅的推文查看器",
      description:
        "一个简洁美观的 Twitter 推文查看器，支持直接输入推文链接或 ID，无需登录，无广告干扰。",
    };
  }

  try {
    const tweet = await getTweet(tweetId);
    const sliceSize = 36;
    if (tweet) {
      const user = tweet.user.name;
      const content = tweet.text.slice(0, sliceSize);
      const title = `@${user} on Twitter: ${content}${tweet.text.length > sliceSize ? "..." : ""}`;

      return {
        title,
        description: `查看 @${user} 的推文: ${content}${tweet.text.length > sliceSize ? "..." : ""}`,
      };
    }
  } catch (error) {
    console.error("Failed to fetch tweet for metadata:", error);
  }

  return {
    title: "Chill Tweet - 推文查看器",
    description: "查看 Twitter 推文内容",
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const { id: tweetId, plain = false } = await searchParams;

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
            <div className="space-y-6 w-full">
              <div className="flex justify-center">
                <BackButton />
              </div>

              <div className="flex justify-center">
                <TweetComponent id={tweetId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
