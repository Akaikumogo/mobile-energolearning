import { Pause, Play } from 'lucide-react';
import clsx from 'clsx';
import type { AudioParagraph } from '../types';

export default function ParagraphItem({
  paragraph,
  isActive,
  isPlaying,
  onPlay,
}: {
  paragraph: AudioParagraph;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      className={clsx(
        'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition',
        isActive
          ? 'border-amber-200 bg-amber-50 text-slate-900 shadow-sm dark:border-amber-600/35 dark:bg-[#2a2108] dark:text-slate-50'
          : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-100 dark:hover:bg-[var(--learn-surface)]',
      )}
    >
      <span
        className={clsx(
          'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
          isActive
            ? 'bg-amber-600 text-white ring-amber-200 dark:bg-[var(--learn-gold)] dark:text-black dark:ring-amber-600/35'
            : 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-[#101a2a] dark:text-slate-200 dark:ring-[var(--learn-border)]',
        )}
      >
        {isActive && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">
          {paragraph.text}
        </span>
        <span className="mt-1 block text-xs text-slate-500 dark:text-[var(--learn-muted)]">
          Audio faqat shu paragrafga biriktirilgan
        </span>
      </span>
    </button>
  );
}

