## 1. shadcn/ui CLI Setup

- [x] 1.1 Create `components.json` with project config (New York style, HSL vars, correct paths)
- [x] 1.2 Add `@radix-ui/react-slot` and `class-variance-authority` + `clsx` + `tailwind-merge` dependencies (shadcn prerequisites)
- [x] 1.3 Create `lib/utils.ts` with `cn()` helper

## 2. Token Migration

- [x] 2.1 Convert existing hex colors to HSL values for all Yorizon brand colors
- [x] 2.2 Rewrite `:root` block in `globals.css` with shadcn token names in HSL format
- [x] 2.3 Rewrite `.dark` / `prefers-color-scheme: dark` blocks with shadcn token names
- [x] 2.4 Extend `tailwind.config.ts` with shadcn color references (`colors: { background: "hsl(var(--background))" }`, etc.)

## 3. Codebase Update

- [x] 3.1 Update all `var(--bg-*)` and `var(--text-*)` references in `app/page.tsx` to shadcn equivalents or Tailwind utility classes
- [x] 3.2 Update `body` styles and focus styles in `globals.css` to use new token names
- [x] 3.3 Verify no old token names remain (grep for `--bg-page`, `--text-primary`, etc.)

## 4. Tweakcn Sync Script

- [x] 4.1 Create `scripts/sync-theme.mjs` — fetch CSS from `TWEAKCN_URL`, parse variables, merge into `globals.css`
- [x] 4.2 Add `sync-theme` script to `package.json`
- [x] 4.3 Add `TWEAKCN_URL` to `.env.local` (and `.env.example` if exists)

## 5. Verify

- [x] 5.1 Run `npx shadcn@latest add button` to confirm CLI works, then remove test component
- [x] 5.2 Confirm light and dark mode render correctly (verified via build + component test)
- [x] 5.3 Run `npm run build` — no errors
