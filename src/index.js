/* eslint-disable no-underscore-dangle */

function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i += 1) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

export default class TimerManager {
    /**
     * @param {Object} options
     * @param {string} [options.id] - Optional ID of this TimerManager instance
     * @param {function} [options.onError] - Global error handler function(error, timerId)
     */
    constructor({ id, onError } = {}) {
        this.id = id || generateRandomId()
        this.timeouts = {}
        this.intervals = {}
        this.pausedIntervals = {}

        if (typeof onError === 'function') {
            this.globalOnError = onError
        } else {
            this.globalOnError = (error, timerId) => {
                console.error(`TimerManager(${this.id}): Error in timer "${timerId}":`, error)
            }
        }
    }

    _safeCallback(callback, timerId, onError) {
        return () => {
            try {
                callback()
            } catch (error) {
                if (typeof onError === 'function') {
                    onError(error, timerId)
                } else {
                    this.globalOnError(error, timerId)
                }
                this.clearInterval(timerId)
                this.clearTimeout(timerId)
            }
        }
    }

    /**
     * Create or refresh an interval timer.
     * @param {Object} options
     * @param {string} [options.id] - Unique timer ID. If omitted, generated automatically.
     * @param {function} options.callback - Callback function to run on interval.
     * @param {number} options.interval - Interval duration in milliseconds.
     * @param {boolean} [options.refresh=true] - If true, clear existing interval with same ID before creating new.
     * @param {function} [options.onError] - Individual error handler for this timer.
     * @returns {string} - The timer ID used.
     */
    createInterval({ id, callback, interval, refresh = true, onError }) {
        const timerId = id || generateRandomId()
        if (typeof callback !== 'function') {
            throw new Error(`TimerManager(${this.id}): callback for interval "${timerId}" must be a function.`)
        }

        if (refresh && this.intervals[timerId]) {
            this.clearInterval(timerId)
        }

        if (!this.intervals[timerId]) {
            this.intervals[timerId] = setInterval(this._safeCallback(callback, timerId, onError), interval)
        }
        return timerId
    }

    /**
     * Create or refresh a timeout timer.
     * @param {Object} options
     * @param {string} [options.id] - Unique timer ID. If omitted, generated automatically.
     * @param {function} options.callback - Callback function to run after timeout.
     * @param {number} options.timeout - Timeout duration in milliseconds.
     * @param {boolean} [options.refresh=true] - If true, clear existing timeout with same ID before creating new.
     * @param {function} [options.onError] - Individual error handler for this timer.
     * @returns {string} - The timer ID used.
     */
    createTimeout({ id, callback, timeout, refresh = true, onError }) {
        const timerId = id || generateRandomId()
        if (typeof callback !== 'function') {
            throw new Error(`TimerManager(${this.id}): callback for timeout "${timerId}" must be a function.`)
        }

        if (refresh && this.timeouts[timerId]) {
            this.clearTimeout(timerId)
        }

        if (!this.timeouts[timerId]) {
            this.timeouts[timerId] = setTimeout(this._safeCallback(callback, timerId, onError), timeout)
        }
        return timerId
    }

    clearInterval(id) {
        if (this.intervals[id]) {
            clearInterval(this.intervals[id])
            delete this.intervals[id]
        }
        if (this.pausedIntervals[id]) {
            delete this.pausedIntervals[id]
        }
    }

    clearTimeout(id) {
        if (this.timeouts[id]) {
            clearTimeout(this.timeouts[id])
            delete this.timeouts[id]
        }
    }

    pauseInterval(id) {
        if (this.intervals[id]) {
            clearInterval(this.intervals[id])
            this.pausedIntervals[id] = true
            delete this.intervals[id]
        }
    }

    resumeInterval(id, callback, interval) {
        if (this.pausedIntervals[id]) {
            this.createInterval({ id, callback, interval, refresh: false })
            delete this.pausedIntervals[id]
        }
    }

    clearAll() {
        Object.keys(this.intervals).forEach((id) => {
            this.clearInterval(id)
        })

        Object.keys(this.timeouts).forEach((id) => {
            this.clearTimeout(id)
        })
    }
}
