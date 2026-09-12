import antfu from '@antfu/eslint-config'

// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format

export default antfu({
  formatters: true,
  markdown: false,
  // rettiwt-api 是内置第三方逆向库（非本项目代码），豁免 lint 以避免语义变更
  ignores: [
    '**/app/lib/rettiwt-api/**',
  ],
  rules: {
    'unused-imports/no-unused-vars': 'warn',
    'no-console': 'off',
    'antfu/no-top-level-await': 'off',
    'node/prefer-global/buffer': 'off',
    'node/prefer-global/process': 'off',
    'accessor-pairs': 'off',
    'style/multiline-ternary': 'off',
    'unicorn/prefer-number-properties': 'off',
    'ts/no-use-before-define': 'warn',
    'no-case-declarations': 'off',
    'e18e/prefer-static-regex': 'warn',
    // AC 验收编号命名（AC-TWEET-001 等）是验证体系的可追溯契约，豁免小写标题规则
    'test/prefer-lowercase-title': ['error', { allowedPrefixes: ['AC-'] }],
    // F10（review-2026-09-11 P2-3）：把「每条 it 至少一条断言」变成机器可查，
    // 并拦住条件断言 / 裸 expect —— 原 ac-sec 死 `return` 那类问题由此可被 lint 发现。
    // `expectCovered` 是 ac-ui 的内部断言辅助（内部调用 expect）。
    'test/expect-expect': ['error', { assertFunctionNames: ['expect', 'expectCovered'] }],
    'test/no-conditional-expect': 'error',
    'test/no-standalone-expect': 'error',
  },
})
