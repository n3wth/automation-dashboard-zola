# /test Command

Run the complete test suite with proper validation.

## Usage
```
/test
/test unit
/test e2e
/test visual
```

## Actions
1. Run type checking first
2. Execute requested test suite
3. Generate coverage report if applicable
4. Validate no regressions

## Implementation
```bash
npm run type-check && npm run test:run
```