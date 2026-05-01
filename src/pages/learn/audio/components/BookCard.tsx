import { Link } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import type { AudioBookSummary } from '../types';
import clsx from 'clsx';

export default function BookCard({ book }: { book: AudioBookSummary }) {
  return (
    <Link
      to={`/learn/library/${book.id}`}
      className={clsx(
        'group block overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-md active:translate-y-0',
        'dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-[#2a2108] dark:text-[var(--learn-gold)] dark:ring-amber-600/20">
          <Headphones className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {book.title}
          </p>
          {book.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-[var(--learn-muted)]">
              {book.description}
            </p>
          ) : null}
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[var(--learn-muted)]">
            {book.chaptersCount} bob
          </p>
        </div>
      </div>
    </Link>
  );
}
