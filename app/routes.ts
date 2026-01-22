import type { RouteConfig } from '@react-router/dev/routes'
import {
  index,
  layout,
  prefix,
  route,

} from '@react-router/dev/routes'

export default [
  route('plain-tweet/:id', 'routes/plain.tsx'),
  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('/list/:id', 'routes/list.tsx'),
    route('/tweets/:id', 'routes/tweet.tsx'),
    route('/bili', 'routes/bili.tsx'),
  ]),

  ...prefix('api', [
    route('bili-post', 'routes/api/bili-post.tsx'),
    route('ai-test', 'routes/api/ai/ai-test.ts'),
    route('ai-translation', 'routes/api/ai/ai-translation.ts'),

    ...prefix('tweet', [
      route('get/:id', 'routes/api/tweet/get.ts'),
      route('set', 'routes/api/tweet/set.ts'),
      route('list/:id', 'routes/api/tweet/list.ts'),
      route('/replies/:id', 'routes/api/tweet/replies.ts'),
    ]),

    ...prefix('user', [
      route('get/:username', 'routes/api/user/get.ts'),
      route('timeline/:username', 'routes/api/user/timeline.ts'),
    ]),
  ]),

  // Not found
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
