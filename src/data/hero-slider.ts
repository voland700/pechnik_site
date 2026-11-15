/**
 * Данные рекламного блока главной страницы.
 *
 * sliderData — четыре рекламных слайда основного Hero Slider.
 * Рекламные тексты перенесены с действующего сайта pechnik.su
 * без изменений коммерческих условий, скидок и описаний.
 *
 * bannerData — четыре статичных баннера из assets/slider-banners.json.
 * Порядок элементов массива определяет порядок вывода:
 * desktop — 1: слева сверху, 2: слева снизу, 3: справа сверху, 4: справа снизу;
 * tablet/mobile — последовательно 1 → 4.
 *
 * ВНИМАНИЕ: поля link — ВРЕМЕННЫЕ ссылки на предварительные маршруты
 * проекта (/catalog/, /sale/ — см. src/data/navigation.ts и Header.astro).
 * При интеграции с 1С-Битрикс заменить на реальные URL категорий/акций.
 * Если link убрать, баннер/слайд станет некликабельным (пустые href
 * и href="#" не используются).
 */
import type { HeroSlideData, HeroBannerData } from '../types/hero-slider';
import bannersJson from '../../assets/slider-banners.json';

export const sliderData: HeroSlideData[] = [
  {
    name: 'Уличные печи для пиццы Везувий',
    text: `<ul>
      <li>От производителя — гарантия лучшей цены</li>
      <li>Прочные и долговечные — 100% чугун</li>
      <li><strong>Невероятно вкусно и полезно!</strong></li>
    </ul>`,
    link: '/catalog/',
    backgraund: '/assets/images/slider/bg_ochag-2.jpg',
    img: '/assets/images/slider/pumpkin_3.png',
  },
  {
    name: 'Чугунные печи для бани Атмосфера',
    text: `<ul>
      <li>Мягкий, целебный пар</li>
      <li>Закрытая каменка и парогенератор</li>
      <li>Гарантия лучшей цены</li>
      <li><strong>Скидка на дымоход до -10%</strong></li>
      <li><strong>140 кг камней в подарок</strong></li>
    </ul>`,
    link: '/catalog/',
    backgraund: '/assets/images/slider/bg_bania_3.jpg',
    img: '/assets/images/slider/atmosfera_2F.png',
  },
  {
    name: 'Печи и камины — в рассрочку',
    text: `<ul>
      <li>Честная рассрочка — до 6 месяцев</li>
      <li>Без процентов и переплат</li>
      <li><strong>Купи сейчас — плати потом!</strong></li>
    </ul>`,
    link: '/sale/',
    backgraund: '/assets/images/slider/BG_1280-500.jpg',
    img: '/assets/images/slider/stovvies.png',
  },
  {
    name: 'Печи тандыры Амфора',
    text: `<p>Удиви друзей и близких незабываемым вкусом Восточной кухни!</p>
    <p><strong>Невероятно вкусно и полезно!</strong></p>`,
    link: '/catalog/',
    backgraund: '/assets/images/slider/bg_stovies.jpg',
    img: '/assets/images/slider/tandyr.png',
  },
];

export const bannerData: HeroBannerData[] = (bannersJson as HeroBannerData[]).map(
  (banner) => ({
    ...banner,
    // ВРЕМЕННАЯ ссылка: заменить на реальный URL категории при интеграции CMS
    link: '/catalog/',
  }),
);
