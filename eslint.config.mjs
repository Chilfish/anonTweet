import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  rules: {
    'unused-imports/no-unused-vars': 'warn',
    'no-console': 'off',
  },
})
