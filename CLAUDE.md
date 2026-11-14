# Habit Tracker

@AGENTS.md

Personal Android habit tracker (school project). Expo SDK 58 · expo-router · react-native-paper (MD3) ·
expo-sqlite · date-fns · i18next (ko/en). Must keep running in **Expo Go**: don't add libraries that need a
development build without asking.

## Commands

On Windows, run `npx` from **PowerShell**. In Git Bash it fails with "'node' is not recognized".

```bash
npx expo start                 # dev server (open in Expo Go)
npx tsc --noEmit               # typecheck
npx jest                       # unit tests (npm test)
npx expo lint                  # lint
npx expo-doctor                # dependency/config check
npx expo install <pkg>         # add a dependency (SDK-compatible version)
npx expo export --platform android --output-dir <tmp-dir>   # check that Metro can bundle, no device needed
```

- **Dev dependencies:** PowerShell drops the `"--"` in `npx expo install x "--" --dev`. Install normally, then
  move the package to `devDependencies` and run `npm install`.
- **Before calling a task done:** tsc, jest and lint must all be clean.

## Structure

| Path | Contents |
|---|---|
| `src/app/` | Routes only. `(tabs)/` holds Home (`index`, the main screen), Report (monthly/weekly toggle), Habits and Settings. Also `habit/new`, `habit/[id]/edit`, `categories`, `archive` |
| `src/lib/` | Pure domain logic with no React or DB, plus `__tests__/`. Most logic belongs here |
| `src/db/` | SQLite schema/migrations, row mappers, query functions (one file per table) |
| `src/hooks/` | `useDbQuery`, `useSettings` (context), `useLogicalToday`, data hooks, write hooks |
| `src/components/` | `common/` (incl. `DayStateMark`, the one visual for a `DayState`), `today/` (Home), `report/`, `habits/`, `habit-form/`, `settings/` |
| `src/i18n/` | i18next setup and `locales/ko.ts` and `en.ts` |
| `src/constants/theme.ts` | Design tokens (spacing, radius, line width, sizes) |
| `src/constants/tabs.ts` | Bottom tab list. To add a tab, add one entry here plus a route file |
| `src/theme/` | Paper MD3 light/dark theme and the matching navigation theme |

## Date rules (most important)

- **A date is a logical local `YYYY-MM-DD` string (`ISODate`).**
  - Never use `toISOString()`, `new Date('YYYY-MM-DD')`, or any other UTC conversion.
  - Convert with `parseISODate` and `formatISODate`. Do arithmetic with `addDays` and `diffInDays`
    (date-fns calendar-day functions, so DST cannot shift a date).
- **"Today" comes only from `getLogicalDate(now, dayStartHour)`.** In components, use `useLogicalToday()`.
  - `dayStartHour` is a setting (default 0 = midnight). Hours before it belong to the previous day.
- **Week math lives only in `src/lib/week.ts`.**
  - `week_start` (`'sun'` is the default, or `'mon'`) affects only display order and week boundaries.
  - `days_of_week` is always stored as ISO weekdays (1 = Mon … 7 = Sun). Changing `week_start` never rewrites data.
  - Biweekly: the base week is the week containing `start_date`, then steps of 14 days.
- **A habit is active when `start_date <= date < archived_at`.** `archived_at` is a logical date. Logs outside
  the active range are kept but not shown.
- **`created_at` / `updated_at` are epoch-ms metadata.** Never use them for day logic.
- **Tests run in `TZ=America/New_York`** (`jest.global-setup.js`) so DST is exercised. Node on Windows ignores
  changes to `process.env.TZ` made at runtime, so don't switch TZ inside a test.

## Domain rules

- **Completion is never stored on the habit.** Only `habit_logs` rows (one per habit and date) exist, and
  completion is computed from them.
- **A habit's state on a day comes only from `getDayState` (`src/lib/stats.ts`).**
  - The states are done, missed, partial, not_scheduled, future and today_pending.
  - Every screen must use this function so the same habit and day never look different in two places.
  - Render a state with `DayStateMark` (`src/components/common/day-state-mark.tsx`).
  - Rates, streaks and month history are in `stats.ts` too.
- **`at_most`:** no log means "unrecorded" and is never success. A value of 0 is a real record and is kept.
- **`at_least` and check:** 0 means the same as nothing recorded, so writing 0 deletes the log.
- **`weekly_count`:** weekly success comes from `getWeekResult` / `getWeeklyProgress`.
  - Days are shown only when done.
  - For rates, a week belongs to the month its first day falls in.
- **Report rates never mix units:** `getReportRates` (`src/lib/calendar.ts`) returns day-based habits
  (days) and weekly_count habits (weeks) as two separate rates.
- **Home** shows today. `‹ ›` can step back to fix past records, but the picked day resets to today when
  the tab loses focus or the app goes to the background. Report cells are view-only (no jump to a day).

## Data layer

- **Refresh mechanism (no global state library):**
  - Every write function in `src/db/*.ts` calls `notifyDbChanged()`.
  - Reads go through `useDbQuery(query)`, which re-runs the query on every change. `query` must be
    referentially stable: a module-level function, or wrapped in `useCallback`.
- **Schema changes:**
  - Append a migration to `MIGRATIONS` in `src/db/migrations.ts` (the version is tracked in `PRAGMA user_version`).
  - Never edit a migration that has already shipped.
  - Also update `HabitRow` and the mappers in `src/db/mappers.ts`.
- **Foreign keys:**
  - `PRAGMA foreign_keys = ON` is set per connection in `initDatabase`.
  - Deleting a category sets its habits to NULL (uncategorized). Deleting a habit cascades to its logs.
  - Don't use `withExclusiveTransactionAsync`: it opens a new connection where foreign keys are off.

## UI rules

- **Design is not final.** Don't hard-code spacing, radius, line widths or sizes; add a token to
  `src/constants/theme.ts`. Colors come from the Paper theme (`useTheme()`) plus each habit's own color.
- **No chart libraries.** Draw bars and progress with plain `View`s.
- **Accessibility:**
  - Never show state by color alone. Use filled vs empty shapes.
  - Interactive and stateful elements get accessibility labels.
- **Strings:**
  - Every user-visible string goes through an i18n key in **both** `ko.ts` and `en.ts`. `en` is typed as
    `Translation`, so a missing key fails tsc.
  - User-entered names (habits, categories) are not translated.
- **Text inputs:** don't transform the value inside `onChangeText` (it breaks Korean IME composition).
- **Dialogs:** render them conditionally and initialize their state on mount (no syncing effects).

## Status

- **Done:** M1–M4, and patch steps A (Sunday-first weeks, `week.ts`), B (`stats.ts`) and C (Report tab:
  monthly/weekly views; Today renamed to Home).
- **Pending:**
  - Patch D: `step_value` migration and "increment" field. Keep it in its own commit.
  - Patch E: habit detail screen at `habit/[id]`. The Habits list currently opens `habit/[id]/edit`.

Update this section when that changes.

## Workflow

The user commits. Don't run `git commit`. Stop after each milestone or patch step, and report a short
summary plus a one-line English commit message.
