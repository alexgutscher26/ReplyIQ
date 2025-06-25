import antfu from '@antfu/eslint-config'
import { FlatCompat } from '@eslint/eslintrc'
import perfectionist from 'eslint-plugin-perfectionist'

const compat = new FlatCompat()

export default antfu(
  ...compat.config({
    extends: [
      'plugin:react-hooks/recommended',
    ],
    ignorePatterns: [
      'tsconfig.*',
    ],
  }),

  // perfectionist
  {
    rules: {
      'import/order': 'off',
      ...perfectionist.configs['recommended-natural'].rules,
    },
  },

  // shadcn/ui
  ...compat.config({
    ignorePatterns: [
      'src/components/ui/*',
      'src/lib/utils.ts',
      'src/entrypoints.inactive/**/*',
      'src/types/wxt-env.d.ts',
      // 'src/content/Test.tsx',
    ],
  }),
)
