import { TweetComponent } from "@/components/Tweet";
import { TweetInputForm } from "@/components/TweetInputForm";
import { PageHeader } from "@/components/PageHeader";
import { BackButton } from "@/components/BackButton";

interface HomeProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { id: tweetId } = await searchParams;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
