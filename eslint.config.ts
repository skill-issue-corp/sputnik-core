import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      parser: tsParser,
      globals: globals.node,
    },
  },
  tseslint.configs.recommended,
  {
    rules: {
      "semi": ["error", "always"],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        "args": "after-used"
      }],
      "curly": ["error", "multi-line"]
    },
  },
]);