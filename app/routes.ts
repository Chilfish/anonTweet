import type { RouteConfig } from '@react-router/dev/routes'
import {
  index,
  layout,
  prefix,
  route,

} from '@react-router/dev/routes'

export default [
  // User routes
  layout('routes/layout.tsx', [
    index('routes/home.tsx'),
    route('/tweets/:id', 'routes/tweet.tsx'),
    route('/bili', 'routes/bili.tsx'),

    // ...prefix('settings', [
    //   layout('routes/settings/layout.tsx', [
    //     route('account', 'routes/settings/account.tsx'),
    //     route('sessions', 'routes/settings/sessions.tsx'),
    //     route('password', 'routes/settings/password.tsx'),
    //   ]),
    // ]),
  ]),

  // Better Auth routes
  // ...prefix('auth', [
  //   layout('routes/auth/layout.tsx', [
  //     route('sign-in', 'routes/auth/sign-in.tsx'),
  //     route('sign-up', 'routes/auth/sign-up.tsx'),
  //     route('sign-out', 'routes/auth/sign-out.tsx'),
  //   ]),
  //   // route("forget-password", "routes/auth/forget-password.tsx"),
  //   route('reset-password', 'routes/auth/reset-password.tsx'),
  // ]),

  // Admin routes
  // ...prefix('admin', [
  //   layout('routes/admin/layout.tsx', [
  //     index('routes/admin/dashboard.tsx'),
  //     route('users', 'routes/admin/users/index.tsx'),
  //   ]),
  // ]),

  route('images/*', 'routes/images.tsx'),
  // Better Auth and other API routes
  ...prefix('api', [
    // route('auth/error', 'routes/api/better-error.tsx'),
    // route('auth/*', 'routes/api/better.tsx'),
    // route('color-scheme', 'routes/api/color-scheme.ts'),
    route('bili-post', 'routes/api/bili-post.tsx'),

    ...prefix('tweet', [
      route('get/:id', 'routes/api/tweet/get.ts'),
      route('user/:id', 'routes/api/tweet/user.ts'),
      route('set', 'routes/api/tweet/set.ts'),
    ]),
  ]),

  // Not found
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig
