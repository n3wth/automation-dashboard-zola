# /build Command

Build the project with validation and analysis.

## Usage
```
/build
/build analyze
/build docker
```

## Actions
1. Clean previous build artifacts
2. Run validation (lint, type-check)
3. Build production bundle
4. Optional: Run bundle analyzer
5. Report build size and performance metrics

## Implementation
```bash
rm -rf .next && npm run lint && npm run type-check && npm run build
```

## Docker Build
```bash
docker compose build
```