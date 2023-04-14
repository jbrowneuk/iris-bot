import type { Config } from 'jest';

const config: Config = {
  displayName: 'iris-bot',
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        isolatedModules: true
      }
    ]
  },
  restoreMocks: true,
  coverageDirectory: 'coverage/iris-bot',
  collectCoverageFrom: ['./src/**/*.ts'],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80
    }
  }
};

export default config;
