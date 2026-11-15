/**
 * Утилиты работы с DOM: безопасные селекторы и инициализация.
 */

/** querySelector с типом */
export function qs<T extends HTMLElement = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T | null {
  return root.querySelector<T>(selector);
}

/** querySelectorAll как массив с типом */
export function qsa<T extends HTMLElement = HTMLElement>(
  selector: string,
  root: ParentNode = document,
): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

/** Выполнить колбэк, когда DOM готов */
export function onReady(fn: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}
