/** @type {import('jest').Config} */
module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  testEnvironment: 'node',
  clearMocks: true,
  moduleNameMapper: {
    '^../../utils/prisma$': '<rootDir>/src/__mocks__/prisma.ts'
  }
};
