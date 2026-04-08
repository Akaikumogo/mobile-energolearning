import clsx from 'clsx';
import type { TheorySlide } from '@/services/api';

export default function TheorySlideCard({ slide }: { slide: TheorySlide }) {
  return (
    <div
      className={clsx(
        'relative mb-6 overflow-hidden rounded-3xl border-2 p-4 shadow-md dark:shadow-[0_0_40px_rgba(61,142,255,0.12)]',
        slide.warn
          ? 'border-amber-400/90 bg-amber-50/90 dark:border-amber-500/50 dark:bg-[#2a1f0d]/90'
          : 'border-slate-200/90 bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
      )}
    >
      <h2 className="mb-3 text-lg font-extrabold leading-snug text-slate-900 dark:text-white">
        {slide.head}
      </h2>
      <ul className="space-y-2 text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
        {slide.items.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-slate-400 dark:text-slate-500" aria-hidden>
              •
            </span>
            <span className="min-w-0 flex-1">{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
