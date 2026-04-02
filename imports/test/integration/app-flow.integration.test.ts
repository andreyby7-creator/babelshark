/**
 * @file Интеграционный сценарий (Vitest + jsdom), без реального Meteor и MySQL.
 *
 * @remarks
 * - Цепочка: **Minimongo (стаб)** → `renderTable` → `Tracker.autorun` → DOM → `initObserver` →
 *   debounce → `Meteor.call('translatePosition')` → обновление текста в `.__t`.
 * - Реактивность «после UPDATE в MySQL» имитируется: `setStubData` + **`flushTrackerAutorunsForTests`**
 *   (стаб `meteor/tracker` повторно прогоняет `autorun`, как инвалидация курсора).
 * - Полный E2E с **живой БД** остаётся ручной проверкой / отдельным инструментом (см. `docs/roadmap.md` фаза 9).
 *
 * Важно: после `vi.resetModules()` нельзя вызывать `setStubData` из статического импорта — поднимется
 * другой экземпляр стаба, чем у `import('/imports/ui/table')`. Хелперы грузим **динамически** после `resetModules`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CustomerRow } from '/imports/api/collections';

describe('Integration: stub Minimongo → table → MutationObserver → translatePosition', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('рендерит строки из fetch, переводит .__t, кэш по source, debounce; обновляет ячейку после смены данных', async () => {
    vi.resetModules();

    const ru = new Map<string, string>([
      ['officer', 'Офицер'],
      ['manager', 'Менеджер'],
      ['operator', 'Оператор'],
    ]);

    const call = vi.fn(
      (_method: string, source: string, cb: (err: unknown, translated: string) => void) => {
        const t = ru.get(source) ?? source;
        cb(null, t);
      },
    );

    vi.doMock('meteor/meteor', () => ({
      Meteor: {
        startup: (cb: () => void) => {
          cb();
        },
        subscribe: () => ({
          ready: () => true,
          stop: () => undefined,
        }),
        call,
      },
    }));

    const { resetStubData, setStubData } = await import('/imports/test/stubs/meteor-mongo');
    const {
      flushTrackerAutorunsForTests,
      resetTrackerAutorunRegistryForTests,
    } = await import('/imports/test/stubs/meteor-tracker');

    resetStubData();
    resetTrackerAutorunRegistryForTests();

    const seed: CustomerRow[] = [
      { _id: '1', id: 1, full_name: 'Dino Fabrello', position: 'officer' },
      { _id: '2', id: 2, full_name: 'Walter Marangoni', position: 'manager' },
      { _id: '3', id: 3, full_name: 'Angelo Ottogialli', position: 'operator' },
    ];
    setStubData(seed);

    const { renderTable } = await import('/imports/ui/table');
    const { initObserver } = await import('/imports/observer/mutationObserver');

    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    renderTable();
    initObserver();
    // Первичная вставка tbody могла произойти до подключения observer — повторный прогон autorun даёт мутации.
    flushTrackerAutorunsForTests();

    await Promise.resolve();
    vi.advanceTimersByTime(250);

    const cells = document.querySelectorAll<HTMLTableCellElement>('td.__t');
    expect(cells.length).toBe(3);
    expect(call).toHaveBeenCalledTimes(3);
    expect(cells[0]?.textContent).toBe('Офицер');
    expect(cells[1]?.textContent).toBe('Менеджер');
    expect(cells[2]?.textContent).toBe('Оператор');

    const callsAfterFirstBatch = call.mock.calls.length;

    // Кэш: тот же source — без нового Meteor.call
    const dup: CustomerRow[] = [
      ...seed,
      { _id: '4', id: 4, full_name: 'Test', position: 'officer' },
    ];
    setStubData(dup);
    flushTrackerAutorunsForTests();
    await Promise.resolve();
    vi.advanceTimersByTime(250);

    expect(document.querySelectorAll('td.__t').length).toBe(4);
    expect(call.mock.calls.length).toBe(callsAfterFirstBatch);

    // «UPDATE в MySQL»: меняем должность у второй строки → новый source → новый вызов
    const updated: CustomerRow[] = [
      seed[0]!,
      { ...seed[1]!, position: 'officer' },
      seed[2]!,
    ];
    setStubData(updated);
    flushTrackerAutorunsForTests();
    await Promise.resolve();
    vi.advanceTimersByTime(250);

    const cells2 = document.querySelectorAll<HTMLTableCellElement>('td.__t');
    expect(cells2[1]?.textContent).toBe('Офицер');
    expect(call.mock.calls.length).toBe(callsAfterFirstBatch);

    // Debounce: несколько мутаций подряд — одна пачка (см. unit mutationObserver.test.ts)
    const tbody = document.querySelector('#tbody');
    expect(tbody).toBeTruthy();
    for (let i = 0; i < 5; i++) {
      const tr = document.createElement('tr');
      const tdId = document.createElement('td');
      tdId.textContent = '99';
      const tdName = document.createElement('td');
      tdName.textContent = 'X';
      const tdPos = document.createElement('td');
      tdPos.className = '__t';
      tdPos.textContent = 'manager';
      tr.append(tdId, tdName, tdPos);
      tbody!.append(tr);
    }
    await Promise.resolve();
    vi.advanceTimersByTime(250);
    const callsAfterBurst = call.mock.calls.length - callsAfterFirstBatch;
    expect(callsAfterBurst).toBeLessThanOrEqual(2);
  });
});

/**
 * Эти сценарии нужны, чтобы при `vitest run --coverage imports/test/integration/...`
 * покрытие совпадало с полным прогоном: unit-тесты в этом запуске не выполняются.
 */
