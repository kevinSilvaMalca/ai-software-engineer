module.exports = {
  extends: ['expo', 'prettier'],
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      // Test files — jest globals available
      files: ['**/__tests__/**/*', '**/*.test.*', 'jest.setup.js'],
      env: { jest: true },
    },
    {
      // Node scripts — __dirname, require, etc.
      files: ['scripts/**/*.js'],
      env: { node: true },
      rules: { 'no-console': 'off' },
    },
  ],
};
