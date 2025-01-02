import js from "@eslint/js";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import globals from "globals";

export default [
	{
		"ignores": [
			"**/node_modules",
			// "**/build",
			"**/out",
			"**/dist",
			"**/lib",
			"**/.*",
		],
	},
	js.configs.recommended,
	reactRecommended,
	{
		files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
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
