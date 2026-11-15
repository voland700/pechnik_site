/**
 * Fancybox 6 — галереи и просмотр полноразмерных изображений.
 *
 * Инициализация только при наличии элементов [data-fancybox] на странице.
 * Стили библиотеки подключены в BaseLayout.astro и входят в общий style.css.
 *
 * Использование в HTML:
 *   <a href="/images/full.jpg" data-fancybox="gallery" data-caption="...">
 *     <img src="/images/thumb.jpg" alt="...">
 *   </a>
 * Одинаковое значение data-fancybox объединяет элементы в галерею.
 */
import { Fancybox } from '@fancyapps/ui';

const SELECTOR = '[data-fancybox]';

export function initFancybox(): void {
  if (!document.querySelector(SELECTOR)) {
    return;
  }

  Fancybox.bind(SELECTOR, {
    // Группировка — через data-fancybox="имя-группы" в разметке.
    // Опции по умолчанию подходят для товарных галерей.
  });
}
