import type { Preview } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import '../app/app.css'

/**
 * 全局装饰器：单一 Router 上下文（react-router v8 MemoryRouter）。
 * tweet 目录的 TweetHeader / TweetInputForm 依赖路由（Link/useNavigate）；
 * 若在单个 story 内各自包 Router 会触发「cannot render a Router inside another
 * Router」——全站只保留这一个 Router（review-2026-08-19 阶段二 Storybook 基建）。
 */
const preview: Preview = {
  decorators: [
    Story => (
      <MemoryRouter initialEntries={['/']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    actions: { argTypesRegex: '^on.*' },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  tags: ['autodocs'],
}

export default preview
