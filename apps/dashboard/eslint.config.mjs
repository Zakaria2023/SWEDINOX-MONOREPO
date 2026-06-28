import coreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      // react-hook-form's watch() is a known incompatibility with React Compiler
      'react-hooks/incompatible-library': 'off',
      // shadcn-generated use-mobile.ts pattern — not our concern for now
      'react-hooks/set-state-in-effect': 'off',
      // postcss.config.mjs and other config files use anonymous default exports
      'import/no-anonymous-default-export': 'off',
    },
  },
]

export default eslintConfig
