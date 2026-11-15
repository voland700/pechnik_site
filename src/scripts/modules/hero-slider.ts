/**
 * Hero Slider главной страницы (компонент HeroSlider.astro).
 *
 * Отдельная инициализация по [data-hero-slider], не связана с общим
 * модулем swiper.ts ([data-swiper]) и не влияет на другие карусели.
 *
 * Эффект: Fade (crossFade) + независимый Parallax внутренних слоёв
 * (data-swiper-parallax-* в разметке слайда). Поддержка: свайп,
 * стрелки, пагинация, клавиатура, Autoplay с паузой при наведении,
 * prefers-reduced-motion (мгновенное переключение, без parallax/autoplay).
 */
import Swiper from 'swiper';
import {
  A11y,
  Autoplay,
  EffectFade,
  Keyboard,
  Navigation,
  Pagination,
  Parallax,
} from 'swiper/modules';
import { qsa } from '../utils/dom';

const SELECTOR = '[data-hero-slider]';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Интерактивные элементы неактивных слайдов не должны попадать
 * в фокус с клавиатуры — помечаем их inert. Сравнение по activeIndex:
 * на момент события slideChange классы Swiper ещё не обновлены.
 */
function updateSlidesA11y(swiper: Swiper): void {
  swiper.slides.forEach((slide, index) => {
    const isActive = index === swiper.activeIndex;
    slide.toggleAttribute('inert', !isActive);
    slide.setAttribute('aria-hidden', String(!isActive));
  });
}

export function initHeroSlider(): void {
  const containers = qsa(SELECTOR);
  if (containers.length === 0) {
    return;
  }

  const reduceMotion = window.matchMedia(REDUCED_MOTION).matches;

  containers.forEach((el) => {
    new Swiper(el, {
      modules: [EffectFade, Parallax, Navigation, Pagination, Keyboard, A11y, Autoplay],

      // Плавное растворение слайдов без горизонтального движения
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: reduceMotion ? 0 : 1000,

      // Parallax внутренних слоёв (фон, заголовок, описание, кнопка, товар)
      parallax: !reduceMotion,

      slidesPerView: 1,
      loop: true, // бесконечная прокрутка
      watchSlidesProgress: true,
	  
	  

      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },  
	  
      a11y: {
        prevSlideMessage: 'Предыдущий слайд',
        nextSlideMessage: 'Следующий слайд',
        paginationBulletMessage: 'Перейти к слайду {{index}}',
      },
	    
	  

      autoplay: reduceMotion
        ? false
        : {
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          },
		  


	  // autoplay: false,

      pagination: {
        el: el.querySelector<HTMLElement>('.swiper-pagination'),
        clickable: true,
      },

      navigation: {
        prevEl: el.querySelector<HTMLElement>('.swiper-button-prev'),
        nextEl: el.querySelector<HTMLElement>('.swiper-button-next'),
      },

      on: {
        init: updateSlidesA11y,
        slideChange: updateSlidesA11y,
        slideChangeTransitionEnd: updateSlidesA11y,
      },
    });
  });
}
