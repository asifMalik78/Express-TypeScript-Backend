import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import perfectionist from 'eslint-plugin-perfectionist';

export default tslint.config(
  {
    ignores: [
      '**/*.js',
      'node_modules',
      'dist',
      'drizzle.config.ts',
      'eslint.config.mjs',
    ],
  },
  eslint.configs.recommended,
  tslint.configs.strictTypeChecked,
  tslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  perfectionist.configs['recommended-natural'],
  prettier
);
