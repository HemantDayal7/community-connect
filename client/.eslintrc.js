// .eslintrc.js (ESM version)
export default {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      ecmaFeatures: {
        jsx: true,
      },
    },
    env: {
      browser: true,
      node: true,
      es2021: true,
    },
    plugins: ["react"],
    extends: ["eslint:recommended", "plugin:react/recommended"],
    rules: {
      "react/react-in-jsx-scope": "off"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  };
  