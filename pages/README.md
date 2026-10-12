This empty folder is intentional.

Next.js would treat `src/pages` (the FSD *pages* layer) as the Pages Router.
A root-level `pages/` directory takes precedence, so `src/pages` is ignored by Next.js routing.
Routes live in the root `app/` directory and only re-export from `src/pages`.
