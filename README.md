# imagic-timer

A minimalist and robust timer management library for JavaScript.

Provides safe creation, pausing, resuming, and clearing of intervals and timeouts with automatic unique ID generation and error handling.

---

## Features

-   Create and manage multiple intervals and timeouts by unique IDs

-   Automatic unique ID generation if not specified

-   Pause and resume intervals

-   Global and per-timer error handling

-   Safe callbacks with error catching to prevent crashes

-   Simple and clean API

---

## Installation

```bash

npm install imagic-timer

```

---

## Usage

## Creating a TimerManager instance

```js
import TimerManager from 'imagic-timer' // or from your local path

const timerManager = new TimerManager({
    id: 'mainTimers', // optional instance ID for logging

    onError: (error, id) => {
        console.error(`Error in timer \${id}:`, error)
    },
})
```

---

## Creating and managing intervals

```js
const intervalId = timerManager.createInterval({
    id: 'heartbeat', // optional timer ID; auto-generated if omitted

    callback: () => {
        console.log('Heartbeat interval tick')
    },

    interval: 1000, // milliseconds

    refresh: true, // default true; clears existing interval with same ID before creating

    onError: (error, id) => {
        console.error(`Error in heartbeat interval \${id}:`, error)
    },
})
```

---

## Creating and managing timeouts

```js
const timeoutId = timerManager.createTimeout({
    id: 'timeoutExample',

    callback: () => {
        console.log('Timeout finished')
    },

    timeout: 3000,

    refresh: true, // default true; clears existing timeout with same ID before creating

    onError: (error, id) => {
        console.error(`Error in timeout \${id}:`, error)
    },
})
```

---

## Clearing timers

```js
timerManager.clearInterval('heartbeat')

timerManager.clearTimeout('timeoutExample')
```

---

## Pausing and resuming intervals

```js
timerManager.pauseInterval('heartbeat')

// Resume later, providing callback and interval again:

timerManager.resumeInterval(
    'heartbeat',

    () => {
        console.log('Heartbeat resumed')
    },

    1000
)
```

---

## Clearing all timers

```js
timerManager.clearAll()
```

---

## License

MIT
