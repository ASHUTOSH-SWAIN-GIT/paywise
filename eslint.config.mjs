import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable unused variables warnings
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
      
      // Disable type-related errors
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/prefer-as-const": "off",
      
      // Disable other common annoying rules
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/ban-types": "off",
      
      // Disable React-specific warnings
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      
      // Allow console statements
      "no-console": "off",
      
      // Disable Next.js specific warnings
      "@next/next/no-img-element": "off",
      
      // Disable prefer-const warnings
      "prefer-const": "off",
    },
  },
];

export default eslintConfig;
