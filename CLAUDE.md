# CLAUDE.md

## Routing Rules — Never Violate
- `semanticRouterService.js` and `semanticRouter.js` are two separate systems. Do not merge.
- User toggle values (`useWebSearch`, `criticalThinkingEnabled`) must never be overwritten silently.
- `deepResearchMode=true` must always intercept before semantic routing runs.
- ToT (Tree of Thoughts) requires BOTH user toggle AND complexity gate. Do not remove the gate.

## Development Commands
- Run backend dev server: `cd server && npm run dev`
- Run frontend dev server: `cd frontend && npm run dev`
- Run Playwright E2E tests: `npx playwright test`
- Run server tests: `npm run test:server`

## Never Add Without Asking
- New npm packages
- New environment variables
- New database collections
- Changes to `routingConfig.js` thresholds
