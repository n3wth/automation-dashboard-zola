# Test Suite Documentation

This directory contains comprehensive end-to-end and visual regression tests for the Zola Next.js application using Playwright.

## Test Structure

```
/tests
├── e2e/                    # End-to-end functionality tests
│   ├── navigation.spec.ts  # Navigation and routing tests
│   ├── chat.spec.ts       # Chat functionality tests
│   ├── auth.spec.ts       # Authentication flow tests
│   └── performance.spec.ts # Performance and load tests
├── visual/                 # Visual regression tests
│   └── components.spec.ts  # UI component visual tests
└── utils/                  # Test utilities and helpers
    └── test-helpers.ts     # Reusable test functions
```

## Running Tests

### All Tests
```bash
npm run test:e2e          # Run all tests headless
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:headed   # Run with browser visible
npm run test:e2e:debug    # Run in debug mode
```

### Specific Test Types
```bash
npm run test:visual       # Visual regression tests only
npm run test:performance  # Performance tests only
```

### View Reports
```bash
npm run test:report       # Open HTML test report
```

## Test Categories

### 1. Navigation Tests (`navigation.spec.ts`)
- Homepage loading and layout
- Navigation between sections
- 404 error handling
- Mobile responsive navigation
- URL routing validation

### 2. Chat Tests (`chat.spec.ts`)
- Chat interface loading
- Message sending/receiving
- Chat history persistence
- Long message handling
- Keyboard shortcuts
- Error handling for network issues

### 3. Authentication Tests (`auth.spec.ts`)
- Unauthenticated user experience
- Auth state persistence
- Protected route behavior
- Logout functionality
- Session timeout handling
- Auth error handling

### 4. Performance Tests (`performance.spec.ts`)
- Page load performance
- Chat response times
- Memory usage monitoring
- Bundle size validation
- Multiple tab performance
- Rapid interaction handling

### 5. Visual Regression Tests (`components.spec.ts`)
- Homepage layout consistency
- Chat interface appearance
- Responsive design (mobile/tablet)
- Dark mode layouts
- Loading and error states
- Cross-browser consistency
- Component library consistency

## Test Configuration

The tests are configured in `playwright.config.ts` with:
- **Multiple browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Auto-retry**: Failed tests retry 2x in CI
- **Parallel execution**: Tests run in parallel for speed
- **Visual comparisons**: Automatic screenshot comparisons
- **Performance monitoring**: Built-in metrics collection

## Test Data

Test data is managed in `utils/test-helpers.ts`:
- **Chat IDs**: Predefined chat identifiers for testing
- **Test messages**: Various message types for different scenarios
- **User data**: Test user credentials and profiles

## Visual Testing

Visual regression tests capture screenshots and compare them against baselines:
- Screenshots are stored in `test-results/`
- Differences are highlighted in test reports
- Tests run across multiple browsers and viewports
- Dark mode and responsive layouts are tested

## Best Practices

1. **Use Test Helpers**: Leverage the `TestHelpers` class for common operations
2. **Wait for Elements**: Always wait for elements to be visible/enabled before interacting
3. **Hide Variable Content**: Use `hideVariableContent()` for consistent visual tests
4. **Error Handling**: Tests include error scenarios and edge cases
5. **Cross-Browser**: Tests validate consistency across different browsers
6. **Performance Aware**: Include performance assertions in relevant tests

## Debugging Tests

1. **UI Mode**: `npm run test:e2e:ui` - Interactive test runner
2. **Debug Mode**: `npm run test:e2e:debug` - Step through tests
3. **Headed Mode**: `npm run test:e2e:headed` - See browser while testing
4. **Screenshots**: Failed tests automatically capture screenshots
5. **Videos**: Test videos are recorded for failures

## CI/CD Integration

Tests are configured for CI environments:
- Automatic retries on failures
- Optimized for performance in CI
- HTML reports generated for results
- Screenshot/video artifacts saved

## Maintenance

To update tests:
1. Update test data in `test-helpers.ts` as needed
2. Add new test cases following existing patterns
3. Update visual baselines when UI changes are intentional
4. Keep performance thresholds realistic for your infrastructure

## Troubleshooting

Common issues:
- **Timeout errors**: Increase timeouts in config for slower environments
- **Visual differences**: Update baselines after intentional UI changes
- **Network issues**: Check if dev server is running on correct port
- **Auth issues**: Ensure test environment has proper auth setup