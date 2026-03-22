# imagic-timer

> Manage named intervals and timeouts with pause/resume, error isolation, and automatic cleanup.

## Install

```bash
npm install imagic-timer
```

## Quick Start

```js
import TimerManager from 'imagic-timer'

const timers = new TimerManager({
    id: 'app',
    onError: (error, timerId) => console.error(`Timer "${timerId}" failed:`, error.message),
})

timers.createInterval({
    id: 'heartbeat',
    interval: 5000,
    callback: () => console.log('ping'),
})

// Pause and resume without losing configuration
timers.pauseInterval('heartbeat')
timers.resumeInterval('heartbeat')

// Shutdown
timers.clearAll()
```

## API

### `new TimerManager(options?)`

Creates a timer manager instance.

```ts
new TimerManager(options?: {
    id?: string
    onError?: (error: Error, timerId: string) => void
})
```

| Option | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated 8-char alphanumeric | Instance identifier |
| `onError` | `(error, timerId) => void` | — | Global error handler, called when any callback throws |

**Properties available after construction:**

| Property | Type | Description |
|---|---|---|
| `.id` | `string` | Instance identifier |
| `.timeouts` | `Record<string, Timeout>` | Active timeout handles keyed by timer ID |
| `.intervals` | `Record<string, Timeout>` | Active interval handles keyed by timer ID |
| `.pausedIntervals` | `Record<string, object>` | Saved metadata for paused intervals |

---

### `createInterval(options): string`

Creates a named repeating interval. Returns the `timerId`.

```ts
createInterval(options: {
    id?: string
    callback: () => void
    interval: number
    refresh?: boolean
    onError?: (error: Error, timerId: string) => void
}): string
```

| Option | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Timer identifier |
| `callback` | `() => void` | required | Function called on each tick |
| `interval` | `number` | required | Tick period in milliseconds |
| `refresh` | `boolean` | `true` | If `true` and the ID already exists, clear the old interval before creating a new one. If `false` and the ID exists, do nothing and return the existing ID |
| `onError` | `(error, timerId) => void` | — | Per-timer error handler; overrides the global `onError` |

Throws `Error` if `callback` is not a function.

When the callback throws at runtime, the error handler is invoked and the interval is **automatically cleared**.

---

### `createTimeout(options): string`

Creates a named one-shot timeout. Returns the `timerId`.

```ts
createTimeout(options: {
    id?: string
    callback: () => void
    timeout: number
    refresh?: boolean
    onError?: (error: Error, timerId: string) => void
}): string
```

| Option | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | auto-generated | Timer identifier |
| `callback` | `() => void` | required | Function called after the delay |
| `timeout` | `number` | required | Delay in milliseconds |
| `refresh` | `boolean` | `true` | If `true` and the ID exists, clear the old timeout before creating a new one |
| `onError` | `(error, timerId) => void` | — | Per-timer error handler |

Throws `Error` if `callback` is not a function.

When the callback throws, the error handler is invoked. Timeouts self-destruct after firing — no manual cleanup is required.

---

### `clearInterval(id): void`

Clears an active interval and removes all associated metadata (including any saved pause state).

```ts
clearInterval(id: string): void
```

---

### `clearTimeout(id): void`

Clears an active timeout and removes it from internal state.

```ts
clearTimeout(id: string): void
```

---

### `pauseInterval(id): void`

Stops an interval tick without discarding its configuration. The callback, interval duration, and per-timer error handler are saved internally so `resumeInterval()` can restore everything without arguments.

```ts
pauseInterval(id: string): void
```

---

### `resumeInterval(id, callback?, interval?): void`

Restores a previously paused interval. The optional `callback` and `interval` arguments override the saved values; if omitted, the values from the time of pause are used.

```ts
resumeInterval(
    id: string,
    callback?: () => void,
    interval?: number
): void
```

---

### `clearAll(): void`

Clears every active interval and timeout managed by this instance.

```ts
clearAll(): void
```

## Error Handling

Errors inside callbacks are caught and routed through `_safeCallback`:

1. The per-timer `onError` handler fires if one was provided to `createInterval` / `createTimeout`.
2. If no per-timer handler exists, the global `onError` from the constructor is called.
3. If neither handler is set, the error is silently discarded — the process does not crash.
4. For intervals: the interval is **automatically cleared** after the error. It will not tick again.
5. For timeouts: no extra action is taken — they fire once and are already gone.

```js
const timers = new TimerManager({
    onError: (error, id) => console.error(`[global] timer "${id}":`, error.message),
})

// Per-timer handler overrides global for this specific timer:
timers.createInterval({
    id: 'db-poll',
    interval: 2000,
    callback: () => {
        throw new Error('connection lost')
    },
    onError: (error, id) => {
        console.warn(`[db-poll] suppressed — will not retry:`, error.message)
        // interval is already cleared at this point
    },
})
```

## Examples

See [`examples/`](./examples/) for runnable scripts.

## License

MIT
