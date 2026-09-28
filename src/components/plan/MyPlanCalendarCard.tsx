import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { type MyPlanCalendarDay } from '@/services/api';

const WEEKDAYS = [
  { uz: 'Du', en: 'Mo', ru: 'Пн' },
  { uz: 'Se', en: 'Tu', ru: 'Вт' },
  { uz: 'Ch', en: 'We', ru: 'Ср' },
  { uz: 'Pa', en: 'Th', ru: 'Чт' },
  { uz: 'Ju', en: 'Fr', ru: 'Пт' },
  { uz: 'Sh', en: 'Sa', ru: 'Сб' },
  { uz: 'Ya', en: 'Su', ru: 'Вс' },
];

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayStr(): string {
  const d = new Date();
  return `${currentMonth()}-${String(d.getDate()).padStart(2, '0')}`;
}

function cellTone(day: MyPlanCalendarDay, defaultGoal: number): string {
  if (!day.calendarApplies) return 'bg-slate-100 text-slate-400 dark:bg-[var(--learn-surface)] dark:text-slate-500';
  if (day.goal === 0) return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300';
  if (day.goal < defaultGoal) return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
  if (day.goal === defaultGoal) return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  return 'bg-emerald-500 text-white dark:bg-emerald-600';
}

/** Xodimning o'z plan kalendari — faqat ko'rish, o'zgartirib bo'lmaydi. */
export function MyPlanCalendarCard() {
  const { t, lang } = useTranslation();
  const [month, setMonth] = useState(currentMonth);
  const [selected, setSelected] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-plan-calendar', month],
    queryFn: () => mobileApi.getMyPlanCalendar(month),
  });

  const [y, m] = month.split('-').map(Number);
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString(
    lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ',
    { month: 'long', year: 'numeric' },
  );
  const today = todayStr();
  const days = data?.days ?? [];
  const firstDow = days.length ? (new Date(y, m - 1, 1).getDay() + 6) % 7 : 0;
  const selectedDay = days.find((d) => d.date === selected) ?? null;
  const defaultGoal = data?.defaultGoal ?? 10;

  return (
    <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <CalendarDays className="h-5 w-5 text-blue-600 dark:text-[var(--learn-blue)]" />
          {t({ uz: 'Mening planim', en: 'My plan', ru: 'Мой план' })}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="prev"
            onClick={() => {
              setMonth((cur) => shiftMonth(cur, -1));
              setSelected(null);
            }}
            className="rounded-xl border border-slate-200 p-1.5 dark:border-[var(--learn-border)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[110px] text-center text-xs font-semibold capitalize text-slate-700 dark:text-slate-200">
            {monthLabel}
          </span>
          <button
            type="button"
            aria-label="next"
            onClick={() => {
              setMonth((cur) => shiftMonth(cur, 1));
              setSelected(null);
            }}
            className="rounded-xl border border-slate-200 p-1.5 dark:border-[var(--learn-border)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {data ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t({
            uz: `${data.workingDays} ish kuni • oy bo‘yicha ${data.totalGoal} ta to‘g‘ri javob`,
            en: `${data.workingDays} working days • ${data.totalGoal} correct answers this month`,
            ru: `${data.workingDays} раб. дней • ${data.totalGoal} верных ответов за месяц`,
          })}
        </p>
      ) : null}

      {isLoading ? (
        <p className="py-8 text-center text-sm text-slate-500">
          {t({ uz: 'Yuklanmoqda…', en: 'Loading…', ru: 'Загрузка…' })}
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w.en}
                className={clsx(
                  'text-center text-[10px] font-semibold',
                  i >= 5 ? 'text-red-500' : 'text-slate-400',
                )}
              >
                {t(w)}
              </div>
            ))}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelected(day.date === selected ? null : day.date)}
                className={clsx(
                  'relative flex h-11 flex-col items-center justify-center rounded-xl text-center',
                  cellTone(day, defaultGoal),
                  day.date === today && 'ring-2 ring-blue-500',
                  day.date === selected && 'ring-2 ring-amber-400',
                )}
              >
                <span className="text-[10px] leading-none opacity-70">
                  {Number(day.date.slice(8))}
                </span>
                <span className="text-sm font-extrabold leading-tight tabular-nums">
                  {day.calendarApplies ? day.goal : '—'}
                </span>
                {day.userGoal != null ? (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-current" />
                ) : null}
              </button>
            ))}
          </div>

          {selectedDay ? (
            <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-[var(--learn-surface)] dark:text-slate-200">
              <b>{selectedDay.date.split('-').reverse().join('.')}</b>
              {' — '}
              {selectedDay.goal === 0
                ? t({ uz: 'plan yo‘q (bonus XP kuni)', en: 'no plan (bonus XP day)', ru: 'плана нет (день бонус XP)' })
                : t({
                    uz: `${selectedDay.goal} ta to‘g‘ri javob`,
                    en: `${selectedDay.goal} correct answers`,
                    ru: `${selectedDay.goal} верных ответов`,
                  })}
              {selectedDay.holidayName ? ` • ${selectedDay.holidayName}` : ''}
              {selectedDay.userGoal != null
                ? ` • ${t({ uz: 'siz uchun maxsus', en: 'set for you', ru: 'установлено для вас' })}`
                : ''}
            </div>
          ) : null}

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="h-3.5 w-3.5" />
            {t({
              uz: 'Planni faqat markaziy apparat o‘zgartira oladi',
              en: 'Only head office can change the plan',
              ru: 'План может изменить только центральный аппарат',
            })}
          </p>
        </>
      )}
    </div>
  );
}