describe('Integration: ветки для покрытия при изолированном integration-run', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('стаб meteor-mongo: find().fetch() при пустом буфере и после setStubData', async () => {
    const { resetStubData, setStubData, Mongo } = await import(
      '/imports/test/stubs/meteor-mongo'
    );
    resetStubData();
    const col = new Mongo.Collection<Record<string, unknown>>('t');
    expect(col.find().fetch()).toEqual([]);
    setStubData([{ x: 1 }]);
    expect(col.find().fetch()).toEqual([{ x: 1 }]);
  });

  it('стаб meteor/tracker: resetQueue, getOrder, stop', async () => {
    const {
      resetTrackerStubAutorunQueue,
      resetTrackerAutorunRegistryForTests,
      getTrackerStubAutorunInvocationOrder,
      Tracker,
    } = await import('/imports/test/stubs/meteor-tracker');
    resetTrackerAutorunRegistryForTests();
    resetTrackerStubAutorunQueue();
    const handle = Tracker.autorun(() => {
      void 0;
    });
    expect(getTrackerStubAutorunInvocationOrder()).toEqual([1]);
    handle.stop();
  });

  it('renderTable: без #app — исключение', async () => {
    document.body.innerHTML = '';
    vi.resetModules();
    vi.doMock('meteor/meteor', () => ({
      Meteor: {
        startup: (cb: () => void) => {
          cb();
        },
        subscribe: () => ({
          ready: () => true,
          stop: () => undefined,
        }),
        call: vi.fn(),
      },
    }));
    const { renderTable } = await import('/imports/ui/table');
    expect(() => {
      renderTable();
    }).toThrow('renderTable: #app not found');
  });

  it('initObserver: добавленный узел сам .__t (ветка node.matches)', async () => {
    vi.resetModules();
    const call = vi.fn(
      (_n: string, _s: string, cb: (err: unknown, translated: string) => void) => {
        cb(null, 'ok');
      },
    );
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const direct = document.createElement('span');
    direct.className = '__t';
    direct.textContent = 'Developer';
    root.append(direct);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('initObserver: ошибка translatePosition (console.error)', async () => {
    vi.resetModules();
    let lastCb: ((err: unknown, translated: string) => void) | undefined;
    const call = vi.fn(
      (
        _name: string,
        _source: string,
        cb: (err: unknown, translated: string) => void,
      ) => {
        lastCb = cb;
      },
    );
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const el = document.createElement('span');
    el.className = '__t';
    el.textContent = 'Developer';
    root.append(el);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).toHaveBeenCalledTimes(1);
    lastCb?.(new Error('boom'), '');
    expect(errSpy).toHaveBeenCalledWith('Translation error', expect.any(Error));
  });

  it('initObserver: characterData на родителе .__t', async () => {
    vi.resetModules();
    const call = vi.fn(
      (_n: string, _s: string, cb: (err: unknown, translated: string) => void) => {
        cb(null, 'Готово');
      },
    );
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const app = document.createElement('div');
    app.id = 'app';
    document.body.append(app);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const el = document.createElement('span');
    el.className = '__t';
    el.append(document.createTextNode('x'));
    app.append(el);

    await Promise.resolve();
    el.firstChild!.textContent = 'New';

    await Promise.resolve();
    vi.advanceTimersByTime(250);

    expect(call).toHaveBeenCalled();
    expect(el.textContent).toBe('Готово');
  });

  it('initObserver: пропуск при data-original и тексте, отличном от оригинала', async () => {
    vi.resetModules();
    const call = vi.fn();
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const stale = document.createElement('span');
    stale.className = '__t';
    stale.setAttribute('data-original', 'developer');
    stale.textContent = 'перевод';
    root.append(stale);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).not.toHaveBeenCalled();
  });

  it('initObserver: без корня — ранний выход', async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    const call = vi.fn();
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    expect(log).not.toHaveBeenCalled();
    expect(call).not.toHaveBeenCalled();
  });

  it('initObserver: пустой ответ перевода — fallback на original (ветка translated || original)', async () => {
    vi.resetModules();
    const call = vi.fn(
      (_n: string, _s: string, cb: (err: unknown, translated: string) => void) => {
        cb(null, '');
      },
    );
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const el = document.createElement('span');
    el.className = '__t';
    el.textContent = 'Developer';
    root.append(el);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(el.textContent).toBe('developer');
  });

  it('initObserver: race-guard — не перезаписывать DOM при смене data-original до ответа', async () => {
    vi.resetModules();
    let pendingCb: ((err: unknown, translated: string) => void) | undefined;
    const call = vi.fn(
      (
        _name: string,
        _source: string,
        cb: (err: unknown, translated: string) => void,
      ) => {
        pendingCb = cb;
      },
    );
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const el = document.createElement('span');
    el.className = '__t';
    el.textContent = 'Developer';
    root.append(el);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(pendingCb).toBeTypeOf('function');

    el.setAttribute('data-original', 'other');
    pendingCb!(null, 'Перевод');

    expect(el.textContent).not.toBe('Перевод');
  });

  it('initObserver: characterData — parent не .__t (ветка parent?.matches false)', async () => {
    vi.resetModules();
    const call = vi.fn();
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const plain = document.createElement('div');
    plain.append(document.createTextNode('a'));
    root.append(plain);

    await Promise.resolve();
    plain.firstChild!.textContent = 'b';

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).not.toHaveBeenCalled();
  });

  it('initObserver: lock data-translating=1 — пропуск (стр. lock)', async () => {
    vi.resetModules();
    const call = vi.fn();
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const locked = document.createElement('span');
    locked.className = '__t';
    locked.setAttribute('data-translating', '1');
    locked.textContent = 'Developer';
    root.append(locked);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).not.toHaveBeenCalled();
  });

  it('initObserver: пустой текст после trim — пропуск', async () => {
    vi.resetModules();
    const call = vi.fn();
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const empty = document.createElement('span');
    empty.className = '__t';
    empty.textContent = '   ';
    root.append(empty);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).not.toHaveBeenCalled();
  });

  it('initObserver: кэш — обновить DOM если текст ещё не совпадает с кэшем', async () => {
    vi.resetModules();
    const call = vi.fn(
      (_n: string, _s: string, cb: (err: unknown, translated: string) => void) => {
        cb(null, 'Перевод');
      },
    );
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const first = document.createElement('span');
    first.className = '__t';
    first.textContent = 'Developer';
    root.append(first);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).toHaveBeenCalledTimes(1);

    const second = document.createElement('span');
    second.className = '__t';
    second.textContent = 'developer';
    root.append(second);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).toHaveBeenCalledTimes(1);
    expect(second.textContent).toBe('Перевод');
  });

  it('initObserver: кэш — без перезаписи DOM если текст уже равен кэшу (ветка textContent === cached)', async () => {
    vi.resetModules();
    const call = vi.fn(
      (_n: string, _s: string, cb: (err: unknown, translated: string) => void) => {
        cb(null, '');
      },
    );
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const first = document.createElement('span');
    first.className = '__t';
    first.textContent = 'Developer';
    root.append(first);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).toHaveBeenCalledTimes(1);

    const second = document.createElement('span');
    second.className = '__t';
    second.textContent = 'developer';
    root.append(second);

    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).toHaveBeenCalledTimes(1);
    expect(second.textContent).toBe('developer');
  });
});
