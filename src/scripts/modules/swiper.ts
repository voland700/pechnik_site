/**
 * Swiper 14 — слайдеры и карусели.
 *
 * Модульная архитектура: подключаются только используемые модули.
 * Стили (swiper/css, navigation, pagination) подключены в BaseLayout.astro
 * и входят в общий style.css.
 * Автоинициализация по атрибуту [data-swiper], поддерживается
 * несколько экземпляров на странице.
 *
 * Минимальная разметка:
 *   <div class="swiper" data-swiper>
 *     <div class="swiper-wrapper">
 *       <div class="swiper-slide" data-swiper-parallax="-20%">...</div>
 *     </div>
 *     <div class="swiper-pagination"></div>
 *     <div class="swiper-button-prev"></div>
 *     <div class="swiper-button-next"></div>
 *   </div>
 */
import Swiper from 'swiper';
import { Navigation, Pagination, Parallax } from 'swiper/modules';
import { qsa } from '../utils/dom';

const SELECTOR = '[data-swiper]';

export function initSwipers(): void {
  const containers = qsa(SELECTOR);
  if (containers.length === 0) {
    return;
  }

  containers.forEach((el) => {
    new Swiper(el, {
      modules: [Navigation, Pagination, Parallax],
      loop: true,
      speed: 600,
      parallax: true,
      pagination: {
        el: el.querySelector<HTMLElement>('.swiper-pagination'),
        clickable: true,
      },
      navigation: {
        prevEl: el.querySelector<HTMLElement>('.swiper-button-prev'),
        nextEl: el.querySelector<HTMLElement>('.swiper-button-next'),
      },
    });
  });
}
