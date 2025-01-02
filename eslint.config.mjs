import js from "@eslint/js";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import globals from "globals";

export default [
	js.configs.recommended,
	reactRecommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				process: "readonly",
			},

			ecmaVersion: 12,
			sourceType: "module",

			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},

		settings: {
			react: {
				version: "detect",
			},
		},

		rules: {
			indent: ["error", "tab"],
			quotes: ["error", "double"],
			semi: ["error", "always"],
		},
	}
];
