import { useMemo } from 'react';
import { LibraryBig } from 'lucide-react';
import { useAudioPlayer } from '@/providers/AudioPlayerProvider';
import BookCard from './components/BookCard';
import LastListenedCard from './components/LastListenedCard';
import { useQuery } from '@tanstack/react-query';
import mobileApi from '@/services/api';

export default function AudioLibraryPage() {
  const { getLastListened, resumeLastListened } = useAudioPlayer();
  const last = getLastListened();

  const booksQuery = useQuery({
    queryKey: ['audio-books'],
    queryFn: () => mobileApi.listAudioBooks(),
  });
  const books = booksQuery.data ?? [];

  const lastBookQuery = useQuery({
    queryKey: ['audio-book', last?.bookId ?? ''],
    queryFn: () => mobileApi.getAudioBook(last!.bookId),
    enabled: !!last?.bookId,
  });

  const lastResolved = useMemo(() => {
    if (!last) return null;
    const book = lastBookQuery.data ?? null;
    if (!book) return null;
    const chapter = book.chapters.find((c) => c.id === last.chapterId) ?? null;
    const paragraph = chapter?.paragraphs.find((p) => p.id === last.paragraphId) ?? null;
    if (!chapter || !paragraph) return null;
    return { book, chapterTitle: chapter.title, paragraphText: paragraph.text };
  }, [last, lastBookQuery.data]);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-safe-4 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100 dark:bg-[#2a2108] dark:text-[var(--learn-gold)] dark:ring-amber-600/20">
          <LibraryBig className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
            Kutubxona
          </p>
          <p className="text-sm text-slate-600 dark:text-[var(--learn-muted)]">
            Audiokitoblarni tinglang
          </p>
        </div>
      </div>

      {last && lastResolved ? (
        <LastListenedCard
          last={last}
          book={lastResolved.book}
          chapterTitle={lastResolved.chapterTitle}
          paragraphText={lastResolved.paragraphText}
          onContinue={resumeLastListened}
        />
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Kitoblar
        </p>
        <div className="grid grid-cols-1 gap-3">
          {booksQuery.isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]">
              Yuklanyapti...
            </div>
          ) : booksQuery.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-600/35 dark:bg-[#2d1218]/70 dark:text-rose-200">
              Kutubxona yuklashda xatolik.
            </div>
          ) : books.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]">
              Hozircha audiokitoblar yo‘q. Administrator kontent qo‘shgandan keyin shu yerda chiqadi.
            </div>
          ) : (
            books.map((book) => <BookCard key={book.id} book={book} />)
          )}
        </div>
      </div>
    </div>
  );
}
