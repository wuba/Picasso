module.exports = {
    parser: 'babel-eslint',
    env: {
        commonjs: true,
        es6: true,
        node: true,
    },
    extends: 'eslint:recommended',
    rules: {
        indent: ['error', 4],
        'no-invalid-regexp': 'off',
        'no-useless-escape': 'off',
    }
};
