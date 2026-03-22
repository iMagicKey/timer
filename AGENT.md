# AGENT — imagic-timer

## Purpose

Manage named intervals and timeouts with pause/resume support, isolated error handling, and automatic cleanup on callback failure.

## Package

- npm: `imagic-timer`
- import (local): `import TimerManager from '../src/index.js'`
- import (installed): `import TimerManager from 'imagic-timer'`
- zero runtime deps

## Exports

### `new TimerManager(options?): TimerManager` *(default export)*

- `options.id` {string} [auto: 8-char alphanumeric] — instance identifier
- `options.onError` {(error: Error, timerId: string) => void} [undefined] — global error handler for all timers on this instance
- returns: `TimerManager` instance
- throws: nothing

**Instance properties:**
- `.id` {string} — instance ID
- `.timeouts` {Record<string, Timeout>} — active timeout handles
- `.intervals` {Record<string, Timeout>} — active interval handles
- `.pausedIntervals` {Record<string, {callback, interval, onError}>}

---

### `.createInterval(options): string`

- `options.id` {string} [auto-generated] — timer ID
- `options.callback` {() => void} **required**
- `options.interval` {number} **required** — milliseconds between ticks
- `options.refresh` {boolean} [true] — if true and ID exists, clears old interval first; if false and ID exists, is a no-op
- `options.onError` {(error: Error, timerId: string) => void} [undefined] — overrides global onError for this timer
- returns: `string` (timerId)
- throws: `Error` — when `callback` is not a function

---

### `.createTimeout(options): string`

- `options.id` {string} [auto-generated] — timer ID
- `options.callback` {() => void} **required**
- `options.timeout` {number} **required** — delay in milliseconds
- `options.refresh` {boolean} [true] — if true and ID exists, clears old timeout first
- `options.onError` {(error: Error, timerId: string) => void} [undefined] — overrides global onError for this timer
- returns: `string` (timerId)
- throws: `Error` — when `callback` is not a function

---

### `.clearInterval(id): void`

- `id` {string} — timer ID to clear
- removes interval handle AND any saved pause metadata for this ID
- no-op if ID does not exist

---

### `.clearTimeout(id): void`

- `id` {string} — timer ID to clear
- no-op if ID does not exist

---

### `.pauseInterval(id): void`

- `id` {string} — timer ID
- stops the interval tick; saves `{callback, interval, onError}` in `.pausedIntervals[id]`
- does NOT remove from `.intervals` until explicitly cleared

---

### `.resumeInterval(id, callback?, interval?): void`

- `id` {string} — timer ID of a previously paused interval
- `callback` {() => void} [stored value] — override the saved callback
- `interval` {number} [stored value] — override the saved interval duration
- restores the interval using saved or overridden values

---

### `.clearAll(): void`

- clears all active intervals and timeouts on this instance
- does not reset `.id` or `onError`

## Usage Patterns

### Basic interval

```js
import TimerManager from 'imagic-timer'

const timers = new TimerManager({ id: 'worker' })

timers.createInterval({
    id: 'poll',
    interval: 3000,
    callback: () => fetchData(),
})
```

### Global error handler (prevents crashes)

```js
const timers = new TimerManager({
    onError: (error, id) => logger.error({ timerId: id, err: error }),
})
```

### Debounce-style refresh with same ID

```js
// Each call resets the timeout; only the last one fires
function scheduleFlush() {
    timers.createTimeout({
        id: 'flush',
        timeout: 200,
        callback: flush,
        refresh: true, // default — clears previous before creating
    })
}
```

### Pause/resume without re-passing args

```js
timers.createInterval({ id: 'sync', interval: 5000, callback: syncNow })

// Pause when offline
timers.pauseInterval('sync')

// Resume later — no need to re-pass callback or interval
timers.resumeInterval('sync')

// Or resume with a different interval
timers.resumeInterval('sync', undefined, 10000)
```

### Prevent duplicate timers (refresh: false)

```js
// Calling multiple times will not reset the timer
timers.createInterval({
    id: 'singleton',
    interval: 1000,
    callback: tick,
    refresh: false,
})
```

### Graceful shutdown

```js
process.on('SIGTERM', () => {
    timers.clearAll()
    process.exit(0)
})
```

## Constraints / Gotchas

- **Callback errors auto-clear intervals.** If a callback throws, the interval stops permanently. If you need to retry, recreate the interval in the error handler.
- **Timeouts do not need manual clear on error.** They fire once and are gone. Only intervals are auto-cleared after a callback failure.
- **`pauseInterval` does not remove from `.intervals`.** The handle is cleared, but metadata is stored in `.pausedIntervals`. Call `clearInterval` to fully remove.
- **`resumeInterval` requires a prior `pauseInterval`.** If no paused state exists for the ID, the behavior is undefined.
- **`refresh: false` is a strict no-op.** If the ID exists and `refresh` is `false`, the existing timer is untouched and the existing ID is returned. No new timer is created.
- **Auto-generated IDs are not predictable.** Store the returned string if you need to reference the timer later.
- **`clearAll` does not destroy the instance.** The instance is reusable after `clearAll`.
- **No persistence.** All state is in memory. Restarting the process loses all timer state.
