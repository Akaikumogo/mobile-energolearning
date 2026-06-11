import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pause, Play } from 'lucide-react';
import clsx from 'clsx';
import { useAudioPlayer } from '@/providers/AudioPlayerProvider';
import { useQuery } from '@tanstack/react-query';
import mobileApi, { resolveMediaUrl } from '@/services/api';
import WaveformBars from './components/WaveformBars';

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function AudioBookDetailPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const bookQuery = useQuery({
    queryKey: ['audio-book', bookId ?? ''],
    queryFn: () => mobileApi.getAudioBook(bookId!),
    enabled: !!bookId,
  });
  const book = bookQuery.data ?? null;

  const {
    currentBookId,
    isPlaying,
    progressSeconds,
    durationSeconds,
    playBook,
    togglePlayPause,
    seek,
  } = useAudioPlayer();

  if (!book && !bookQuery.isLoading) {
    return (
      <div className="mx-auto max-w-lg px-safe-4 py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 dark:bg-[var(--learn-card)] dark:text-slate-100 dark:ring-[var(--learn-border)]"
        >
          <ChevronLeft className="h-4 w-4" />
          Orqaga
        </button>
        <p className="mt-6 text-sm text-slate-600 dark:text-[var(--learn-muted)]">
          Kitob topilmadi.
        </p>
      </div>
    );
  }

  const isThisBook = currentBookId === book?.id;
  const hasAudio = !!book?.audioUrl;
  const coverUrl = book?.coverUrl ? resolveMediaUrl(book.coverUrl) : null;

  const handlePlayPause = () => {
    if (!book?.audioUrl) return;
    if (isThisBook) {
      togglePlayPause();
    } else {
      playBook({ id: book.id, title: book.title, audioUrl: book.audioUrl });
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-0 pb-10">
      {/* Cover header */}
      <div className="relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book?.title ?? ''}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-amber-600 to-amber-800 dark:from-[#3a2a00] dark:to-[#1a1200] flex items-center justify-center">
            <WaveformBars
              isPlaying={isThisBook && isPlaying}
              barCount={9}
              className="text-white/60"
            />
          </div>
        )}
        {/* Back button over cover */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-safe-4 inline-flex items-center gap-1.5 rounded-xl bg-black/40 px-3 py-2 text-sm font-semibold text-white backdrop-blur"
        >
          <ChevronLeft className="h-4 w-4" />
          Kutubxona
        </button>
      </div>

      <div className="px-safe-4 space-y-5 pt-5">
        {/* Title + description */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-[var(--learn-gold)]">
            Audiokitob
          </p>
          <p className="mt-1 text-2xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">
            {bookQuery.isLoading ? '...' : (book?.title ?? '')}
          </p>
          {book?.description ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-[var(--learn-muted)]">
              {book.description}
            </p>
          ) : null}
        </div>

        {/* Waveform animation */}
        {isThisBook && (
          <div className={clsx(
            'flex items-center justify-center py-3 rounded-2xl',
            isPlaying
              ? 'bg-amber-50 dark:bg-[#2a2108]/60'
              : 'bg-slate-50 dark:bg-[var(--learn-card)]',
          )}>
            <WaveformBars
              isPlaying={isPlaying}
              barCount={11}
              className={isPlaying
                ? 'text-amber-600 dark:text-[var(--learn-gold)]'
                : 'text-slate-400 dark:text-[var(--learn-muted)]'
              }
            />
          </div>
        )}

        {/* Progress bar */}
        {isThisBook && durationSeconds > 0 && (
          <div className="space-y-1">
            <input
              aria-label="Seek"
              type="range"
              min={0}
              max={Math.max(1, durationSeconds)}
              step={0.5}
              value={Math.min(durationSeconds, progressSeconds)}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1.5 rounded-full accent-amber-600 dark:accent-[var(--learn-gold)]"
            />
            <div className="flex justify-between text-[11px] font-semibold tabular-nums text-slate-500 dark:text-[var(--learn-muted)]">
              <span>{formatTime(progressSeconds)}</span>
              <span>{formatTime(durationSeconds)}</span>
            </div>
          </div>
        )}

        {/* Play/Pause button */}
        <button
          type="button"
          onClick={handlePlayPause}
          disabled={!hasAudio || bookQuery.isLoading}
          className={clsx(
            'w-full inline-flex items-center justify-center gap-3 rounded-2xl px-4 py-4 text-lg font-bold shadow-sm ring-1 transition active:scale-[0.99]',
            'bg-amber-600 text-white ring-amber-200 dark:bg-[var(--learn-gold)] dark:text-black dark:ring-amber-600/35',
            (!hasAudio || bookQuery.isLoading) && 'opacity-50 cursor-not-allowed',
          )}
        >
          {isThisBook && isPlaying ? (
            <>
              <Pause className="h-6 w-6" />
              To'xtatish
            </>
          ) : (
            <>
              <Play className="h-6 w-6" />
              {isThisBook ? 'Davom ettirish' : 'Tinglash'}
            </>
          )}
        </button>

        {!hasAudio && !bookQuery.isLoading && (
          <p className="text-center text-sm text-slate-500 dark:text-[var(--learn-muted)]">
            Bu kitobga hali audio fayl yuklanmagan.
          </p>
        )}
      </div>
    </div>
  );
}
