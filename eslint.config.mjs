import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import path, { format } from "path";
import { fileURLToPath } from "url";

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
    // eslint.configs.recommended,
    // ...tseslint.configs.recommended,
    // ...tseslint.configs.stylistic,
    prettierConfig,
    {
        plugins: {
            // '@stylistic': stylistic
        },
        languageOptions: {
            parserOptions: {
                // project: true,
                // tsconfigRootDir: __dirname,
            },
        },
        rules: {
            //   "@typescript-eslint/naming-convention": [
            //     "error",
            //     {
            //       "selector": "variableLike",
            //       "format": ["camelCase"],
            //     },
            //     {
            //       "selector": "memberLike",
            //       "format": ["camelCase"],
            //     },
            //     {
            //       "selector":"typeLike",
            //       "format": ["PascalCase"],
            //     },
            //     {
            //       "selector":"property",
            //       "modifiers": ["private"],
            //       "format": ["camelCase"],
            //       "leadingUnderscore": "require",
            //     },
            //     {
            //       "selector": "variable",
            //       "modifiers": ["exported"],
            //       "format": ["UPPER_CASE"],
            //     } 
            //   ],
            //   '@typescript-eslint/no-namespace': 'off',
            //   '@stylistic/space-before-function-paren': ['error', 'always'],
            //   '@stylistic/indent': ['error', 4],
            //   '@stylistic/brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
            //   '@stylistic/member-delimiter-style': 'warn',
            //   '@stylistic/comma-spacing': 'warn',
            //   '@stylistic/block-spacing': 'warn',
            //   '@stylistic/eol-last': 'warn',
            //   '@stylistic/quotes': ['error','single'],
            //   "no-empty-function": "off",
            //   "@typescript-eslint/no-empty-function": "error"
        }
    },
    {
        ignores: ["eslint.config.mjs"]
    }
);
