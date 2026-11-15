/**
 * Независимое поведение карточек товара.
 * Backend отсутствует: submit только нормализует значения и dispatch-ит
 * product-card:demo-submit с { productId, quantity }; это не добавление в корзину.
 */

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 999;

function normalizeQuantity(rawValue: string): number {
  const value = rawValue.trim();
  if (!/^[1-9]\d*$/.test(value)) {
    return MIN_QUANTITY;
  }
  return Math.min(Number(value), MAX_QUANTITY);
}

function setQuantity(input: HTMLInputElement, value: number): void {
  input.value = String(Math.min(Math.max(value, MIN_QUANTITY), MAX_QUANTITY));
}

function initProductCard(card: HTMLElement): void {
  if (card.dataset.productCardInitialized === 'true') {
    return;
  }

  const form = card.querySelector<HTMLFormElement>('[data-product-card-form]');
  const input = card.querySelector<HTMLInputElement>('[data-quantity-input]');
  if (!form || !input) {
    return;
  }

  // Ставим маркер только после нахождения всех обязательных элементов.
  card.dataset.productCardInitialized = 'true';

  form.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-quantity-action]');
    if (!button || button.disabled || !form.contains(button)) {
      return;
    }

    const current = normalizeQuantity(input.value);
    const next = button.dataset.quantityAction === 'increase' ? current + 1 : current - 1;
    setQuantity(input, next);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const normalizeInput = (): void => setQuantity(input, normalizeQuantity(input.value));
  input.addEventListener('blur', normalizeInput);
  input.addEventListener('change', normalizeInput);

  form.addEventListener('submit', (event) => {
    // На демонстрационном этапе HTTP-запросы запрещены всегда.
    event.preventDefault();
    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submitButton?.disabled) {
      return;
    }

    normalizeInput();
    const productId = form.querySelector<HTMLInputElement>('input[name="productId"]')?.value ?? '';
    const quantity = normalizeQuantity(input.value);
    const detail = { productId, quantity };

    card.dispatchEvent(
      new CustomEvent('product-card:demo-submit', {
        bubbles: true,
        composed: true,
        detail,
      }),
    );

    // Техническая обратная связь, не сообщение об успешной покупке.
    const output = form.querySelector<HTMLOutputElement>('[data-product-card-output]');
    if (output) {
      output.value = `Демо-данные: productId=${productId}, quantity=${quantity}`;
      output.hidden = false;
    }
  });
}

/**
 * Инициализирует только новые карточки. Функцию можно повторно вызвать
 * с document или контейнером после динамического добавления разметки.
 */
export function initProductCards(root: ParentNode = document): void {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-product-card]'));
  if (root instanceof HTMLElement && root.matches('[data-product-card]')) {
    cards.unshift(root);
  }
  cards.forEach(initProductCard);
}
