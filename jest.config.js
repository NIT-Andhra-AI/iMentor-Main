/**
 * jest.config.js
 * 
 * Configures module resolution for Jest so it can find node_modules from
 * both the frontend, server, and test directories in the monorepo.
 */

module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/tests/e2e/' // Playwright E2E tests are handled separately
    ],
    moduleDirectories: [
        'node_modules',
        '<rootDir>/server/node_modules'
    ]
};
