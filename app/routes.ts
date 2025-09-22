import {
  index,
  type RouteConfig,
  route,
  layout,
} from '@react-router/dev/routes'

export default [
  layout("./components/Layout.tsx", [
    index('routes/home.tsx'),
    route('/:id', './routes/tweet.tsx'),
  ]),
] satisfies RouteConfig
