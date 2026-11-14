# Habit Tracker

A personal habit tracker for Android, built with Expo (SDK 58) as a course project.

- Check and quantity habits, with "at least" or "at most" goals
- Daily, weekday, every-other-week, and N-times-a-week schedules
- Categories, archive and restore
- Korean and English UI, light and dark themes
- All data is stored on the device in SQLite

## Run

```bash
npm install
npx expo start      # then open the app in Expo Go on an Android device
```

## Develop

```bash
npx tsc --noEmit    # typecheck
npx jest            # unit tests
npx expo lint       # lint
```

Project conventions, especially the date-handling rules, are documented in [CLAUDE.md](CLAUDE.md).
