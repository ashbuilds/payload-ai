import payloadEsLintConfig from './eslint-config/index.mjs'

export const defaultESLintIgnores = [
  '**/.temp',
  '**/.*', // ignore all dotfiles
  '**/.git',
  '**/.hg',
  '**/.pnp.*',
  '**/.svn',
  '**/playwright.config.ts',
  '**/jest.config.js',
  '**/tsconfig.tsbuildinfo',
  '**/README.md',
  '**/eslint.config.js',
  '**/payload-types.ts',
  '**/dist/',
  '**/.yarn/',
  '**/build/',
  '**/node_modules/',
  '**/temp/',
]

/** @typedef {import('eslint').Linter.FlatConfig} */
let FlatConfig

export const rootParserOptions = {
  EXPERIMENTAL_useSourceOfProjectReferenceRedirect: true,
  EXPERIMENTAL_useProjectService: {
    allowDefaultProjectForFiles: ['./src/*.ts', './src/*.tsx'],
  },
  sourceType: 'module',
  ecmaVersion: 'latest',
}

/** @type {FlatConfig[]} */
export const rootEslintConfig = [
  ...payloadEsLintConfig,
  {
    ignores: [...defaultESLintIgnores],
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigDirName: import.meta.dirname,
        ...rootParserOptions,
      },
    },
  },
]

export default rootEslintConfig
