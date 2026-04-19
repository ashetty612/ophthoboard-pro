import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // CRITICAL: these catch the class of bug that caused React error #310
      // (hooks after conditional returns). Treat as hard errors.
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      "*.py",
    ],
  },
];

export default eslintConfig;
