/**
 * Точка входа клиентского JavaScript.
 *
 * Каждый модуль сам проверяет наличие своих DOM-элементов,
 * поэтому точка входа общая для всех страниц и безопасна
 * на страницах без слайдеров/галерей.
 */
import { onReady } from './utils/dom';
import { initFancybox } from './modules/fancybox';
import { initSwipers } from './modules/swiper';
import { initAlerts } from './modules/alerts';
import { initHeader } from './modules/header';
import { initMobileMenu } from './modules/mobile-menu';
import { initWorkingHours } from './modules/working-hours';
import { initHeroSlider } from './modules/hero-slider';
import { initProductCards } from './modules/product-card';

onReady(() => {
  initHeader();
  initMobileMenu();
  initWorkingHours();
  initFancybox();
  initSwipers();
  initHeroSlider();
  initProductCards();

  // Вкладки загружаются только на страницах, где секция действительно есть.
  if (document.querySelector('[data-featured-tabs]')) {
    void import('./modules/featured-products-tabs').then(({ initFeaturedProductsTabs }) => {
      initFeaturedProductsTabs();
    });
  }

  initAlerts();
});
