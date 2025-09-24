#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

console.log('🧪 Comprehensive Test Dashboard\n')

// Unit Test Results
console.log('📊 UNIT TESTS (Vitest)')
console.log('='.repeat(50))
try {
  const unitResult = execSync('npm run test:run', {
    encoding: 'utf8',
    cwd: process.cwd(),
  })
  console.log(unitResult)
} catch (error) {
  console.log('❌ Unit tests failed:', error instanceof Error ? error.message : String(error))
}

// Check if coverage exists
const coveragePath = path.join(process.cwd(), 'coverage', 'index.html')
if (fs.existsSync(coveragePath)) {
  console.log(`📈 Coverage Report: file://${coveragePath}`)
} else {
  console.log('📈 Coverage Report: Run `npm run test:coverage` to generate')
}

console.log('\n🎭 E2E TESTS (Playwright)')
console.log('='.repeat(50))

const playwrightReportPath = path.join(process.cwd(), 'playwright-report', 'index.html')

if (fs.existsSync(playwrightReportPath)) {
  console.log(`📊 Playwright Report: file://${playwrightReportPath}`)
  console.log('🌐 Live Report: http://localhost:9323 (if running)')
} else {
  console.log('📊 Playwright Report: Run `npm run test:e2e` to generate')
}

// Test file counts
const testFiles = {
  unit: path.join(process.cwd(), 'src', 'components', '__tests__'),
  e2e: path.join(process.cwd(), 'tests', 'e2e'),
  visual: path.join(process.cwd(), 'tests', 'visual'),
  utils: path.join(process.cwd(), 'tests', 'utils'),
}

console.log('\n📁 TEST INFRASTRUCTURE')
console.log('='.repeat(50))

Object.entries(testFiles).forEach(([type, dir]) => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter((file) => file.match(/\.(test|spec)\.[tj]sx?$/))
    console.log(`${type.toUpperCase()}: ${files.length} files`)
    files.forEach((file) => console.log(`  ✓ ${file}`))
  } else {
    console.log(`${type.toUpperCase()}: Directory not found`)
  }
  console.log()
})

console.log('🚀 QUICK COMMANDS')
console.log('='.repeat(50))
console.log('npm run test:ui          # Interactive unit test runner')
console.log('npm run test:e2e:ui      # Interactive E2E test runner')
console.log('npm run test:coverage    # Generate coverage report')
console.log('npm run test:all         # Run all tests')
console.log('npm run test:report      # Open Playwright report')

// Package.json test scripts
console.log('\n⚙️  AVAILABLE TEST SCRIPTS')
console.log('='.repeat(50))
try {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  Object.entries(pkg.scripts ?? {})
    .filter(([key]) => key.startsWith('test'))
    .forEach(([key, value]) => {
      console.log(`${key.padEnd(20)}: ${value}`)
    })
} catch (error) {
  console.log('❌ Could not read package.json')
  if (error instanceof Error) {
    console.debug(error.message)
  }
}
