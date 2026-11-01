> **DEPRECATED — NO LONGER MAINTAINED.** This project is discontinued, so the items below will not be carried out. They are kept for reference only.

# UPDATE — imagic-timer

> Audit performed: 2026-04-07. Version at time of audit: 1.1.1

---

## API improvements (minor bump)

- [ ] **`listTimers()`** — returns `{ intervals: [...ids], timeouts: [...ids], paused: [...ids] }` for debugging and monitoring
- [ ] **`getStatus(id)`** — returns `'active' | 'paused' | 'not_found'`
- [ ] **`clearAllIntervals()`** and **`clearAllTimeouts()`** — separate methods instead of a single `clearAll()`
- [ ] **Zero-dep vs imagic-utils** — `generateRandomId()` duplicates `imagic-utils` functionality. Decision: either document the intentional zero-dependency approach (the library currently has no dependencies — this is a virtue), or add `imagic-utils` as a dependency. Recommended to keep zero-dep and document this in README.

---

## Backlog

- [ ] Cron-like scheduling (`createCron('0 * * * *', callback)`)
- [ ] Named timer groups support (`clearGroup('sync')`)
- [ ] TypeScript type exports
- [ ] Metrics: trigger counter for each timer
