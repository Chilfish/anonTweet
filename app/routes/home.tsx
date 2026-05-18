import { TweetInputForm } from '~/components/tweet/TweetInputForm'

export function meta() {
  return [
    { title: 'Anon Tweet — 匿名推文浏览器 | 无需登录查看 Twitter/X 推文' },
    {
      name: 'description',
      content: `Anon Tweet — 第三方 Twitter / Instagram 查看器，专注于阅读体验和用户友好的界面设计。`,
    },
    { name: 'keywords', content: 'Twitter, X, 推文, 匿名, 翻译, AI翻译, 推文浏览器, Tweet viewer, anonymous twitter' },
  ]
}

export default function Home() {
  return (
    <>
      <TweetInputForm />
    </>
  )
}
