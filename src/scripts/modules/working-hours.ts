/**
 * Динамический статус магазина: «Сейчас работаем» / «Магазин закрыт».
 *
 * График общий для обоих центров: Пн–Вс 09:00–18:00 (Europe/Moscow),
 * 09:00 включительно, 18:00 исключительно. Статус вычисляется по
 * московскому времени независимо от часового пояса пользователя.
 *
 * В статическом HTML статус скрыт (показан только график) — здесь он
 * вычисляется и показывается. Обновление: при загрузке, при возвращении
 * на вкладку (visibilitychange) и по таймеру ровно на границах
 * 09:00/18:00 (без секундных интервалов и тяжёлых библиотек).
 */
import { workingHours } from '../../data/contacts';
import { qsa } from '../utils/dom';

/** Текущее московское время в минутах от полуночи */
function moscowMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: workingHours.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

function isOpen(now: Date): boolean {
  const minutes = moscowMinutes(now);
  return minutes >= workingHours.openMinutes && minutes < workingHours.closeMinutes;
}

/** Миллисекунды до ближайшей границы графика (09:00 или 18:00 по Москве) */
function msToNextBoundary(now: Date): number {
  const moscowNow = new Date(now.toLocaleString('en-US', { timeZone: workingHours.timeZone }));
  const minutes = moscowMinutes(now);
  const targetMinutes =
    minutes < workingHours.openMinutes
      ? workingHours.openMinutes
      : minutes < workingHours.closeMinutes
        ? workingHours.closeMinutes
        : workingHours.openMinutes + 24 * 60;

  const target = new Date(moscowNow);
  target.setHours(0, targetMinutes, 0, 0);
  // +1 секунда запаса, чтобы не сработать ровно на границе до её наступления
  return Math.max(target.getTime() - moscowNow.getTime(), 0) + 1000;
}

export function initWorkingHours(): void {
  const blocks = qsa('[data-working-hours]');
  if (blocks.length === 0) {
    return;
  }

  let timer: number | undefined;

  function update(): void {
    const open = isOpen(new Date());
    blocks.forEach((block) => {
      const status = block.querySelector<HTMLElement>('[data-working-hours-status]');
      const text = block.querySelector<HTMLElement>('[data-working-hours-text]');
      if (!status || !text) {
        return;
      }
      status.classList.toggle('working-hours__status--open', open);
      status.classList.toggle('working-hours__status--closed', !open);
      text.textContent = open ? 'Сейчас работаем' : 'Магазин закрыт';
      status.hidden = false;
    });

    window.clearTimeout(timer);
    timer = window.setTimeout(update, msToNextBoundary(new Date()));
  }

  // Актуализация при возвращении пользователя на вкладку
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      update();
    }
  });

  update();
}
