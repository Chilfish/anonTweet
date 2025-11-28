import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  rules: {
    'unused-imports/no-unused-vars': 'warn',
    'no-console': 'off',
    'antfu/no-top-level-await': 'off',
    'node/prefer-global/buffer': 'off',
    'node/prefer-global/process': 'off',
    'accessor-pairs': 'off',
    'style/multiline-ternary': 'off',
    'unicorn/prefer-number-properties': 'warn',
    'ts/no-use-before-define': 'warn',
    'no-case-declarations': 'off',
  },
})
