import { useMemo, useState } from 'react';
import { ChevronDown, Pause, Play } from 'lucide-react';
import clsx from 'clsx';
import type { AudioChapter } from '../types';
import ParagraphItem from './ParagraphItem';

export default function ChapterAccordion({
  chapter,
  isActive,
  activeParagraphId,
  isPlaying,
  onPlayChapter,
  onPlayParagraph,
}: {
  chapter: AudioChapter;
  isActive: boolean;
  activeParagraphId: string | null;
  isPlaying: boolean;
  onPlayChapter: () => void;
  onPlayParagraph: (paragraphId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const paragraphs = useMemo(
    () => [...chapter.paragraphs].sort((a, b) => a.order - b.order),
    [chapter.paragraphs],
  );

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-2xl border',
        isActive
          ? 'border-amber-200 bg-amber-50/70 dark:border-amber-600/30 dark:bg-[#201a0b]/70'
          : 'border-slate-200 bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
      )}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
            {chapter.title}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-[var(--learn-muted)]">
            {paragraphs.length} paragraf
          </p>
        </button>

        <button
          type="button"
          onClick={onPlayChapter}
          disabled={paragraphs.length === 0}
          className={clsx(
            'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ring-1 transition',
            paragraphs.length === 0 && 'cursor-not-allowed opacity-50',
            isActive
              ? 'bg-amber-600 text-white ring-amber-200 dark:bg-[var(--learn-gold)] dark:text-black dark:ring-amber-600/35'
              : 'bg-slate-100 text-slate-800 ring-slate-200 dark:bg-[#101a2a] dark:text-slate-100 dark:ring-[var(--learn-border)]',
          )}
        >
          {isActive && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          Play
        </button>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={clsx(
            'inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1',
            'bg-white text-slate-700 ring-slate-200 dark:bg-[var(--learn-surface)] dark:text-slate-200 dark:ring-[var(--learn-border)]',
          )}
        >
          <ChevronDown
            className={clsx('h-5 w-5 transition-transform', open ? 'rotate-180' : 'rotate-0')}
          />
        </button>
      </div>

      {open ? (
        <div className="space-y-2 border-t border-slate-200/80 px-4 pb-4 pt-3 dark:border-[var(--learn-border)]">
          {paragraphs.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-[var(--learn-muted)]">
              Bu bobda audio paragraf yo‘q.
            </div>
          ) : (
            paragraphs.map((p) => (
              <ParagraphItem
                key={p.id}
                paragraph={p}
                isActive={activeParagraphId === p.id}
                isPlaying={isPlaying}
                onPlay={() => onPlayParagraph(p.id)}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
