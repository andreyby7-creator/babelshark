/**
 * @file MutationObserver (клиент).
 *
 * В рамках ТЗ:
 * - наблюдаем элементы с классом `__t` (ячейки position)
 * - при изменениях запрашиваем перевод через `Meteor.call('translatePosition', ...)`
 * - ответ заменяет оригинальный текст в DOM
 *
 * @remarks
 * - Обязательны защиты от self-trigger/spam: debounce + cache + lock-флаг.
 * - `characterData` нужно обрабатывать явно (изменения текста не попадают в addedNodes).
 * - Server-side cache и batch API не внедряем: в рамках ТЗ достаточно client-side cache + debounce.
 * - Если нормализация усложнится (accent folding, пунктуация) — вынесем в отдельную стратегию/pipeline.
 * - Cache eviction (TTL) не внедряем: для тестового достаточно in-memory Map без TTL.
 * - Batch translate не внедряем: потребует нового Meteor.method и изменит контракт (вне ТЗ).
 * - Per-node debounce не внедряем: текущий debounce на пачку оптимален для реактивных обновлений таблицы.
 * - Error UI feedback не внедряем: при необходимости можно подсветить ячейку при ошибке перевода.
 */

import { Meteor } from 'meteor/meteor';

import { normalizeSource } from '/imports/api/utils/normalize';

/* ============================================================================
 * MUTATION OBSERVER
 * ========================================================================== */

const ROOT_SELECTOR = '[data-root="app"]';
const TRANSLATED_CLASS = '__t';
const LOCK_ATTR = 'data-translating';
const ORIGINAL_ATTR = 'data-original';
const DEBOUNCE_MS = 200;
const LOADING_OPACITY = '0.6';

const cache = new Map<string, string>();

const debounce = <Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
};

const getRoot = (): HTMLElement | null => {
  const byData = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (byData) return byData;

  return document.getElementById('app');
};

/**
 * Собирает элементы-цели (`.__t`) из добавленного DOM-узла.
 *
 * @param node - узел из MutationRecord.addedNodes
 * @param out - массив, куда добавляются найденные элементы
 * @returns void
 */
const collectTargetsFromNode = (node: Node, out: HTMLElement[]): void => {
  if (!(node instanceof HTMLElement)) return;

  if (node.matches(`.${TRANSLATED_CLASS}`)) {
    out.push(node);
  }

  node.querySelectorAll(`.${TRANSLATED_CLASS}`).forEach((el) => {
    out.push(el as HTMLElement);
  });
};

/**
 * Переводит найденные элементы (с защитами: lock/cache/debounce/race-guard).
 *
 * @param elements - список DOM-элементов `.__t`
 * @returns void
 */
const translateElements = (elements: HTMLElement[]): void => {
  const unique = Array.from(new Set(elements));

  unique.forEach((el) => {
    if (el.getAttribute(LOCK_ATTR) === '1') return;

    const currentText = el.textContent.trim();
    if (!currentText) return;

    // Если в DOM уже не оригинал — значит уже переведено, игнорируем.
    const savedOriginal = el.getAttribute(ORIGINAL_ATTR);
    if (savedOriginal && currentText !== savedOriginal) {
      return;
    }

    const original = normalizeSource(savedOriginal ?? currentText);
    el.setAttribute(ORIGINAL_ATTR, original);

    const cached = cache.get(original);
    if (cached !== undefined) {
      if (el.textContent !== cached) {
        el.textContent = cached;
      }
      return;
    }

    el.setAttribute(LOCK_ATTR, '1');
    el.style.opacity = LOADING_OPACITY;

    Meteor.call('translatePosition', original, (err: unknown, translated: string) => {
      el.setAttribute(LOCK_ATTR, '0');
      el.style.opacity = '';

      // Race-condition guard: если оригинал поменялся, пока летел запрос — не перезаписываем.
      if (el.getAttribute(ORIGINAL_ATTR) !== original) return;

      if (err) {
        console.error('Translation error', err);
        return;
      }

      const result = translated || original;
      cache.set(original, result);

      if (el.textContent !== result) {
        el.textContent = result;
      }
    });
  });
};

/**
 * Инициализирует наблюдатель за изменениями в DOM.
 *
 * @returns void
 */
export const initObserver = (): void => {
  const root = getRoot();
  if (!root) return;

  console.log('MutationObserver initialized');

  // debounce применяется ко всей пачке мутаций, чтобы не дергать Meteor.call для каждого узла отдельно
  const debouncedTranslate = debounce(translateElements, DEBOUNCE_MS);

  const observer = new MutationObserver((mutations) => {
    const targets: HTMLElement[] = [];

    for (const m of mutations) {
      // 1) addedNodes (добавление/перестройка DOM)
      Array.from(m.addedNodes).forEach((node) => {
        collectTargetsFromNode(node, targets);
      });

      // 2) ВАЖНО: изменение текста (characterData) — addedNodes тут не поможет
      if (m.type === 'characterData') {
        const parent = m.target.parentElement;
        if (parent?.matches(`.${TRANSLATED_CLASS}`)) {
          targets.push(parent);
        }
      }
    }

    if (targets.length > 0) {
      debouncedTranslate(targets);
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });
};
