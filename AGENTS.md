<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project conventions

- Feature-Sliced Design: routing lives in root `app/` (thin re-exports), FSD layers in `src/` (`app`, `pages`, `widgets`, `features`, `entities`, `shared`). Import only from lower layers and only through a slice's `index.ts`. Run `pnpm lint:fsd` (Steiger) after structural changes.
- shadcn/ui components go to `src/shared/ui` (aliases in `components.json`).
- `src/shared/api/translate/google.server.ts` is server-only and deliberately not exported from `@/shared/api`.
