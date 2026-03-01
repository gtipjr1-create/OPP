# OPP Release Checklist

## Pre-merge
- `npm run lint`
- `npm test`
- `npm run test:e2e` (or note why deferred)
- Verify `docs/task-row-state-matrix.md` for task-row changes
- Verify migrations are safe and reversible

## Pre-deploy
- Confirm env vars in Vercel and Supabase
- Confirm latest migration applied
- Smoke check login, add/edit/delete task, reorder, archived logs

## Post-deploy
- Verify production home and login routes load
- Verify server action failures surface user-safe notices
- Check telemetry logs for new errors in first 30 minutes

## Hotfix Protocol
- Reproduce and scope blast radius
- Add failing test first when feasible
- Ship minimal patch
- Verify with smoke flow and telemetry
