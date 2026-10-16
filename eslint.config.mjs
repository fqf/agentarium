import eslint from "@eslint/js";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  globalIgnores([".vite/**", "out/**", "dist/**"]),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettierRecommended,
]);

export default eslintConfig;
