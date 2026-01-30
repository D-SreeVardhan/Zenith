# Changelog

## Unreleased (2026-01-31)

### Added
- Settings page (`/settings`) with tabs for Profile, Theme, Activity, and Account.
- Theme customization:
  - Primary + Secondary (accent) colors
  - Dark/Light mode toggle (with “Really Bro?” confirmation on switching to Light)
  - Clock settings (12h/24h + font style preview)
- Per-habit completion mode:
  - **Strict**: only today is markable
  - **Flexible**: mark any day in the current week view
- Optional profile personalization:
  - Username
  - WhatsApp-style profile photo picker (crop + compress) stored as a data URL

### Changed
- Activity moved into Settings; `/activity` redirects to `/settings?tab=activity`.
- Sidebar/Bottom nav updated: Activity removed; Settings added.
- Weekly Habits UI:
  - Strict mode greys out and disables unmarkable days
  - Markable unchecked days keep the neutral style; checked days use the secondary color
- Header now shows a live clock styled with theme colors.
- Light theme palette and card styling updated for better readability and cleaner visuals.

### Fixed
- Backfill `userEmail` for existing InstantDB rows after email login (habits/events/tasks/activity/profiles).

