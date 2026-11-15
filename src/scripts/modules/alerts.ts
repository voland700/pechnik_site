/**
 * SweetAlert2 — обёртка для уведомлений и подтверждений.
 *
 * Библиотека НЕ инициализируется глобально: используйте функции-обёртки
 * `notify.*` по месту. Для демонстрации предусмотрена автопривязка
 * к элементам [data-alert] (initAlerts).
 */
import Swal from 'sweetalert2';

/** Базовые настройки в фирменном стиле */
const base = Swal.mixin({
  confirmButtonColor: '#ff9c00',
  cancelButtonColor: '#4f5a6c',
  buttonsStyling: true,
});

/** Готовые сценарии уведомлений */
export const notify = {
  success(title: string, text = ''): void {
    void base.fire({ icon: 'success', title, text });
  },
  error(title: string, text = ''): void {
    void base.fire({ icon: 'error', title, text });
  },
  info(title: string, text = ''): void {
    void base.fire({ icon: 'info', title, text });
  },
  /** Подтверждение действия; возвращает Promise<boolean> */
  async confirm(title: string, text = ''): Promise<boolean> {
    const result = await base.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Да',
      cancelButtonText: 'Отмена',
    });
    return result.isConfirmed;
  },
};

/**
 * Демонстрационная привязка: <button data-alert="Текст сообщения">.
 * Запускается только при наличии таких элементов.
 */
export function initAlerts(): void {
  const triggers = document.querySelectorAll<HTMLElement>('[data-alert]');
  if (triggers.length === 0) {
    return;
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      notify.info('SweetAlert2', trigger.dataset.alert ?? 'Демонстрационное сообщение');
    });
  });
}
