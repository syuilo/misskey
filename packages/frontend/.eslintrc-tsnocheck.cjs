// Split from .eslintrc, so that the default eslintrc can still show error for ts-nocheck
module.exports = {
	root: true,
	extends: [
		'./.eslintrc.cjs',
	],
	rules: {
		'@typescript-eslint/ban-ts-comment': ['error', { 'ts-nocheck': false }]
	}
};
