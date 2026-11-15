# Pechnik.su — Astro Starter

Frontend-инфраструктура для поэтапной разработки интернет-магазина строительных
и отопительных товаров [pechnik.su](https://pechnik.su/). Astro используется
как инструмент шаблонизации и статической сборки: на выходе — обычные
HTML/CSS/JS-файлы, не требующие Node.js или Astro-runtime на сервере и пригодные
для переноса в шаблоны CMS.

## Требования

- Node.js **>= 22** (LTS)
- npm

## Установка и запуск

```bash
npm install        # установка зависимостей
npm run dev        # сервер разработки с HMR (по умолчанию http://localhost:4321)
npm run build      # production-сборка в dist/
npm run preview    # просмотр результата сборки (http://localhost:4321)
npm run check      # проверка типов и шаблонов (astro check)
```

Аргументы dev-серверу передаются через `--`:
`npm run dev -- --port 3000 --host 0.0.0.0`

## Технологический стек

| Инструмент | Версия | Назначение |
|---|---|---|
| Astro | 6.x | шаблоны, статическая сборка (`output: 'static'`) |
| Vite | 7.x (идёт с Astro) | сборка CSS/JS/ресурсов |
| Sass | 1.x | модульный SCSS (`@use`/`@forward`) |
| Bootstrap | 5.2.3 | только SCSS: reboot, сетка, mixins, минимум утилит |
| PostCSS + Autoprefixer | — | автопрефиксы по Browserslist |
| Swiper | 14.x | слайдеры (модули: Navigation, Pagination, Parallax) |
| Fancybox (`@fancyapps/ui`) | 6.x | галереи и просмотр изображений |
| SweetAlert2 | 11.x | уведомления и подтверждения |
| vite-svg-2-webfont | 8.x | иконочный шрифт из SVG |
| esbuild | — | минификация style.min.css в постобработке |

## Структура каталогов

```text
├── assets/
│   ├── logo.svg                  # оригинальный логотип Pechnik.su
│   └── cart.svg                  # исходник иконки корзины (в UI используется Icon.astro)
├── public/                       # копируется в dist как есть
│   ├── favicon/favicon.svg
│   └── images/demo/              # демонстрационные изображения
├── scripts/
│   ├── download_fonts.py         # загрузка шрифтов Onest (WOFF2)
│   ├── make_demo_images.py       # генерация демо-изображений
│   ├── postbuild.mjs             # css/style.min.css + js/main.js, правка ссылок в HTML
│   ├── test_header.mjs           # браузерные тесты шапки (puppeteer-core + Chrome)
│   ├── test_showcase.mjs         # браузерные тесты витрины категорий
│   └── test_hero.mjs             # браузерные тесты рекламного блока главной
├── src/
│   ├── assets/
│   │   ├── fonts/onest/          # локальные WOFF2 (кириллица + латиница)
│   │   └── icons/
│   │       ├── inline/           # SVG для Icon.astro (stroke, currentColor)
│   │       └── font/             # SVG для иконочного шрифта (solid)
│   ├── components/
│   │   ├── ui/Icon.astro         # inline SVG-иконки
│   │   ├── home/hero-slider/     # HeroShowcase, HeroSlider, HeroSlide, HeroBanner
│   │   └── layout/
│   │       ├── SiteFooter.astro
│   │       └── header/           # Header.astro и его части (см. раздел «Шапка»)
│   ├── data/                     # site.json, palette.json, navigation.ts, contacts.ts, hero-slider.ts
│   ├── types/                    # hero-slider.ts — типы данных блоков главной
│   ├── layouts/BaseLayout.astro
│   ├── pages/index.astro         # демо-страница (технический UI Kit)
│   ├── scripts/
│   │   ├── main.ts               # точка входа клиентского JS
│   │   ├── modules/              # fancybox, swiper, alerts, header, mobile-menu,
│   │   │                         # working-hours, hero-slider
│   │   └── utils/dom.ts
│   ├── styles/
│   │   ├── abstracts/            # токены, функции, миксины (CSS не генерируют)
│   │   ├── base/                 # @font-face, :root custom properties, типографика
│   │   ├── vendors/              # точечная сборка Bootstrap 5.2
│   │   ├── layout/               # шапка, подвал, секции
│   │   ├── components/           # кнопки, иконки, поиск, контакты магазинов, мобильное меню
│   │   ├── pages/                # стили отдельных страниц
│   │   ├── utils/                # вспомогательные классы
│   │   └── main.scss             # единый входной файл стилей
│   └── env.d.ts
├── astro.config.mjs
├── postcss.config.mjs
└── package.json                  # включая browserslist
```

## Сборка CSS и JS

Структура выходных файлов соответствует ТЗ под 1С-Битрикс:

- Все стили (собственный SCSS, Bootstrap, CSS библиотек, иконочный шрифт)
  собираются в **один файл** `dist/css/style.css` (`cssCodeSplit: false`,
  имя задано в `astro.config.mjs`).
- `scripts/postbuild.mjs` создаёт `dist/css/style.min.css` (esbuild) и
  переключает ссылку в собранных HTML на минифицированный вариант.
  Неминифицированный `css/style.css` остаётся в `dist` для отладки.
- JS-бандл переименовывается постобработкой в `dist/js/main.js`, ссылка
  в HTML переписывается на него.
- **Для CMS обязательны два файла: `css/style.min.css` и `js/main.js`**
  (плюс ресурсы, на которые ссылается CSS: шрифты Onest и иконочный шрифт
  в `assets/`).
- Autoprefixer работает через `postcss.config.mjs` и `browserslist`
  (в `package.json`): `> 0.5%, last 2 versions, not dead, not IE 11`.

## Шапка (Header)

Адаптивная шапка по ТЗ: верхняя строка навигации, основная строка
(логотип, каталог, поиск, график работы, корзина, контакты, кабинет),
sticky-поведение и мобильное меню. Перелом mobile/desktop — на `lg` (992px),
контакты магазинов выстраиваются в две колонки от `xl` (1200px).

**Компоненты** (`src/components/layout/header/`):

| Компонент | Назначение |
|---|---|
| `Header.astro` | корневой, собирает все части, принимает props |
| `TopNavigation.astro` | верхнее меню из 7 пунктов |
| `HeaderLogo.astro` | логотип + подпись «Печной центр» |
| `CatalogLink.astro` | кнопка-ссылка «Каталог» |
| `SearchForm.astro` | форма поиска (десктопная `#search-desktop` и мобильная `#search-mobile`) |
| `WorkingHours.astro` | график работы и статус «Сейчас работаем/закрыто» |
| `CartLink.astro` | корзина со счётчиком (`cart-link--filled` при > 0) |
| `StoreContacts.astro` | телефоны магазинов «Ясенево» и «Заокск» |
| `AccountLink.astro` | «Войти» / «Кабинет» |
| `MobileMenu.astro` | выезжающая панель + overlay (`role="dialog"`) |

**Props `Header.astro`:** `activeMenu` (id активного пункта меню),
`isAuthenticated`, `cartCount`, `catalogUrl`, `cartUrl`, `accountUrl`,
`loginUrl`, `homeUrl`, `searchAction` (по умолчанию `/search/`),
`searchParam` (по умолчанию `q`).

**Данные:** пункты меню — `src/data/navigation.ts`; магазины, телефоны и
график работы — `src/data/contacts.ts` (часы в минутах, таймзона Europe/Moscow).
Статус «Сейчас работаем» вычисляется на клиенте по московскому времени
(`scripts/modules/working-hours.ts`), в SSR разметке статус скрыт.

**JS-модули:** `header.ts` (класс `header--stuck` для тени через
IntersectionObserver по `[data-header-sentinel]`; сам sticky — чистый
`position: sticky` без JS и без layout shift), `mobile-menu.ts` (открытие/
закрытие, Escape, overlay, focus trap, блокировка прокрутки, закрытие при
ресайзе ≥ 992px).

**Интеграционные точки для CMS:** кнопка обратного звонка —
`[data-action="callback"]`; счётчик корзины — `[data-cart-count]`;
форма поиска отправляет GET на `searchAction` с параметром `searchParam`.

## Рекламный блок главной (HeroShowcase)

Единый блок первого экрана: центральный Hero Slider (Swiper, эффект
Fade + Parallax) и четыре статичных баннера из `assets/slider-banners.json`.
Композиция на CSS Grid при единой DOM-последовательности
(слайдер → баннеры 1→4, без `order`):

| Ширина | Композиция |
|---|---|
| `≥1200px` | баннеры 1–2 слева, слайдер по центру, баннеры 3–4 справа |
| `768–1199px` | слайдер на всю ширину, баннеры сеткой 2 × 2 |
| `<768px` | слайдер сверху, баннеры в один столбец |

**Компоненты** (`src/components/home/hero-slider/`): `HeroShowcase.astro`
(сетка, props `slides`/`banners`), `HeroSlider.astro` (Swiper, пагинация,
стрелки — появляются при наведении на слайдер / фокусе внутри),
`HeroSlide.astro` (слайд: фон, overlay, HTML-описание, контурная кнопка
«Подробнее», товарное изображение), `HeroBanner.astro` (баннер-ссылка;
без `link` — некликабельный, пустые `href` не используются).

**Данные:** `src/data/hero-slider.ts` (тексты слайдов с действующего
pechnik.su; баннеры импортируются из `assets/slider-banners.json`),
типы — `src/types/hero-slider.ts` (поле `backgraund` сохранено для
совместимости). Изображения баннеров/слайдов — `public/assets/images/`
(копия библиотеки `assets/images/`, пути совпадают с JSON).

**JS:** `src/scripts/modules/hero-slider.ts` — отдельная инициализация
по `[data-hero-slider]` (не связана с общим `[data-swiper]`): `EffectFade`
с `crossFade: true`, `Parallax` внутренних слоёв, `speed: 1000`, loop,
клавиатура, Autoplay 6 с с паузой при наведении, русские a11y-сообщения,
`inert` на неактивных слайдах, reduced motion (speed 0, без parallax
и autoplay). Стили эффекта: `swiper/css/effect-fade` в BaseLayout.

**ВАЖНО про ссылки:** все `link` в данных — ВРЕМЕННЫЕ (`/catalog/`,
`/sale/`); при интеграции заменить на реальные URL категорий/акций.

## Витрина категорий (CategoryShowcase)

Секция «Каталог товаров» на главной: 22 категории вертикальными
карточками (изображение сверху, название снизу). Без JavaScript.

- Компоненты: `src/components/home/category-showcase/CategoryShowcase.astro`
  (секция, заголовок H2, сетка; props `items`, `title`) и
  `CategoryCard.astro` (карточка `<div>`; изображение и название —
  ссылки `<a href="#">`, заглушка до CMS, при интеграции заменить
  на `item.url`; media-ссылка скрыта от клавиатуры и скринридера,
  чтобы не дублировать путь к тому же разделу).
- Данные: `src/data/showcase.ts` (названия/порядок/пути — из ТЗ,
  не изменять; `url` пока пустой, придёт из CMS), типы —
  `src/types/showcase.ts` (`name`/`img`/`url` = название, изображение
  и URL раздела инфоблока каталога).
- Сетка CSS Grid: 5 колонок от 1200px, 4 от 992px, 3 от 768px, 2 ниже;
  карточки строки одинаковой высоты, последняя строка не растягивается.
- Изображения: `object-fit: contain`, максимум 175×175px внутри
  квадратной области 1:1 (`aspect-ratio: 1/1` + `flex: none` — область
  не сжимается от длины названия, все области одинакового размера),
  `loading="lazy"`, `decoding="async"`; файлы —
  `public/assets/images/catalog/` (копия библиотеки
  `assets/images/catalog/`).
- Стили: `src/styles/components/_category-showcase.scss`; название —
  1rem; hover/focus-within карточки затемняет border до `#c9c9c9`,
  hover названия — акцентный цвет; `prefers-reduced-motion` поддержан.
- Утилита `.shine` (`src/styles/utils/_shine.scss`): эффект сияния
  при hover/focus — вешать класс на нужные элементы (кнопки, карточки).

## Правила создания Astro-компонентов

1. Компонент решает одну задачу; данные приходят через props или из `src/data/`.
2. Не зашивать товарные/контентные данные в разметку.
3. Семантический HTML, корректная иерархия заголовков, доступность
   (aria-атрибуты, фокусные состояния).
4. Не добавлять JS, если задача решается HTML/CSS.
5. Стили компонента — в `src/styles/components/_<имя>.scss`, подключаются
   через `@forward` в `components/_index.scss`.

## Правила добавления SCSS

- Собственные стили — только через `@use`/`@forward`.
  Единственное место с `@import` — `styles/vendors/_bootstrap.scss`
  (Bootstrap 5.2 внутри построен на `@import`).
- Слои подключаются в `main.scss` в порядке: vendors → base → layout →
  components → utils → pages.
- Значения цветов, отступов, радиусов, теней, переходов, z-index — только
  из токенов (`abstracts/_tokens.scss`); ключевые токены продублированы
  в CSS Custom Properties (`:root`, см. `base/_root.scss`).
- Breakpoints сетки меняются централизованно в `vendors/_bootstrap.scss`;
  медиа-миксины проекта (`media-up`/`media-down` в `abstracts/_mixins.scss`)
  зеркалят эти значения — менять синхронно.

## Иконки

### Inline SVG (предпочтительно для UI)

```astro
<Icon name="search" size={24} />
<Icon name="cart" size={24} class="header__icon" />
<Icon name="phone" title="Телефон" />   <!-- доступный режим -->
```

- Файлы: `src/assets/icons/inline/<имя>.svg`, viewBox `0 0 24 24`,
  stroke-иконки на `currentColor` (стиль lucide).
- SVG встраиваются в HTML при сборке, runtime-запросов нет.
- Без `title` иконка декоративная (`aria-hidden`).

### Иконочный шрифт

- Файлы: `src/assets/icons/font/<имя>.svg` — сплошная заливка, один цвет.
- Плагин `vite-svg-2-webfont` генерирует WOFF2 + WOFF и CSS автоматически
  при старте dev-сервера и сборке; добавление файла = добавление иконки.
- Использование: `<i class="icon icon-<имя>"></i>`,
  размеры — `.icon--sm/md/lg`, цвет — через `color`.

## Шрифты

- Onest (variable font, WOFF2), подмножества cyrillic и latin раздельно,
  веса 300–700, `font-display: swap`.
- Файлы: `src/assets/fonts/onest/`; обновление — `python scripts/download_fonts.py`.
- Внешние CDN для шрифтов не используются.

## JS-библиотеки

- Каждая библиотека — отдельный модуль в `src/scripts/modules/` с функцией
  инициализации, которая проверяет наличие целевых DOM-элементов.
- Точка входа — `src/scripts/main.ts` (подключён в `BaseLayout.astro`).
- Интерфейс HTML ↔ JS — через `data-*` атрибуты: `[data-swiper]`,
  `[data-fancybox]`, `[data-alert]`.
- Уведомления — через обёртку `notify` из `modules/alerts.ts`
  (`notify.success/error/info`, `await notify.confirm(...)`).

## Перенос в CMS

Из `dist/` в шаблоны CMS переносятся:

1. `css/style.min.css` — единственный обязательный CSS.
2. `js/main.js` — клиентский бандл (фиксированное имя, без хеша).
3. `assets/*.woff2`, `assets/*.woff` — Onest и иконочный шрифт.
4. `favicon/`, `images/` — статика из `public/`.
5. HTML из `dist/*.html` — основа для PHP-шаблонов (семантическая вёрстка
   без Astro-зависимостей).

## Тестирование шапки и hero-блока

`scripts/test_header.mjs` и `scripts/test_hero.mjs` — автоматические
браузерные тесты (puppeteer-core, используется установленный Chrome):

```bash
npx astro preview --port 4321   # в отдельном терминале
node scripts/test_header.mjs    # шапка
node scripts/test_hero.mjs      # рекламный блок главной
node scripts/test_showcase.mjs  # витрина категорий
```

`test_header.mjs`: отсутствие горизонтального переполнения на
390/768/1024/1440/1920px, мобильная и десктопная компоновки,
sticky-поведение, статус магазина по московскому времени, счётчик корзины,
мобильное меню (открытие, focus trap, Escape, overlay), отправка поиска.

`test_hero.mjs`: композиции HeroShowcase на 390/576/768/1024/1200/1440/1920px
(три колонки / 2 × 2 / один столбец, равенство высот баннеров и слайдера),
содержимое и кликабельность баннеров, отсутствие дублирования DOM,
конфигурация Swiper (fade + crossFade, parallax, speed), переключение
стрелками/пагинацией/клавиатурой, autoplay с паузой при наведении,
inert на неактивных слайдах, reduced motion.

`test_showcase.mjs`: сетка витрины на 360–1920px (2/3/4/5 колонок),
22 категории в исходном порядке, загрузка изображений (contain, lazy),
полные названия без обрезки, некликабельность карточек без `url`,
равная высота карточек строки, последняя строка без растягивания.

Скриншоты сохраняются в `.tmp/shots/`.

## Карточка товара (ProductCard)

- Компонент: `src/components/catalog/ProductCard.astro`; API — `<ProductCard product={product} />`.
- Модель `ProductItem` и соответствие полей будущей CMS: `src/types/product.ts`.
- Покупка разрешена только при `canBuy` и непустой цене; `inStock` управляет исключительно надписью «В наличии».
- Количество независимо для каждой карточки, допускает целые значения 1–999. Динамически добавленные карточки инициализируются повторным вызовом `initProductCards(root)` из `scripts/modules/product-card.ts`.
- На демонстрационном этапе submit не выполняет HTTP-запрос и dispatch-ит `product-card:demo-submit` с `detail: { productId, quantity }`; событие не означает добавление в корзину.
- Демонстрация 10 состояний и узкого контейнера: `/product-card/`; тестовые данные — `src/data/products-demo.ts`, фотографии взяты из существующей библиотеки товаров.
- Проверки: `npm run verify:dist`; браузерные — `npm run preview -- --port 4321`, затем `npm run test:product-card`. При другом адресе preview задайте `PRODUCT_CARD_TEST_URL`, например `PRODUCT_CARD_TEST_URL=http://127.0.0.1:4323/product-card/ npm run test:product-card`.

## Известные ограничения

- URL корзины, кабинета, поиска и пунктов меню — предварительные
  (`/cart/`, `/search/` и т.п.); соответствующие страницы ещё не созданы,
  при переходе dev/preview-сервер отвечает 404 — это ожидаемо.
- Ссылки слайдов и баннеров HeroShowcase — временные (`/catalog/`, `/sale/`);
  заменить на реальные URL категорий при интеграции с CMS.
- Форма обратного звонка не реализована (по ТЗ): кнопка
  `[data-action="callback"]` — точка подключения будущей формы.
- Fancybox 6 не содержит русской локали в пакете (есть en/de/uk и др.) —
  при необходимости тексты кнопок задаются опциями.
- Bootstrap 5.2 использует устаревший `@import` внутри `node_modules`;
  предупреждения Sass заглушены (`quietDeps`), при переходе на Bootstrap 5.3+
  или отказе от него конфигурацию нужно пересмотреть.
- JS-бандл общий для всех страниц (~90 KB gzip с учётом Swiper/Fancybox/
  SweetAlert2). При росте числа страниц имеет смысл разбить его
  динамическими `import()` по модулям.

## Демо-страница

`src/pages/index.astro` — технический UI Kit (не дизайн главной страницы):
логотип, шрифт, палитра, заголовки H1–H6, текст и ссылки, кнопки, сетка
Bootstrap, inline SVG, иконочный шрифт, Swiper с Parallax, Fancybox,
SweetAlert2.
