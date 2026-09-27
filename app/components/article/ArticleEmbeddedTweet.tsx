import type { EnrichedTweet } from '~/types'
import { MyPlainTweet } from '~/components/tweet/PlainTweet'

/**
 * 文章内嵌推文的只读渲染：复用推文卡片组件（`PlainTweet`）。
 *
 * 数据由阅读页 loader 并行取回后经 `ArticleBody.renderEmbed` 注入。推文自身的时间戳
 * 已链接到 X 原帖，故不再额外提供「在 X 查看」入口。
 */
export function ArticleEmbeddedTweet({ tweet }: { tweet: EnrichedTweet }) {
  return (
    <div className="my-4">
      <MyPlainTweet tweets={[tweet]} mainTweetId={tweet.id_str} enableTranslation={false} />
    </div>
  )
}
