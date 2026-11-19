import type { HttpRequest } from '@chilfish/tweet'
import { ResourceType } from '@chilfish/tweet'
import { Requests } from '@chilfish/tweet/internals'

/**
 * 临时补丁：`@chilfish/tweet@0.2.1` 的 `TweetRequests.details` 缺少 `fieldToggles`，
 * 导致 X Article 不返回 `content_state` / `plain_text`（AC-TWEET-013）。
 *
 * 上游修复后删除本文件，并移除 `twitter.server.ts` 的副作用 import。
 * 追踪：https://github.com/Chilfish/tweet-sdk/issues/4
 */
type RequestBuilder = (args: any) => HttpRequest

const mutableRequests = Requests as unknown as Record<string, RequestBuilder>
const originalDetails = mutableRequests[ResourceType.TWEET_DETAILS]!

mutableRequests[ResourceType.TWEET_DETAILS] = (args: any) => {
  const request = originalDetails(args)
  return {
    ...request,
    params: {
      ...(request.params ?? {}),
      fieldToggles: JSON.stringify({
        withArticleRichContentState: true,
        withArticlePlainText: true,
      }),
    },
  }
}
