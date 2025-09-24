import type { RouteConfig } from '@react-router/dev/routes'
import {
  index,
  layout,
  route,

} from '@react-router/dev/routes'

export default [
  layout('./components/layout/Layout.tsx', [
    index('routes/home.tsx'),
    route('/:id', './routes/tweet.tsx'),
  ]),
] satisfies RouteConfig
