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
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Args named with a leading underscore are intentionally unused —
      // the convention for required-but-ignored callback params.
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],

      // Co-locating a context's hook with its provider is the standard React
      // pattern. This rule only governs Vite Fast Refresh in development — it
      // has no bearing on the production build — and the plugin exposes
      // allowExportNames for exactly this case. Splitting these would churn
      // ~60 import sites for no runtime benefit.
      'react-refresh/only-export-components': ['error', {
        allowConstantExport: true,
        allowExportNames: [
          'useAuth',
          'useAdmin',
          'useVendor',
          'useTheme',
          'useToastContext',
          'useConfirm',
          'ThemeContext',
          'getMobileProfile',
          'saveMobileProfile',
          // icons.jsx is a shared token module — it exports an icon map and
          // size/colour scales, not components, so Fast Refresh boundaries
          // do not apply to it.
          'Icons',
          'iconSizes',
          'iconColors',
          'ACCENT_PRESETS',
        ],
      }],

      // React Compiler migration advisory, not a correctness rule — the guide
      // it links to ("You Might Not Need an Effect") describes a refactor, not
      // a bug. The ~55 remaining sites are all mount-time data fetches whose
      // proper fix is moving them onto React Query, which this codebase already
      // uses for newer screens (see MyTrips). That is planned architectural
      // work across ~30 admin/vendor pages, each with its own response shape
      // and derived state, so it is tracked as a warning rather than silently
      // suppressed or rushed into an unverifiable bulk rewrite.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    // Node build tooling. Only tailwind.config.js is CommonJS; the other
    // config files are ESM and must keep the default sourceType.
    files: ['tailwind.config.js', '**/*.cjs'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
    },
  },
  {
    files: ['vite.config.js', 'postcss.config.js', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
])
