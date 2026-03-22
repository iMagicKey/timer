// examples/basic.js
import TimerManager from '../src/index.js'

const timer = new TimerManager({
    id: 'main',
    onError: (err, timerId) => {
        console.error(`Error in timer ${timerId}:`, err.message)
    },
})

let count = 0
const intervalId = timer.createInterval({
    id: 'counter',
    callback: () => {
        count++
        console.log('Count:', count)
        if (count === 3) {
            console.log('Pausing...')
            timer.pauseInterval(intervalId)
            setTimeout(() => {
                console.log('Resuming...')
                timer.resumeInterval(intervalId)
            }, 1000)
        }
        if (count === 6) {
            console.log('Done, clearing all timers')
            timer.clearAll()
        }
    },
    interval: 200,
})

timer.createTimeout({
    id: 'greeting',
    callback: () => console.log('Timeout fired after 100ms'),
    timeout: 100,
})
