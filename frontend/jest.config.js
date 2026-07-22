const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Berikan path ke app Next.js Anda untuk memuat next.config.js dan file .env
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Memetakan alias @/ ke root folder
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Tambahkan ini agar Jest mengenali ekstensi TypeScript & JavaScript
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
}

module.exports = createJestConfig(customJestConfig)