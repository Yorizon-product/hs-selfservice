## ADDED Requirements

### Requirement: Sync theme from tweakcn instance
The system SHALL provide a Node script at `scripts/sync-theme.mjs` that fetches CSS theme tokens from a remote tweakcn instance and writes them to `app/globals.css`.

#### Scenario: Successful theme sync
- **WHEN** user runs `npm run sync-theme` with a valid `TWEAKCN_URL` env var set
- **THEN** the script fetches the CSS export from the tweakcn instance, parses the CSS variables, and updates the `:root` and `.dark` blocks in `app/globals.css`

#### Scenario: Preserves non-token content
- **WHEN** the sync script updates `globals.css`
- **THEN** font-face declarations, font imports, animations, utility classes, and all content outside `:root`/`.dark` variable blocks SHALL be preserved unchanged

#### Scenario: Missing TWEAKCN_URL
- **WHEN** user runs `npm run sync-theme` without `TWEAKCN_URL` set
- **THEN** the script SHALL exit with a non-zero code and print an error message explaining the missing variable

#### Scenario: Tweakcn instance unreachable
- **WHEN** the tweakcn instance is unreachable or returns an error
- **THEN** the script SHALL exit with a non-zero code, print a clear error, and SHALL NOT modify `globals.css`

### Requirement: npm script integration
The system SHALL expose the sync as `npm run sync-theme` in `package.json`.

#### Scenario: Script is registered
- **WHEN** a developer runs `npm run sync-theme`
- **THEN** it executes `node scripts/sync-theme.mjs`
