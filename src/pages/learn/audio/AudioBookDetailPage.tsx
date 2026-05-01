import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pause, Play } from 'lucide-react';
import clsx from 'clsx';
import ChapterAccordion from './components/ChapterAccordion';
import { useAudioPlayer, type AudioQueueItem } from '@/providers/AudioPlayerProvider';
import { useQuery } from '@tanstack/react-query';
import mobileApi from '@/services/api';

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
    currentChapterId,
    currentParagraphId,
    isPlaying,
    playQueue,
    togglePlayPause,
  } = useAudioPlayer();

  const chapters = useMemo(() => {
    if (!book) return [];
    return [...book.chapters].sort((a, b) => a.order - b.order);
  }, [book]);

  const flattenedBookQueue = useMemo(() => {
    if (!book) return [] as AudioQueueItem[];
    const items: AudioQueueItem[] = [];
    for (const ch of chapters) {
      const ps = [...ch.paragraphs].sort((a, b) => a.order - b.order);
      for (const p of ps) {
        items.push({
          bookId: book.id,
          bookTitle: book.title,
          chapterId: ch.id,
          chapterTitle: ch.title,
          paragraphId: p.id,
          text: p.text,
          audioUrl: p.audioUrl,
        });
      }
    }
    return items;
  }, [book, chapters]);

  if (!book) {
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
          {bookQuery.isLoading ? 'Yuklanyapti...' : 'Kitob topilmadi.'}
        </p>
      </div>
    );
  }

  const isThisBookActive = currentBookId === book.id;

  return (
    <div className="mx-auto max-w-lg space-y-5 px-safe-4 py-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 dark:bg-[var(--learn-card)] dark:text-slate-100 dark:ring-[var(--learn-border)]"
      >
        <ChevronLeft className="h-4 w-4" />
        Kutubxona
      </button>

      <div
        className={clsx(
          'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-[var(--learn-gold)]">
          Audiokitob
        </p>
        <p className="mt-1 text-xl font-extrabold leading-tight text-slate-900 dark:text-slate-100">
          {book.title}
        </p>
        {book.description ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-[var(--learn-muted)]">
            {book.description}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            if (isThisBookActive) {
              togglePlayPause();
              return;
            }
            playQueue(flattenedBookQueue, 0);
          }}
          className={clsx(
            'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-base font-bold shadow-sm ring-1 transition active:scale-[0.99]',
            'bg-amber-600 text-white ring-amber-200 dark:bg-[var(--learn-gold)] dark:text-black dark:ring-amber-600/35',
          )}
        >
          {isThisBookActive && isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
          {isThisBookActive && isPlaying ? 'Pause' : 'Play (kitob bo‘ylab)'}
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
          Boblar
        </p>
        <div className="space-y-3">
          {chapters.map((ch) => (
            <ChapterAccordion
              key={ch.id}
              chapter={ch}
              isActive={currentChapterId === ch.id}
              activeParagraphId={currentParagraphId}
              isPlaying={isPlaying && isThisBookActive}
              onPlayChapter={() => {
                if (currentChapterId === ch.id && isPlaying) {
                  togglePlayPause();
                  return;
                }
                const items: AudioQueueItem[] = [...ch.paragraphs]
                  .sort((a, b) => a.order - b.order)
                  .map((p) => ({
                    bookId: book.id,
                    bookTitle: book.title,
                    chapterId: ch.id,
                    chapterTitle: ch.title,
                    paragraphId: p.id,
                    text: p.text,
                    audioUrl: p.audioUrl,
                  }));
                playQueue(items, 0);
              }}
              onPlayParagraph={(pid) => {
                if (currentParagraphId === pid && isPlaying) {
                  togglePlayPause();
                  return;
                }
                const startIndex = Math.max(
                  0,
                  flattenedBookQueue.findIndex((x) => x.paragraphId === pid),
                );
                playQueue(flattenedBookQueue, startIndex);
              }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]">
        Audio fayllar faqat paragrafga bog‘langan. Kitob yoki bob darajasida alohida audio yo‘q.
      </div>
    </div>
  );
}
