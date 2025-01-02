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
	},
	// Node.js scripts that use CommonJS
	{
		files: [
			"src/CNAME.js",
			// "src/experiments/server.js",
		],
		languageOptions: {
			globals: {
				...globals.node,
			},
			sourceType: "commonjs",
		},
	},
	// Tests
	{
		files: ["**/*.test.js"],
		languageOptions: {
			globals: {
				...globals.node,
				// ...globals.browser,
				it: "readonly",
				expect: "readonly",
				describe: "readonly",
				beforeEach: "readonly",
				test: "readonly",
			},
		},
	},
];
