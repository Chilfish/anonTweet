import { TweetInputForm } from '~/components/tweet/TweetInputForm'

export function meta() {
  return [
    { title: `Anon Tweets` },
    {
      name: 'description',
      content: `Anon Tweet — 第三方 Twitter / Instagram 查看器，专注于阅读体验和用户友好的界面设计。`,
    },
  ]
}

export default function Home() {
  return (
    <>
      <TweetInputForm />
    </>
  )
}
