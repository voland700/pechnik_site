/**
 * Верхнее информационное меню сайта.
 *
 * Данные отделены от разметки: на этапе интеграции с 1С-Битрикс
 * этот список будет формироваться средствами CMS.
 *
 * ВНИМАНИЕ: URL являются предварительными — соответствующие страницы
 * будут разработаны на следующих этапах и могут измениться.
 */
export interface NavItem {
  /** Идентификатор пункта — используется для подсветки activeMenu */
  id: string;
  title: string;
  /** Предварительный URL (будет подтверждён при разработке страниц) */
  href: string;
}

export const topNavigation: NavItem[] = [
  { id: 'about', title: 'О печном центре', href: '/about/' },
  { id: 'articles', title: 'Статьи', href: '/articles/' },
  { id: 'montazh', title: 'Монтаж', href: '/montazh/' },
  { id: 'works', title: 'Наши работы', href: '/works/' },
  { id: 'delivery', title: 'Доставка', href: '/delivery/' },
  { id: 'contacts', title: 'Контакты', href: '/contacts/' },
  { id: 'sale', title: 'Акции', href: '/sale/' },
];
