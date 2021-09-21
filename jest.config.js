module.exports = require('./packages/jest/jest.config');

module.exports.testMatch = ['**/__tests__/**/*.spec.ts'];
module.exports.testPathIgnorePatterns.push('/bootstrap-starter/');
