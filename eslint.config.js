import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/", "out/", "company-files/"],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: "error",
    },
  },
];
