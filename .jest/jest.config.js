module.exports = {
  preset: 'ts-jest',
  rootDir: '../',
  testEnvironment: 'node',
  maxWorkers: 4,
  globalSetup: './.jest/setup.ts'
}
