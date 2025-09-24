# /deploy Command

Deploy to production with safety checks.

## Usage
```
/deploy
/deploy preview
/deploy rollback
```

## Actions
1. Run full test suite
2. Build production bundle
3. Run E2E tests against build
4. Deploy to target environment
5. Verify deployment health

## Preview Deployment
```bash
vercel --prod=false
```

## Production Deployment
```bash
npm run test:run && npm run build && vercel --prod
```