## Why

Yorizon is building multiple apps that need consistent branding. The current CSS token system in `globals.css` is custom and project-local. By adopting shadcn/ui's token convention and syncing from a central tweakcn instance, all Yorizon apps can share one theme source of truth — updated visually, pulled automatically.

## What Changes

- Initialize shadcn/ui CLI (`components.json`) in the project
- Remap existing Yorizon CSS variables to shadcn's `--background`, `--foreground`, `--primary`, etc. naming convention in `globals.css`
- Add a `scripts/sync-theme.mjs` script that fetches the theme from a tweakcn instance URL and writes it to `globals.css`
- Add a `TWEAKCN_URL` env var for the tweakcn instance endpoint
- Add `sync-theme` npm script, callable standalone or as pre-deploy step

## Capabilities

### New Capabilities
- `theme-sync`: Script to pull shadcn-compatible CSS tokens from a remote tweakcn instance and write them to the project's globals.css
- `shadcn-tokens`: shadcn/ui CLI initialization and CSS variable token mapping for consistent component theming

### Modified Capabilities

## Impact

- `app/globals.css` — CSS variables renamed to shadcn convention (light + dark mode)
- `components.json` — new file for shadcn CLI config
- `tailwind.config.ts` — updated to reference shadcn token names
- `package.json` — new `sync-theme` script
- `scripts/sync-theme.mjs` — new file
- `.env.local` — new `TWEAKCN_URL` variable
- All existing Tailwind classes referencing old `--bg-*`, `--text-*` vars need updating in `app/page.tsx`
