# UPDATE — imagic-timer

> Аудит проведён: 2026-03-22. Версия на момент аудита: 1.0.1

---

## Критические баги (исправить немедленно)

- [ ] **`pauseInterval()` теряет данные** — при паузе хранится только `true`:
  ```js
  this.pausedIntervals[id] = true  // ← теряем callback и interval
  ```
  `resumeInterval(id, callback, interval)` требует от вызывающего кода передать оригинальный `callback` и `interval` заново — что невозможно, если ссылка больше не доступна. Исправление: хранить полное состояние:
  ```js
  this.pausedIntervals[id] = { callback, interval, onError }
  ```
  И в `resumeInterval(id)` восстанавливать из сохранённого состояния без параметров.

- [ ] **`_safeCallback` вызывает оба `clear` при ошибке** — для любого типа таймера вызываются и `this.clearInterval(id)`, и `this.clearTimeout(id)`. Вызов `clearTimeout` на ID интервала (и наоборот) безвреден, но запутывает. Нужно передавать тип таймера и очищать только нужный.

---

## package.json

- [ ] Добавить `"exports"`:
  ```json
  "exports": { ".": "./src/index.js", "./package.json": "./package.json" }
  ```
- [ ] Добавить `"files": ["src", "README.md", "LICENSE"]`
- [ ] Добавить `"sideEffects": false`
- [ ] Добавить `devDependencies`:
  ```json
  "@eslint/js": "^10.0.1",
  "chai": "^5.x",
  "eslint": "^10.1.0",
  "eslint-config-prettier": "^10.1.8",
  "eslint-plugin-import": "^2.32.0",
  "eslint-plugin-n": "^17.24.0",
  "eslint-plugin-prettier": "^5.5.5",
  "eslint-plugin-promise": "^7.2.1",
  "globals": "^16.x",
  "prettier": "^3.8.1"
  ```
- [ ] Обновить `"scripts.test"`: `"node --test ./tests/**/*.test.js"`

---

## ESLint

- [ ] Создать `eslint.config.js` по стандарту (заменить текущий `.eslintrc`-файл)
- [ ] Создать `.prettierrc.json`
- [ ] Установить ESLint `^10.1.0`

---

## Тесты

Тестов нет (несмотря на подробный README). Написать `tests/timer.test.js`:

- [ ] `createInterval` создаёт интервал и возвращает ID
- [ ] `createInterval` с `refresh: true` заменяет существующий интервал с тем же ID
- [ ] `createInterval` с `refresh: false` не заменяет существующий интервал
- [ ] `clearInterval` удаляет таймер из `this.intervals`
- [ ] `createTimeout` срабатывает один раз и не остаётся в `this.timeouts`
- [ ] `pauseInterval` перемещает таймер из `intervals` в `pausedIntervals`
- [ ] `resumeInterval` воссоздаёт интервал из сохранённого состояния (после фикса)
- [ ] `clearAll` очищает все интервалы и таймауты
- [ ] Ошибка в callback вызывает `onError` и удаляет таймер
- [ ] Ошибка в callback вызывает глобальный `onError` при отсутствии per-timer handler
- [ ] Auto-генерируемые ID уникальны среди 1000 последовательных вызовов

---

## Улучшения API (minor bump)

- [ ] **`listTimers()`** — возвращает `{ intervals: [...ids], timeouts: [...ids], paused: [...ids] }` для дебага и мониторинга
- [ ] **`getStatus(id)`** — возвращает `'active' | 'paused' | 'not_found'`
- [ ] **`clearAllIntervals()`** и **`clearAllTimeouts()`** — отдельные методы вместо единственного `clearAll()`
- [ ] **Zero-dep vs imagic-utils** — `generateRandomId()` дублирует функциональность `imagic-utils`. Решение: либо задокументировать намеренное zero-dependency решение (текущая библиотека не имеет зависимостей — это достоинство), либо добавить `imagic-utils` как зависимость. Рекомендуется сохранить zero-dep и документировать это в README.

---

## Задачи (backlog)

- [ ] Cron-like scheduling (`createCron('0 * * * *', callback)`)
- [ ] Поддержка именованных групп таймеров (`clearGroup('sync')`)
- [ ] Экспорт типов для TypeScript
- [ ] Метрики: счётчик срабатываний каждого таймера
