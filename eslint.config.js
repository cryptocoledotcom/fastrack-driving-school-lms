/**
 * ESLint Configuration for Fastrack LMS
 * 
 * PHILOSOPHY:
 * - Fix code issues, not suppress them. ESLint violations are real problems 99% of the time.
 * - Use eslint-disable comments ONLY for intentional patterns that would create worse problems.
 * - Document WHY a suppression exists if used (inline comment explaining the pattern).
 * 
 * SUPPRESSION GUIDELINES:
 * - NEVER use file-level eslint-disable for legitimate code issues
 * - Use inline eslint-disable-next-line ONLY when:
 *   1. Adding the dependency would create an infinite loop or performance issue
 *   2. The pattern is intentional and documented
 *   3. The code has been reviewed and the team understands why the rule is being violated
 * 
 * EXAMPLE OF LEGITIMATE SUPPRESSION:
 * // eslint-disable-next-line react-hooks/exhaustive-deps
 * }, [user]); // Intentional: adding userProfile here causes infinite loop
 * 
 * EXAMPLE OF WRONG (NEVER DO THIS):
 * // eslint-disable react-hooks/exhaustive-deps  // WRONG: File-level suppression
 * // eslint-disable  // WRONG: Suppresses all rules
 * 
 * See docs/development/ESLINT_GUIDE.md for complete guidelines.
 */

import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

export default [
  {
    ignores: [
      'dist',
      'build',
      'node_modules',
      'coverage',
      '.vite',
      'functions/.eslintrc.js',
      'set-super-admin.js',
    ],
  },

  // PRODUCTION CODE CONFIGURATION
  // Applies to: src/**/*.{js,jsx} (excludes tests)
  {
    files: ['src/**/*.{js,jsx}', '!src/**/*.test.{js,jsx}', '!src/**/*.spec.{js,jsx}', '!src/setupTests*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // REACT RULES
      'react/react-in-jsx-scope': 'off',  // React 17+ doesn't need React import for JSX
      'react/prop-types': 'off',           // Using TypeScript-like patterns instead
      'react/jsx-uses-react': 'off',       // React 17+ automatic JSX transform
      'react/jsx-uses-vars': 'error',      // Variables used in JSX should be marked as used
      'react/no-unescaped-entities': 'off', // HTML entities handled by React
      
      // REACT HOOKS RULES (CRITICAL - DO NOT DISABLE)
      'react-hooks/rules-of-hooks': 'error',      // Hooks must be called at top level
      'react-hooks/exhaustive-deps': 'warn',      // Dependency arrays must include all used variables
                                                   // Note: Use inline comment if suppression needed
                                                   // Example: // eslint-disable-next-line react-hooks/exhaustive-deps

      // GENERAL RULES
      'no-console': ['warn', { allow: ['warn', 'error'] }],  // No console.log, but warn/error ok
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],  // Prefix with _ to mark intentionally unused
      'no-var': 'error',                  // Always use const/let instead of var
      'prefer-const': 'error',            // Use const when value doesn't change
      'prefer-arrow-callback': 'warn',    // Arrow functions are preferred
      'eqeqeq': ['error', 'always'],      // Use === instead of ==
      'no-eval': 'error',                 // Never use eval()
      'no-implied-eval': 'error',         // Don't use eval via setTimeout/setInterval
      'no-with': 'error',                 // Don't use with statement
      'no-extend-native': 'error',        // Don't modify built-in prototypes

      // IMPORT RULES (Enforce consistent import ordering)
      'import/no-unresolved': 'error',    // Import paths must be resolvable
      'import/no-cycle': 'warn',          // Warn about circular dependencies
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',   // Blank line between import groups
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
    },
  },

  {
    files: ['src/**/*.test.{js,jsx}', 'src/**/*.spec.{js,jsx}', 'src/setupTests*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        fail: 'readonly',
        jest: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'import/no-unresolved': 'off',
      'no-console': 'off',
    },
  },

  {
    files: ['functions/**/*.js', 'vite.config.js', 'vitest.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/no-unresolved': 'off',
      'no-console': 'off',
    },
  },

  {
    files: ['functions/**/*.test.js', 'functions/**/__tests__/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'import/no-unresolved': 'off',
      'no-console': 'off',
    },
  },

  {
    files: ['scripts/**/*.js', 'scripts/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
];
