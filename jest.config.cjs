module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  coverageDirectory: '<rootDir>/coverage',
  collectCoverage: true,
  collectCoverageFrom: ['lib/**/*.ts', 'pages/api/**/*.ts', '!**/node_modules/**', '!**/*.d.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './lib/providers/**': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './lib/services/**': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './pages/api/search*': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
}
