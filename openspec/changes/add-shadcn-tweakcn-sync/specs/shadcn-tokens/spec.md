## ADDED Requirements

### Requirement: shadcn/ui CLI initialization
The project SHALL have a `components.json` file configured for shadcn/ui CLI with the project's style preferences (New York style, HSL CSS variables, Tailwind CSS).

#### Scenario: shadcn CLI recognizes project
- **WHEN** a developer runs `npx shadcn@latest add button` (or any component)
- **THEN** shadcn CLI reads `components.json` and installs the component with correct paths and styling

### Requirement: CSS variables use shadcn naming convention
The `app/globals.css` SHALL define CSS variables using shadcn's naming convention (`--background`, `--foreground`, `--primary`, `--primary-foreground`, etc.) in HSL format for both light and dark modes.

#### Scenario: Light mode tokens
- **WHEN** the page loads in light mode
- **THEN** `:root` defines `--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring` with Yorizon brand colors in HSL

#### Scenario: Dark mode tokens
- **WHEN** the page loads in dark mode (OS preference or `.dark` class)
- **THEN** dark mode overrides provide the Yorizon dark palette mapped to the same shadcn token names

### Requirement: Tailwind config references shadcn tokens
The `tailwind.config.ts` SHALL extend colors to reference shadcn CSS variable names so Tailwind classes like `bg-primary`, `text-foreground` work.

#### Scenario: Tailwind classes resolve to tokens
- **WHEN** a developer uses `className="bg-primary text-primary-foreground"`
- **THEN** the element uses `--primary` and `--primary-foreground` CSS variable values

### Requirement: Existing UI updated to new token names
All CSS variable references in `app/page.tsx` SHALL be updated from old Yorizon names to shadcn equivalents.

#### Scenario: No references to old token names
- **WHEN** the codebase is searched for `var(--bg-` or `var(--text-`
- **THEN** zero results are found (all migrated to shadcn names or Tailwind utility classes)
