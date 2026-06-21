import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        globalThis: 'readonly',
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // These patterns are architectural choices (fetch-on-mount via useCallback) — downgrade to warn
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      // Allow empty catch blocks (we use them intentionally for silent error handling)
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Unused vars: warn instead of error to avoid build crashes
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_|^e$' }],
    },
  },
])

