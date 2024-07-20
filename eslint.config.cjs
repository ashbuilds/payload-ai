module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:perfectionist/recommended-natural',
    'prettier',
  ],
  plugins: ['import-x', '@typescript-eslint', 'perfectionist'],
  rules: {
    // Base rules
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
    "perfectionist/sort-imports": [
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

    // Important TypeScript rules
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/consistent-type-imports': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-ts-expect-error': 'error',
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
  },
};
