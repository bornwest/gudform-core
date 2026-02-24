import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier";
import tailwindcss from "eslint-plugin-tailwindcss";

const config = [
  { ignores: ["emails/**"] },
  ...nextCoreWebVitals,
  prettier,
  ...tailwindcss.configs["flat/recommended"],
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/jsx-key": "off",
      "tailwindcss/no-custom-classname": "off",
      "tailwindcss/classnames-order": "error",
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "warn",
    },
    settings: {
      tailwindcss: {
        callees: ["cn"],
        config: "tailwind.config.ts",
      },
    },
  },
];

export default config;
