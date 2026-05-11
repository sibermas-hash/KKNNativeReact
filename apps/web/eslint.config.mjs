import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  { linterOptions: { reportUnusedDisableDirectives: 'off' } },
  { settings: { next: { rootDir: __dirname } } },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Enforced as warnings (not errors) to avoid breaking builds while the
      // codebase is being tightened up. CI should eventually promote to error.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@next/next/no-img-element': 'off',
      'prefer-const': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
];

export default config;
