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
      // Components & Functions: always arrow functions, never function declarations/expressions
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration:not([generator=true])',
          message: 'Use arrow functions instead of function declarations.',
        },
        {
          selector: 'FunctionExpression:not([generator=true])',
          message: 'Use arrow functions instead of function expressions.',
        },
      ],
      // Components & Functions: implicit return when function body is a single expression
      'arrow-body-style': ['error', 'as-needed'],
    },
  },
  {
    files: ['src/components/shadcn/**'],
    rules: {
      'no-restricted-syntax': 'off',
      'arrow-body-style': 'off',
    },
  },
]

export default eslintConfig
