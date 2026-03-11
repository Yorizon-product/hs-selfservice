## Context

The project uses custom CSS variables (`--bg-page`, `--text-primary`, etc.) with Tailwind. shadcn/ui components expect a specific token naming convention (`--background`, `--foreground`, `--primary`, etc.). Tweakcn is a visual theme editor that exports shadcn-compatible CSS. The goal is to bridge all three: shadcn CLI for components, tweakcn for visual editing, and a sync script to keep them connected.

Current stack: Next.js 14, Tailwind 3, React 18. No shadcn/ui or components.json yet.

## Goals / Non-Goals

**Goals:**
- Initialize shadcn/ui CLI so components can be added later
- Remap CSS variables to shadcn naming convention (both light and dark)
- Preserve Yorizon-specific tokens (fonts, brand colors like `--lime-decorative`)
- Create a sync script that fetches theme CSS from a tweakcn instance
- Make sync callable as `npm run sync-theme` or as a pre-deploy hook

**Non-Goals:**
- Adding actual shadcn/ui components (that's per-feature work)
- Migrating away from Tailwind 3 to v4 (separate concern)
- Building a full design system package (future)
- Auto-deploying on theme change (manual trigger is fine)

## Decisions

### 1. Token mapping strategy
**Decision**: Map existing Yorizon tokens to shadcn equivalents while keeping Yorizon-specific extras.

| Yorizon Token | shadcn Token |
|---|---|
| `--bg-page` | `--background` |
| `--bg-card` | `--card` |
| `--bg-primary` | `--primary` |
| `--bg-input` | `--input` (border color in shadcn) |
| `--text-primary` | `--foreground` |
| `--text-heading` | `--card-foreground` or keep custom |
| `--text-muted` | `--muted-foreground` |
| `--text-on-primary` | `--primary-foreground` |
| `--border-default` | `--border` |
| `--border-subtle` | `--ring` |
| `--color-error` | `--destructive` |
| `--color-success` | `--chart-2` or keep custom `--success` |
| `--lime-decorative` | `--accent` |
| `--bg-section` | `--muted` |
| `--focus-ring` | `--ring` |

**Rationale**: shadcn components use these exact names. Mapping means any shadcn component works out of the box.

### 2. Sync script approach
**Decision**: Node script (`scripts/sync-theme.mjs`) that fetches tweakcn's CSS export endpoint, parses the CSS variables, and merges them into `globals.css` — preserving font-face declarations and animations.

**Alternative considered**: Shell script with curl + sed. Rejected — too fragile for CSS parsing and merging.

### 3. What the sync script touches
**Decision**: The script only overwrites the `:root` and `.dark` CSS variable blocks. Everything else in `globals.css` (font imports, font-face, animations, utility classes) is preserved untouched.

**Rationale**: Tweakcn only manages color/spacing tokens. Fonts and animations are project-specific.

### 4. shadcn/ui color format
**Decision**: Use HSL values without `hsl()` wrapper per shadcn v2 convention: `--primary: 68 100% 23%`.

**Rationale**: This is what shadcn CLI expects and what tweakcn exports.

## Risks / Trade-offs

- **[Token rename breaks existing styles]** → All existing inline `var(--bg-*)` and `var(--text-*)` references in `page.tsx` must be updated in the same commit. Search-and-replace is straightforward.
- **[Tweakcn instance downtime]** → Sync script should fail gracefully with a clear error, not break the build. Theme is committed to git, so builds always have a fallback.
- **[HSL vs hex mismatch]** → Current tokens use hex. shadcn uses HSL. The sync script handles conversion, or tweakcn exports HSL directly.
