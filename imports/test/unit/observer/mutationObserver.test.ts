import { afterEach, describe, expect, it, vi } from 'vitest';

describe('mutationObserver.ts (initObserver)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('ничего не делает, если корень приложения не найден', async () => {
    vi.resetModules();

    const call = vi.fn();
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    expect(log).not.toHaveBeenCalled();
    expect(call).not.toHaveBeenCalled();
  });

  it('переводит добавленный .__t элемент, кэширует результат и повторно не вызывает Meteor.call', async () => {
    vi.resetModules();
    vi.useFakeTimers();

    const call = vi.fn(
      (
        _name: string,
        _source: string,
        cb: (err: unknown, translated: string) => void,
      ) => {
        cb(null, 'Перевод');
      },
    );
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));

    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    expect(log).toHaveBeenCalledWith('MutationObserver initialized');

    const el1 = document.createElement('span');
    el1.className = '__t';
    el1.textContent = '  DevElOpEr  ';
    root.append(el1);

    await Promise.resolve();
    vi.advanceTimersByTime(250);

    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith(
      'translatePosition',
      'developer',
      expect.any(Function),
    );
    expect(el1.getAttribute('data-translating')).toBe('0');
    expect(el1.style.opacity).toBe('');
    expect(el1.textContent).toBe('Перевод');

    const el2 = document.createElement('span');
    el2.className = '__t';
    el2.textContent = 'developer';
    root.append(el2);

    await Promise.resolve();
    vi.advanceTimersByTime(250);

    expect(call).toHaveBeenCalledTimes(1);
    expect(el2.textContent).toBe('Перевод');
  });

  it('обрабатывает characterData мутацию (изменение текста) и переводит родителя .__t', async () => {
    vi.resetModules();
    vi.useFakeTimers();

    const call = vi.fn(
      (
        _name: string,
        _source: string,
        cb: (err: unknown, translated: string) => void,
      ) => {
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

    // addedNodes переведёт, но нас интересует ветка characterData — меняем текст
    el.firstChild!.textContent = 'New';

    await Promise.resolve();
    vi.advanceTimersByTime(250);

    expect(call).toHaveBeenCalled();
    expect(el.textContent).toBe('Готово');
  });

  it('игнорирует characterData мутацию, если родитель не .__t (ветка parent?.matches=false)', async () => {
    vi.resetModules();
    vi.useFakeTimers();

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

  it('собирает вложенные .__t из добавленного узла (querySelectorAll ветка)', async () => {
    vi.resetModules();
    vi.useFakeTimers();

    const call = vi.fn(
      (
        _name: string,
        _source: string,
        cb: (err: unknown, translated: string) => void,
      ) => {
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

    const wrapper = document.createElement('div');
    const nested = document.createElement('span');
    nested.className = '__t';
    nested.textContent = 'Developer';
    wrapper.append(nested);
    root.append(wrapper);

    await Promise.resolve();
    vi.advanceTimersByTime(250);

    expect(call).toHaveBeenCalledTimes(1);
    expect(nested.textContent).toBe('ok');
  });

  it('игнорирует элементы с lock-флагом, пустым текстом и уже переведённым значением', async () => {
    vi.resetModules();
    vi.useFakeTimers();

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

    const empty = document.createElement('span');
    empty.className = '__t';
    empty.textContent = '   ';
    root.append(empty);

    const alreadyTranslated = document.createElement('span');
    alreadyTranslated.className = '__t';
    alreadyTranslated.setAttribute('data-original', 'developer');
    alreadyTranslated.textContent = 'перевод';
    root.append(alreadyTranslated);

    await Promise.resolve();
    vi.advanceTimersByTime(250);

    expect(call).not.toHaveBeenCalled();
  });

  it('использует debounce: при частых мутациях срабатывает только последняя пачка (clearTimeout ветка)', async () => {
    vi.resetModules();
    vi.useFakeTimers();

    const call = vi.fn(
      (
        _name: string,
        _source: string,
        cb: (err: unknown, translated: string) => void,
      ) => {
        cb(null, 't');
      },
    );
    vi.doMock('meteor/meteor', () => ({ Meteor: { call } }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const root = document.createElement('div');
    root.setAttribute('data-root', 'app');
    document.body.append(root);

    const { initObserver } = await import('/imports/observer/mutationObserver');
    initObserver();

    const el1 = document.createElement('span');
    el1.className = '__t';
    el1.textContent = 'Developer';
    root.append(el1);
    await Promise.resolve();

    const el2 = document.createElement('span');
    el2.className = '__t';
    el2.textContent = 'Developer';
    root.append(el2);
    await Promise.resolve();

    vi.advanceTimersByTime(250);

    // Достаточно проверить, что debounce "схлопнул" вызовы (timer был очищен и переустановлен).
    expect(call).toHaveBeenCalledTimes(1);
    expect(el2.textContent).toBe('t');
  });

  it('логирует ошибку и не кэширует результат; race-guard предотвращает перезапись', async () => {
    vi.resetModules();
    vi.useFakeTimers();

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

    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
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
    expect(pendingCb).toBeTypeOf('function');

    // error path
    pendingCb?.(new Error('boom'), 'X');
    expect(error).toHaveBeenCalledWith('Translation error', expect.any(Error));

    // второй раз — кэша нет, снова вызовется Meteor.call
    const el2 = document.createElement('span');
    el2.className = '__t';
    el2.textContent = 'Developer';
    root.append(el2);

    pendingCb = undefined;
    expect(pendingCb).toBeUndefined();
    await Promise.resolve();
    vi.advanceTimersByTime(250);
    expect(call).toHaveBeenCalledTimes(2);

    // race-guard path: меняем original перед успешным ответом
    const el3 = document.createElement('span');
    el3.className = '__t';
    el3.textContent = 'Developer';
    root.append(el3);

    pendingCb = undefined;
    expect(pendingCb).toBeUndefined();
    await Promise.resolve();
    vi.advanceTimersByTime(250);

    expect(call).toHaveBeenCalledTimes(3);
    expect(pendingCb).toBeTypeOf('function');

    el3.setAttribute('data-original', 'other');
    pendingCb!(null, 'Перевод');

    expect(el3.getAttribute('data-translating')).toBe('0');
    expect(el3.style.opacity).toBe('');
    expect(el3.textContent).not.toBe('Перевод');
  });

  it('если перевод пустой строкой — делает fallback на original и кэширует (ветка translated || original)', async () => {
    vi.resetModules();
    vi.useFakeTimers();

    const call = vi.fn(
      (
        _name: string,
        _source: string,
        cb: (err: unknown, translated: string) => void,
      ) => {
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

    const el1 = document.createElement('span');
    el1.className = '__t';
    el1.textContent = 'Developer';
    root.append(el1);

    await Promise.resolve();
    vi.advanceTimersByTime(250);

    // fallback -> normalized original
    expect(el1.textContent).toBe('developer');

    // cache hit where cached === original and textContent already equals cached -> no rewrite branch
    const el2 = document.createElement('span');
    el2.className = '__t';
    el2.textContent = 'developer';
    root.append(el2);

    await Promise.resolve();
    vi.advanceTimersByTime(250);

    expect(call).toHaveBeenCalledTimes(1);
    expect(el2.textContent).toBe('developer');
  });
});
