import { describe, it } from 'node:test'
import { expect } from 'chai'
import TimerManager from '../src/index.js'

describe('TimerManager', () => {
    describe('constructor', () => {
        it('generates unique id if not provided', () => {
            const t1 = new TimerManager()
            const t2 = new TimerManager()
            expect(t1.id).to.be.a('string')
            expect(t1.id).to.not.equal(t2.id)
        })
        it('uses provided id', () => {
            const t = new TimerManager({ id: 'myTimer' })
            expect(t.id).to.equal('myTimer')
        })
        it('starts with empty collections', () => {
            const t = new TimerManager()
            expect(Object.keys(t.timeouts)).to.have.length(0)
            expect(Object.keys(t.intervals)).to.have.length(0)
            expect(Object.keys(t.pausedIntervals)).to.have.length(0)
        })
        it('accepts custom onError handler', async () => {
            let caught = null
            const t = new TimerManager({ onError: (err) => { caught = err } })
            t.createTimeout({ callback: () => { throw new Error('x') }, timeout: 10 })
            await new Promise((r) => setTimeout(r, 30))
            expect(caught).to.be.instanceOf(Error)
            expect(caught.message).to.equal('x')
        })
    })

    describe('createInterval', () => {
        it('returns a string id', () => {
            const t = new TimerManager()
            const id = t.createInterval({ callback: () => {}, interval: 100 })
            expect(id).to.be.a('string')
            t.clearInterval(id)
        })
        it('uses provided id', () => {
            const t = new TimerManager()
            const id = t.createInterval({ id: 'fixed', callback: () => {}, interval: 100 })
            expect(id).to.equal('fixed')
            t.clearInterval(id)
        })
        it('runs callback on interval', async () => {
            const t = new TimerManager()
            let count = 0
            const id = t.createInterval({ callback: () => count++, interval: 10 })
            await new Promise((r) => setTimeout(r, 35))
            t.clearInterval(id)
            expect(count).to.be.greaterThanOrEqual(2)
        })
        it('throws if callback is not a function', () => {
            const t = new TimerManager()
            expect(() => t.createInterval({ callback: 'not a fn', interval: 100 })).to.throw()
        })
        it('refresh=true clears existing interval and creates new one', async () => {
            const t = new TimerManager()
            let count = 0
            const id = t.createInterval({ id: 'test', callback: () => count++, interval: 100 })
            const id2 = t.createInterval({ id: 'test', callback: () => (count += 10), interval: 10, refresh: true })
            expect(id).to.equal(id2)
            await new Promise((r) => setTimeout(r, 25))
            t.clearInterval(id)
            expect(count).to.be.greaterThanOrEqual(10)
        })
        it('refresh=false does not replace existing interval', async () => {
            const t = new TimerManager()
            let count = 0
            t.createInterval({ id: 'noref', callback: () => count++, interval: 10 })
            t.createInterval({ id: 'noref', callback: () => (count += 100), interval: 10, refresh: false })
            await new Promise((r) => setTimeout(r, 25))
            t.clearInterval('noref')
            expect(count).to.be.lessThan(100)
        })
        it('per-timer onError overrides globalOnError', async () => {
            let globalCalled = false
            let localCalled = false
            const t = new TimerManager({ onError: () => { globalCalled = true } })
            t.createTimeout({
                callback: () => { throw new Error('local') },
                timeout: 10,
                onError: () => { localCalled = true },
            })
            await new Promise((r) => setTimeout(r, 30))
            expect(localCalled).to.be.true
            expect(globalCalled).to.be.false
        })
        it('auto-clears interval after callback throws', async () => {
            const t = new TimerManager({ onError: () => {} })
            let count = 0
            const id = t.createInterval({
                id: 'autoclr',
                callback: () => {
                    count++
                    throw new Error('fail')
                },
                interval: 10,
            })
            await new Promise((r) => setTimeout(r, 50))
            expect(t.intervals[id]).to.be.undefined
            expect(count).to.equal(1)
        })
    })

    describe('createTimeout', () => {
        it('runs callback after timeout', async () => {
            const t = new TimerManager()
            let ran = false
            t.createTimeout({ callback: () => { ran = true }, timeout: 20 })
            await new Promise((r) => setTimeout(r, 40))
            expect(ran).to.be.true
        })
        it('throws if callback is not a function', () => {
            const t = new TimerManager()
            expect(() => t.createTimeout({ callback: null, timeout: 100 })).to.throw()
        })
        it('returns a string id', () => {
            const t = new TimerManager()
            const id = t.createTimeout({ callback: () => {}, timeout: 1000 })
            expect(id).to.be.a('string')
            t.clearTimeout(id)
        })
        it('refresh=true replaces existing timeout', async () => {
            const t = new TimerManager()
            let ran1 = false
            let ran2 = false
            t.createTimeout({ id: 'to', callback: () => { ran1 = true }, timeout: 100 })
            t.createTimeout({ id: 'to', callback: () => { ran2 = true }, timeout: 20, refresh: true })
            await new Promise((r) => setTimeout(r, 40))
            expect(ran1).to.be.false
            expect(ran2).to.be.true
        })
    })

    describe('createTimeout — self-cleanup', () => {
        it('removes timeout entry from map after callback fires', async () => {
            const t = new TimerManager()
            const id = t.createTimeout({ callback: () => {}, timeout: 20 })
            expect(t.timeouts[id]).to.exist
            await new Promise((r) => setTimeout(r, 40))
            expect(t.timeouts[id]).to.be.undefined
        })

        it('map is empty after multiple timeouts fire', async () => {
            const t = new TimerManager()
            const id1 = t.createTimeout({ callback: () => {}, timeout: 10 })
            const id2 = t.createTimeout({ callback: () => {}, timeout: 15 })
            await new Promise((r) => setTimeout(r, 40))
            expect(t.timeouts[id1]).to.be.undefined
            expect(t.timeouts[id2]).to.be.undefined
            expect(Object.keys(t.timeouts)).to.have.length(0)
        })
    })

    describe('clearTimeout', () => {
        it('prevents callback from running', async () => {
            const t = new TimerManager()
            let ran = false
            const id = t.createTimeout({ callback: () => { ran = true }, timeout: 30 })
            t.clearTimeout(id)
            await new Promise((r) => setTimeout(r, 50))
            expect(ran).to.be.false
        })
        it('no-ops on unknown id', () => {
            const t = new TimerManager()
            expect(() => t.clearTimeout('nonexistent')).to.not.throw()
        })
    })

    describe('clearInterval', () => {
        it('stops interval from firing', async () => {
            const t = new TimerManager()
            let count = 0
            const id = t.createInterval({ callback: () => count++, interval: 10 })
            await new Promise((r) => setTimeout(r, 25))
            t.clearInterval(id)
            const countAtClear = count
            await new Promise((r) => setTimeout(r, 25))
            expect(count).to.equal(countAtClear)
        })
        it('no-ops on unknown id', () => {
            const t = new TimerManager()
            expect(() => t.clearInterval('nonexistent')).to.not.throw()
        })
    })

    describe('pauseInterval / resumeInterval', () => {
        it('pauses and resumes without re-passing callback', async () => {
            const t = new TimerManager()
            let count = 0
            const id = t.createInterval({ id: 'resumeTest', callback: () => count++, interval: 10 })
            await new Promise((r) => setTimeout(r, 25))
            t.pauseInterval(id)
            const countAtPause = count
            await new Promise((r) => setTimeout(r, 30))
            expect(count).to.equal(countAtPause)
            t.resumeInterval(id)
            await new Promise((r) => setTimeout(r, 25))
            t.clearInterval(id)
            expect(count).to.be.greaterThan(countAtPause)
        })
        it('resumeInterval with callback override uses new callback', async () => {
            const t = new TimerManager()
            let originalRan = 0
            let overrideRan = 0
            const id = t.createInterval({ id: 'ovr', callback: () => originalRan++, interval: 10 })
            await new Promise((r) => setTimeout(r, 15))
            t.pauseInterval(id)
            t.resumeInterval(id, () => overrideRan++)
            await new Promise((r) => setTimeout(r, 25))
            t.clearInterval(id)
            expect(overrideRan).to.be.greaterThanOrEqual(1)
        })
        it('resumeInterval with interval override uses new interval', async () => {
            const t = new TimerManager()
            let count = 0
            const id = t.createInterval({ id: 'ivl', callback: () => count++, interval: 500 })
            t.pauseInterval(id)
            t.resumeInterval(id, undefined, 10)
            await new Promise((r) => setTimeout(r, 35))
            t.clearInterval(id)
            expect(count).to.be.greaterThanOrEqual(2)
        })
        it('pause moves to pausedIntervals, removes from intervals', () => {
            const t = new TimerManager()
            const id = t.createInterval({ id: 'p', callback: () => {}, interval: 1000 })
            expect(t.intervals[id]).to.exist
            t.pauseInterval(id)
            expect(t.intervals[id]).to.be.undefined
            expect(t.pausedIntervals[id]).to.exist
        })
        it('resume clears pausedIntervals entry, restores to intervals', () => {
            const t = new TimerManager()
            const id = t.createInterval({ id: 'r', callback: () => {}, interval: 1000 })
            t.pauseInterval(id)
            t.resumeInterval(id)
            expect(t.pausedIntervals[id]).to.be.undefined
            expect(t.intervals[id]).to.exist
            t.clearInterval(id)
        })
        it('no-ops pause on unknown id', () => {
            const t = new TimerManager()
            expect(() => t.pauseInterval('none')).to.not.throw()
        })
    })

    describe('clearAll', () => {
        it('clears all intervals and timeouts simultaneously', async () => {
            const t = new TimerManager()
            let intervalRan = 0
            let timeoutRan = false
            t.createInterval({ id: 'i1', callback: () => intervalRan++, interval: 10 })
            t.createInterval({ id: 'i2', callback: () => intervalRan++, interval: 10 })
            t.createTimeout({ id: 't1', callback: () => { timeoutRan = true }, timeout: 50 })
            t.clearAll()
            await new Promise((r) => setTimeout(r, 70))
            expect(intervalRan).to.equal(0)
            expect(timeoutRan).to.be.false
        })
        it('collections are empty after clearAll', () => {
            const t = new TimerManager()
            t.createInterval({ id: 'x', callback: () => {}, interval: 1000 })
            t.createTimeout({ id: 'y', callback: () => {}, timeout: 1000 })
            t.clearAll()
            expect(Object.keys(t.intervals)).to.have.length(0)
            expect(Object.keys(t.timeouts)).to.have.length(0)
        })
    })

    describe('error handling', () => {
        it('globalOnError called with error and timerId for interval', async () => {
            let caught = { err: null, id: null }
            const t = new TimerManager({ onError: (err, id) => { caught = { err, id } } })
            t.createInterval({ id: 'errId', callback: () => { throw new Error('interval fail') }, interval: 10 })
            await new Promise((r) => setTimeout(r, 30))
            expect(caught.err).to.be.instanceOf(Error)
            expect(caught.id).to.equal('errId')
        })
        it('globalOnError called for timeout', async () => {
            let errorCaught = null
            const t = new TimerManager({ onError: (err) => { errorCaught = err } })
            t.createTimeout({ callback: () => { throw new Error('test error') }, timeout: 10 })
            await new Promise((r) => setTimeout(r, 30))
            expect(errorCaught).to.be.instanceOf(Error)
        })
        it('interval auto-cleared after throw, runs exactly once', async () => {
            const t = new TimerManager({ onError: () => {} })
            let count = 0
            const id = t.createInterval({
                id: 'auto',
                callback: () => {
                    count++
                    throw new Error('once')
                },
                interval: 10,
            })
            await new Promise((r) => setTimeout(r, 50))
            expect(t.intervals[id]).to.be.undefined
            expect(count).to.equal(1)
        })
    })
})
