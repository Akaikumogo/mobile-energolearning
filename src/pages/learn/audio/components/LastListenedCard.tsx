import { Clock, Play } from 'lucide-react';
import clsx from 'clsx';
import type { AudioBookDetail, LastListened } from '../types';

export default function LastListenedCard({
  last,
  book,
  chapterTitle,
  paragraphText,
  onContinue,
}: {
  last: LastListened;
  book: AudioBookDetail;
  chapterTitle: string;
  paragraphText: string;
  onContinue: () => void;
}) {
  const time = new Date(last.updatedAtIso);

  return (
    <div
      className={clsx(
        'rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm',
        'dark:border-amber-600/25 dark:from-[#1f1b0a] dark:to-[var(--learn-card)]',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-[var(--learn-gold)]">
            So‘ngi eshitilgan audio
          </p>
          <p className="mt-1 truncate text-base font-bold text-slate-900 dark:text-slate-100">
            {book.title}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            {chapterTitle}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-[var(--learn-muted)]">
            {paragraphText}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-[var(--learn-muted)]">
            <Clock className="h-4 w-4" />
            <span>
              {Number.isFinite(time.getTime()) ? time.toLocaleString() : last.updatedAtIso}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className={clsx(
            'inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm',
            'active:scale-[0.98] dark:bg-[var(--learn-gold)] dark:text-black',
          )}
        >
          <Play className="h-4 w-4" />
          Davom ettirish
        </button>
      </div>
    </div>
  );
}
