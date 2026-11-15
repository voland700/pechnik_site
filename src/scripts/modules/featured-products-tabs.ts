/**
 * Доступное переключение статических панелей FeaturedProductsTabs.
 * DOM карточек не пересоздаётся, поэтому состояние форм ProductCard сохраняется.
 */

const ROOT_SELECTOR = '[data-featured-tabs]';
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function initInstance(root: HTMLElement): void {
  if (root.dataset.featuredTabsInitialized === 'true') {
    return;
  }

  const tablist = root.querySelector<HTMLElement>('[data-featured-tablist]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-featured-tab]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-featured-panel]'));
  if (!tablist || tabs.length === 0 || tabs.length !== panels.length) {
    return;
  }

  root.dataset.featuredTabsInitialized = 'true';
  const reducedMotion = window.matchMedia(REDUCED_MOTION);
  let activeIndex = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
  if (activeIndex < 0) {
    activeIndex = 0;
  }

  /** Прокручивает только tablist, не изменяя вертикальную позицию документа. */
  const ensureTabVisible = (tab: HTMLElement, smooth = true): void => {
    const tabRect = tab.getBoundingClientRect();
    const listRect = tablist.getBoundingClientRect();
    const inset = 8;
    let nextScrollLeft = tablist.scrollLeft;

    if (tabRect.left < listRect.left + inset) {
      nextScrollLeft += tabRect.left - listRect.left - inset;
    } else if (tabRect.right > listRect.right - inset) {
      nextScrollLeft += tabRect.right - listRect.right + inset;
    }

    const maxScrollLeft = Math.max(0, tablist.scrollWidth - tablist.clientWidth);
    nextScrollLeft = Math.max(0, Math.min(nextScrollLeft, maxScrollLeft));
    if (Math.abs(nextScrollLeft - tablist.scrollLeft) > 1) {
      tablist.scrollTo({
        left: nextScrollLeft,
        behavior: smooth && !reducedMotion.matches ? 'smooth' : 'auto',
      });
    }
  };

  const activate = (index: number, moveFocus = false): void => {
    if (index < 0 || index >= tabs.length) {
      return;
    }

    activeIndex = index;
    tabs.forEach((tab, tabIndex) => {
      const isActive = tabIndex === activeIndex;
      tab.classList.toggle('active', isActive);
      tab.classList.toggle('featured-products__tab--active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });

    panels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === activeIndex;
      panel.hidden = !isActive;
      panel.classList.toggle('behold', isActive);
    });

    const activeTab = tabs[activeIndex];
    if (moveFocus) {
      activeTab.focus({ preventScroll: true });
    }
    ensureTabVisible(activeTab);
  };

  root.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }
    const tab = event.target.closest<HTMLButtonElement>('[data-featured-tab]');
    if (!tab || !root.contains(tab)) {
      return;
    }
    activate(Number(tab.dataset.featuredTab));
  });

  tablist.addEventListener('keydown', (event) => {
    if (!(event.target instanceof Element) || !event.target.matches('[data-featured-tab]')) {
      return;
    }

    let nextIndex: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (activeIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    activate(nextIndex, true);
  });

  // Валидируем серверную разметку и учитываем initialTab за пределами экрана.
  activate(activeIndex);
}

export function initFeaturedProductsTabs(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>(ROOT_SELECTOR).forEach(initInstance);
}
