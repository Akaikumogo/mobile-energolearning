import { useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FileText,
  LibraryBig,
  Headphones,
} from 'lucide-react';
import { useAudioPlayer } from '@/providers/AudioPlayerProvider';
import BookCard from './components/BookCard';
import LastListenedCard from './components/LastListenedCard';
import { useQuery } from '@tanstack/react-query';
import mobileApi, {
  resolveMediaUrl,
  type LibraryDocument,
} from '@/services/api';
import clsx from 'clsx';

type LibraryTab = 'documents' | 'audio';

function formatSize(size: string | null | undefined) {
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentCard({
  doc,
  onPreview,
}: {
  doc: LibraryDocument;
  onPreview: (doc: LibraryDocument) => void;
}) {
  const url = resolveMediaUrl(doc.fileUrl);
  const sizeLabel = formatSize(doc.fileSize);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-slate-100">
            {doc.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-[var(--learn-muted)]">
            {doc.fileKind}
            {sizeLabel ? ` · ${sizeLabel}` : ''}
          </p>
          {doc.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-[var(--learn-muted)]">
              {doc.description}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onPreview(doc)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 ring-1 ring-amber-100 dark:bg-[#2a2108] dark:text-[var(--learn-gold)] dark:ring-amber-600/20"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
            <a
              href={url}
              download={doc.originalName || doc.title}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-[var(--learn-gold)] dark:text-slate-950"
            >
              <Download className="h-3.5 w-3.5" />
              Yuklab olish
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AudioLibraryPage() {
  const [tab, setTab] = useState<LibraryTab>('documents');
  const [previewDoc, setPreviewDoc] = useState<LibraryDocument | null>(null);
  const { getLastListened, resumeLastListened } = useAudioPlayer();
  const last = getLastListened();

  const booksQuery = useQuery({
    queryKey: ['audio-books'],
    queryFn: () => mobileApi.listAudioBooks(),
    enabled: tab === 'audio',
  });
  const books = booksQuery.data ?? [];

  const docsQuery = useQuery({
    queryKey: ['library-documents'],
    queryFn: () => mobileApi.listLibraryDocuments(),
    enabled: tab === 'documents',
  });
  const docs = docsQuery.data ?? [];

  const lastBookQuery = useQuery({
    queryKey: ['audio-book', last?.bookId ?? ''],
    queryFn: () => mobileApi.getAudioBook(last!.bookId),
    enabled: tab === 'audio' && !!last?.bookId,
  });

  const lastResolved = useMemo(() => {
    if (!last) return null;
    const book = lastBookQuery.data ?? null;
    if (!book) return null;
    const chapter = book.chapters.find((c) => c.id === last.chapterId) ?? null;
    const paragraph =
      chapter?.paragraphs.find((p) => p.id === last.paragraphId) ?? null;
    if (!chapter || !paragraph) return null;
    return { book, chapterTitle: chapter.title, paragraphText: paragraph.text };
  }, [last, lastBookQuery.data]);

  const previewUrl = previewDoc
    ? resolveMediaUrl(previewDoc.fileUrl)
    : '';

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
            Hujjatlar va audiokitoblar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-[#1a1b1c]">
        <button
          type="button"
          onClick={() => setTab('documents')}
          className={clsx(
            'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition',
            tab === 'documents'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-[var(--learn-card)] dark:text-slate-100'
              : 'text-slate-500 dark:text-[var(--learn-muted)]',
          )}
        >
          <FileText className="h-4 w-4" />
          Hujjatlar
        </button>
        <button
          type="button"
          onClick={() => setTab('audio')}
          className={clsx(
            'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-bold transition',
            tab === 'audio'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-[var(--learn-card)] dark:text-slate-100'
              : 'text-slate-500 dark:text-[var(--learn-muted)]',
          )}
        >
          <Headphones className="h-4 w-4" />
          Audio
        </button>
      </div>

      {tab === 'documents' ? (
        <div className="space-y-3">
          {docsQuery.isLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]">
              Yuklanyapti...
            </div>
          ) : docsQuery.isError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-600/35 dark:bg-[#2d1218]/70 dark:text-rose-200">
              Hujjatlar yuklashda xatolik.
            </div>
          ) : docs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]">
              Hozircha PDF/Word hujjatlar yo‘q.
            </div>
          ) : (
            docs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onPreview={setPreviewDoc}
              />
            ))
          )}
        </div>
      ) : (
        <>
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
              Audiokitoblar
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
                  Hozircha audiokitoblar yo‘q.
                </div>
              ) : (
                books.map((book) => <BookCard key={book.id} book={book} />)
              )}
            </div>
          </div>
        </>
      )}

      {previewDoc ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/60 p-3 backdrop-blur-sm">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-[#121314]">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-[var(--learn-border)]">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900 dark:text-slate-100">
                  {previewDoc.title}
                </p>
                <p className="text-xs text-slate-500">{previewDoc.fileKind}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-[#1a1b1c] dark:text-slate-200"
              >
                Yopish
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-slate-50 dark:bg-[#0d0e0f]">
              {previewDoc.fileKind === 'PDF' ? (
                <iframe
                  title={previewDoc.title}
                  src={previewUrl}
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <FileText className="h-12 w-12 text-slate-400" />
                  <p className="max-w-sm text-sm text-slate-600 dark:text-[var(--learn-muted)]">
                    Word fayllarni brauzerda to‘liq preview qilib bo‘lmaydi.
                    Yuklab olib oching.
                  </p>
                  <a
                    href={previewUrl}
                    download={previewDoc.originalName || previewDoc.title}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white dark:bg-[var(--learn-gold)] dark:text-slate-950"
                  >
                    <Download className="h-4 w-4" />
                    Yuklab olish
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
