import type { RouteConfig } from '@react-router/dev/routes'
import {
  index,
  layout,
  prefix,
  route,

} from '@react-router/dev/routes'

export default [
  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('/tweets/:id', 'routes/tweet.tsx'),
    route('/bili', 'routes/bili.tsx'),
  ]),

  route('images/*', 'routes/images.tsx'),
  ...prefix('api', [
    route('bili-post', 'routes/api/bili-post.tsx'),

    ...prefix('tweet', [
      route('get/:id', 'routes/api/tweet/get.ts'),
      route('set', 'routes/api/tweet/set.ts'),
      route('image/:id', 'routes/api/tweet/image.ts'),
    ]),

    ...prefix('user', [
      route('get/:username', 'routes/api/user/get.ts'),
      route('timeline/:username', 'routes/api/user/timeline.ts'),
    ]),
  ]),

  // Not found
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
