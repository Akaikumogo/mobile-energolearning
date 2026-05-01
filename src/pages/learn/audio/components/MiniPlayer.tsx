import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import clsx from 'clsx';
import { useAudioPlayer } from '@/providers/AudioPlayerProvider';

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function MiniPlayer() {
  const {
    currentBookId,
    currentParagraphId,
    isPlaying,
    progressSeconds,
    durationSeconds,
    togglePlayPause,
    skipNext,
    skipPrev,
    seek,
    queue,
  } = useAudioPlayer();

  const canShow = !!currentParagraphId && !!queue.length;
  if (!canShow) return null;

  const currentItem = queue.find((q) => q.paragraphId === currentParagraphId) ?? null;

  return (
    <div
      className={clsx(
        'fixed left-0 right-0 z-30 px-safe-4',
        'bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))]',
      )}
    >
      <div
        className={clsx(
          'mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur',
          'dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]/95',
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
            {currentItem?.bookTitle ?? 'Audiokitob'}
          </p>
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-50">
            {currentItem?.text ?? '...'}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <input
              aria-label="Seek"
              type="range"
              min={0}
              max={Math.max(1, durationSeconds || 1)}
              step={0.5}
              value={Math.min(durationSeconds || 1, progressSeconds || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              className="h-1 flex-1 accent-amber-600 dark:accent-[var(--learn-gold)]"
            />
            <p className="w-[4.5rem] text-right text-[11px] font-semibold tabular-nums text-slate-600 dark:text-[var(--learn-muted)]">
              {formatTime(progressSeconds)} / {formatTime(durationSeconds)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={skipPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 ring-1 ring-slate-200 active:scale-[0.98] dark:bg-[#101a2a] dark:text-slate-100 dark:ring-[var(--learn-border)]"
            title="Prev"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={togglePlayPause}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm ring-1 ring-amber-200 active:scale-[0.98] dark:bg-[var(--learn-gold)] dark:text-black dark:ring-amber-600/35"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={skipNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 ring-1 ring-slate-200 active:scale-[0.98] dark:bg-[#101a2a] dark:text-slate-100 dark:ring-[var(--learn-border)]"
            title="Next"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
