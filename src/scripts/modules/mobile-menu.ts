/**
 * Мобильное выдвижное меню.
 *
 * Возможности:
 * - открытие по [data-menu-open], закрытие по [data-menu-close];
 * - закрытие по Escape и по клику на overlay;
 * - блокировка фоновой прокрутки с возвратом позиции;
 * - перемещение фокуса в панель, удержание фокуса внутри,
 *   возврат фокуса на кнопку открытия;
 * - aria-expanded на кнопке-бургере;
 * - закрытие при увеличении окна до desktop-ширины.
 *
 * Инициализация безопасна при отсутствии элементов и идемпотентна.
 */

const DESKTOP_QUERY = '(min-width: 992px)';
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initMobileMenu(): void {
  const root = document.querySelector<HTMLElement>('[data-mobile-menu]');
  const openButton = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  if (!root || !openButton || root.dataset.initialized === 'true') {
    return;
  }
  root.dataset.initialized = 'true';

  const panel = root.querySelector<HTMLElement>('.mobile-menu__panel');
  if (!panel) {
    return;
  }

  const desktopMedia = window.matchMedia(DESKTOP_QUERY);

  function open(): void {
    root!.hidden = false;
    // Кадр для применения начальных стилей перед анимацией
    requestAnimationFrame(() => root!.classList.add('mobile-menu--open'));
    document.body.classList.add('no-scroll');
    openButton!.setAttribute('aria-expanded', 'true');
    openButton!.setAttribute('aria-label', 'Закрыть меню');
    panel!.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close(): void {
    root!.classList.remove('mobile-menu--open');
    document.body.classList.remove('no-scroll');
    openButton!.setAttribute('aria-expanded', 'false');
    openButton!.setAttribute('aria-label', 'Открыть меню');
    document.removeEventListener('keydown', onKeydown);
    // Ждём окончания анимации, затем прячем из потока и доступности
    window.setTimeout(() => {
      if (!root!.classList.contains('mobile-menu--open')) {
        root!.hidden = true;
      }
    }, 300);
    openButton!.focus();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    // Удержание фокуса внутри панели
    const focusable = Array.from(panel!.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null,
    );
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  openButton.addEventListener('click', () => {
    if (root!.classList.contains('mobile-menu--open')) {
      close();
    } else {
      open();
    }
  });

  root.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('[data-menu-close]')) {
      close();
    }
  });

  // Изменение ширины окна при открытом меню: на desktop меню закрывается
  desktopMedia.addEventListener('change', (event) => {
    if (event.matches && root!.classList.contains('mobile-menu--open')) {
      close();
    }
  });
}
