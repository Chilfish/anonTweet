import { HankoMark } from './HankoMark'

export function PageHeader() {
  return (
    <div className="text-center space-y-3 mb-12">
      <div className="flex items-start justify-center gap-3">
        <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-pink-400 to-[#1d9bf0] bg-clip-text text-transparent">
          <ruby>
            あのん
            <rp>(</rp>
            <rt className="text-sm">Anonymously</rt>
            <rp>)</rp>
          </ruby>
          <span className="ml-2">
            Tweet
          </span>
        </h1>
        <HankoMark className="mt-2.5" />
      </div>
      <p className="text-xl">
        匿名地查看和分享 Twitter 推文与 Instagram 帖子
      </p>
    </div>
  )
}
