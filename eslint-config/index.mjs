import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import perfectionistNatural from 'eslint-plugin-perfectionist/configs/recommended-natural'
import { configs as regexpPluginConfigs } from 'eslint-plugin-regexp'
import eslintConfigPrettier from 'eslint-config-prettier';
import reactExtends from './configs/react/index.mjs'
import globals from 'globals';
import importX from 'eslint-plugin-import-x'
import typescriptParser from '@typescript-eslint/parser'
import { deepMerge } from './deepMerge.js'

const baseRules = {
  // This rule makes no sense when overriding class methods. This is used a lot in richtext-lexical.
  'class-methods-use-this': 'off',
  'arrow-body-style': 0,
  'import-x/prefer-default-export': 'off',
  'no-restricted-exports': ['warn', { restrictDefaultExports: { direct: true } }],
  'no-console': 'warn',
  'no-sparse-arrays': 'off',
  'no-underscore-dangle': 'off',
  'no-use-before-define': 'off',
  'object-shorthand': 'warn',
  'no-useless-escape': 'warn',
  'import-x/no-duplicates': 'warn',
  'perfectionist/sort-imports': [
    "error",
    {
      "type": "natural",
      "order": "asc",
    }
  ],
  'perfectionist/sort-objects': [
    'error',
    {
      type: 'natural',
      order: 'asc',
      'partition-by-comment': true,
      'partition-by-new-line': true,
      groups: ['top', 'unknown'],
      'custom-groups': {
        top: ['_id', 'id', 'name', 'slug', 'type'],
      },
    },
  ],
  /*'perfectionist/sort-object-types': [
    'error',
    {
      'partition-by-new-line': true,
    },
  ],
  'perfectionist/sort-interfaces': [
    'error',
    {
      'partition-by-new-line': true,
    },
  ],*/
}

const reactRules = {
  'react/no-unused-prop-types': 'off',
  'react/prop-types': 'off',
  'react/require-default-props': 'off',
  'react/destructuring-assignment': 'warn',
  'react/no-unescaped-entities': 'warn',
  'jsx-a11y/anchor-is-valid': 'warn',
  'jsx-a11y/control-has-associated-label': 'warn',
  'jsx-a11y/no-static-element-interactions': 'warn',
  'jsx-a11y/label-has-associated-control': 'warn',
}

const typescriptRules = {
  '@typescript-eslint/no-use-before-define': 'off',
  '@typescript-eslint/ban-ts-comment': 'off',

  // Type-aware any rules:
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/unbound-method': 'warn',
  // This rule doesn't work well in .tsx files
  '@typescript-eslint/no-misused-promises': 'off',
  '@typescript-eslint/consistent-type-imports': 'warn',
  '@typescript-eslint/no-explicit-any': 'warn',
  // Type-aware any rules end

  // ts-expect preferred over ts-ignore. It will error if the expected error is no longer present.
  '@typescript-eslint/prefer-ts-expect-error': 'error',
  // By default, it errors for unused variables. This is annoying, warnings are enough.
  '@typescript-eslint/no-unused-vars': [
    'warn',
    {
      vars: 'all',
      args: 'after-used',
      ignoreRestSiblings: false,
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^ignore',
    },
  ],
  '@typescript-eslint/no-base-to-string': 'warn',
  '@typescript-eslint/restrict-template-expressions': 'warn',
  '@typescript-eslint/no-redundant-type-constituents': 'warn',
  '@typescript-eslint/no-unnecessary-type-constraint': 'warn',
  '@typescript-eslint/ban-types': 'warn',
}

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

/** @type {FlatConfig} */
const baseExtends = deepMerge(js.configs.recommended, perfectionistNatural , regexpPluginConfigs['flat/recommended'])



/** @type {FlatConfig[]} */
export const rootEslintConfig = [
  {
    name: 'Settings',
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parser: typescriptParser,
    },
    plugins: {
      'import-x': importX,
    },
  },
  {
    name: 'TypeScript',
    // has 3 entries: https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/typescript-eslint/src/configs/recommended-type-checked.ts
    ...deepMerge(
      baseExtends,
      tseslint.configs.recommendedTypeChecked[0],
      tseslint.configs.recommendedTypeChecked[1],
      tseslint.configs.recommendedTypeChecked[2],
      eslintConfigPrettier,
      {
        rules: {
          ...baseRules,
          ...typescriptRules,
        },
      }
    ),
    files: ['**/*.ts'],
  },
  {
    name: 'TypeScript-React',
    ...deepMerge(
      baseExtends,
      tseslint.configs.recommendedTypeChecked[0],
      tseslint.configs.recommendedTypeChecked[1],
      tseslint.configs.recommendedTypeChecked[2],
      reactExtends,
      eslintConfigPrettier,
      {
        rules: {
          ...baseRules,
          ...typescriptRules,
          ...reactRules,
        },
      }
    ),
    files: ['**/*.tsx'],
  },
]

export default rootEslintConfig
