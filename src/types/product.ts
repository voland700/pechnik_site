/** Значение флага из frontend-данных или CMS. */
export type ProductFlag = boolean | 0 | 1 | '0' | '1';

/**
 * Данные карточки товара.
 *
 * Соответствие будущим полям 1С-Битрикс:
 * id — ID элемента; name — NAME; img — PREVIEW_PICTURE/DETAIL_PICTURE;
 * url — DETAIL_PAGE_URL; price/old_price — отформатированные цены без валюты;
 * new/hit/sale — свойства-флаги; inStock — признак наличия;
 * discount — готовая подпись скидки; canBuy — разрешение покупки из CMS.
 * Компонент не вычисляет цены и скидки и не обращается к Bitrix API.
 */
export interface ProductItem {
  id: number | string;
  name: string;
  img: string;
  url?: string;
  price: string | null;
  old_price: string;
  new: ProductFlag;
  hit: ProductFlag;
  sale: ProductFlag;
  inStock: ProductFlag;
  discount: string;
  canBuy: ProductFlag;
}
