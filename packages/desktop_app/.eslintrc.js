module.exports = {
    parser: '@typescript-eslint/parser',
    env: {
        es6: true,
        node: true,
    },
    extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:prettier/recommended',
    ],
    settings: {
        'import/resolver': {
            typescript: {},
        },
    },
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        project: './tsconfig.json',
    },
    rules: {
        '@typescript-eslint/unbound-method': ['off'],
        '@typescript-eslint/restrict-template-expressions': ['off'],
        '@typescript-eslint/ban-ts-comment': ['off'],
        '@typescript-eslint/no-namespace': ['off'],
        '@typescript-eslint/explicit-module-boundary-types': ['off'],
        '@typescript-eslint/no-unsafe-assignment': ['off'],
        '@typescript-eslint/no-unsafe-member-access': ['off'],
        '@typescript-eslint/no-unsafe-call': ['off'],
        '@typescript-eslint/no-explicit-any': ['off'],
        '@typescript-eslint/no-unsafe-return': ['off'],
        '@typescript-eslint/no-floating-promises': ['off'],
        '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions', 'functions', 'methods'] }],
        '@typescript-eslint/no-unused-vars': ['error', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
        '@typescript-eslint/no-use-before-define': ['error', { functions: true, classes: true, variables: true }],
        '@typescript-eslint/require-await': ['off'],
        'prefer-const': ['error', { destructuring: 'any', ignoreReadBeforeAssign: true }],
    },
    overrides: [
        {
            files: ['**/*.ts'],
            extends: [],
            rules: {
                'default-case': 'off',
            },
        },
    ],
};
