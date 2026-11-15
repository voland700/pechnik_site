/**
 * Header — управление sticky-состоянием.
 *
 * Закрепление выполняет CSS (position: sticky на .header), JavaScript
 * только добавляет класс .header--stuck для тени/границы, когда строка
 * прилипла к верху viewport. Тяжёлых обработчиков прокрутки нет —
 * используется IntersectionObserver по невидимому маркеру перед шапкой.
 */

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const sentinel = document.querySelector<HTMLElement>('[data-header-sentinel]');
  if (!header || !sentinel) {
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle('header--stuck', !entry.isIntersecting);
    },
    { threshold: 0 },
  );

  observer.observe(sentinel);
}
