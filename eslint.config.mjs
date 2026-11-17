import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "calidad/informes/**",
  ]),
  {
    files: ["src/**/*.{ts,tsx}", "ia/**/*.{ts,mjs}"],
    rules: {
      "no-console": "error",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      complexity: ["error", 15],
      "max-lines-per-function": ["error", { max: 150, skipBlankLines: true, skipComments: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": "allow-with-description" },
      ],
    },
  },
  { files: ["ia/guardia.mjs"], rules: { "no-console": "off" } },
  { files: ["**/*.test.{ts,tsx}"], rules: { "max-lines-per-function": "off" } },
]);

export default eslintConfig;
