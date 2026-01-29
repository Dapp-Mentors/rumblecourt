import nextConfig from "eslint-config-next";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

const config = [
  ...nextConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "complexity": ["error", 50],
      "max-len": ["error", { "code": 200 }],
      "react-hooks/exhaustive-deps": "warn",
      "prefer-const": "error",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;