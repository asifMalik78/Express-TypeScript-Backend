import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import perfectionist from 'eslint-';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';


export default tslint.config(
  {
    ignores: ["**/*.js" , "node_modules" , "dist"]
  },
  eslint.configs.recommended,
  tslint.configs.strictTypeChecked,
  tslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  perfectionist.configs["recommended-natural"],
  eslintPluginPrettier.configs["recommended"]
)