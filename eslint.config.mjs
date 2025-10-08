// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ...js.configs.recommended,
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      // ✅ STYLE RULES
      quotes: ['error', 'single'],
      indent: ['error', 2],
      semi: ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-trailing-spaces': 'error',
      'space-before-blocks': ['error', 'always'],
      'keyword-spacing': ['error', { before: true, after: true }],
      'eol-last': ['error', 'always'],

      // ✅ BEST PRACTICES
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
    },
  },
];
