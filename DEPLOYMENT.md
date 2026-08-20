# Police Rule Web — Deployment Guide

## Architecture

- Frontend: Vite + React + TypeScript
- Backend/database: Convex
- Convex source directory: `src/convex/`
- Generated Convex client files: `src/convex/_generated/` (generated locally/CI; do not commit)
- SPA server: `main.ts` (Hono/Deno)

## Local development

From the repository root:

```bash
npm install
npx convex dev
```

`npx convex dev` configures the local project/deployment and generates `src/convex/_generated/`. Keep this process running while developing.

Alternatively:

```bash
npm run dev
```

The `dev` script is already configured as `convex dev --start vite`.

## Production environment

The frontend requires:

```text
VITE_CONVEX_URL=https://<your-deployment>.convex.cloud
```

The Convex backend requires the appropriate deployment environment variables. In particular, `CONVEX_SITE_URL` must be the **Convex Site URL** used by the authentication issuer, not the URL of the frontend host.

If Freebuff federated authentication is enabled, also configure:

```text
VLY_CONVEX_AUTH_ISSUER=https://freebuff.com
```

Do not commit secrets, deployment keys, JWT private keys, or real `.env` files.

## Build

A production build must generate the Convex API before TypeScript/Vite compilation:

```bash
npm run build
```

Equivalent steps:

```bash
npm run codegen
npm run typecheck
npm run build:client
```

`npm run build` therefore requires a configured Convex deployment/environment. If you see:

```text
No CONVEX_DEPLOYMENT set
```

configure the Convex project first with:

```bash
npx convex dev
```

For a CI/production deployment, configure the required Convex deployment credentials as CI/provider secrets rather than committing them to the repository.

## Deploying Convex

Deploy the Convex backend using the Convex deployment mechanism for the target production deployment. Do not copy `src/convex/_generated/` into Git; it is generated from the Convex source.

After the backend is deployed, set the production `VITE_CONVEX_URL` in the frontend hosting environment and build the Vite application.

## Deploying the Deno/Hono server

`main.ts` serves the generated `dist/` directory and falls back to `dist/index.html` for SPA routes. The Deno host must therefore receive the result of:

```bash
npm run build
```

and start `main.ts` with Deno.

## Important checks

Before publishing a production build:

1. `npx convex dev` or the production Convex deployment process succeeds.
2. `src/convex/_generated/` is generated successfully.
3. `npm run typecheck` passes.
4. `npm run build` passes.
5. `VITE_CONVEX_URL` points to the intended production Convex deployment.
6. Convex Auth environment variables are configured on the Convex deployment.
7. Test `/rules`, `/search`, `/auth`, `/manage`, `/categories`, `/dashboard`, and `/backup` after deployment.

## Authentication note

The project intentionally keeps Convex Auth source files under `src/convex/`. Do not replace the existing authentication implementation with a frontend-only login. Authorization for admin mutations is enforced in the Convex backend.
