import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Languages } from 'lucide-react';
import clsx from 'clsx';
import { CheerfulBackLink } from '@/components/CheerfulBackLink';
import { useCyrillicNewsText } from '@/hooks/useCyrillicNewsText';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { type AppNotification } from '@/services/api';
import {
  CYRILLIC_NEWS_ID,
  markNewsRead,
  useReadNewsIds,
  visibleLocalNews,
} from '@/utils/news';

function formatDate(value: Date | string, lang: string) {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  const locale = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-GB' : 'uz-UZ';
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function UnreadDot({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" aria-hidden />;
}

export default function NewsPage() {
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cyrillicText = useCyrillicNewsText();
  const readIds = useReadNewsIds();
  const localNews = visibleLocalNews();

  const notificationsQuery = useQuery({
    queryKey: ['notifications-me'],
    queryFn: () => mobileApi.getMyNotifications(),
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => mobileApi.markNotificationRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<AppNotification[]>(['notifications-me'], (prev) =>
        prev?.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    },
  });

  const notifications = notificationsQuery.data ?? [];

  return (
    <div className="px-4 py-4">
      <CheerfulBackLink to="/learn">
        {t({ uz: 'Bosh sahifa', en: 'Home', ru: 'Главная' })}
      </CheerfulBackLink>

      <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {t({ uz: 'Yangiliklar', en: 'News', ru: 'Новости' })}
      </h1>

      <div className="space-y-3">
        {localNews.map((item) => {
          if (item.id !== CYRILLIC_NEWS_ID) return null;
          const unread = !readIds.includes(item.id);
          return (
            <article
              key={item.id}
              onClick={() => markNewsRead(item.id)}
              className={clsx(
                'rounded-3xl border bg-white p-4 shadow-sm dark:bg-[var(--learn-card)]',
                unread
                  ? 'border-amber-300 dark:border-[var(--learn-gold)]/50'
                  : 'border-slate-200 dark:border-[var(--learn-border)]',
              )}
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-[var(--learn-gold)]">
                  <Languages className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-[var(--learn-gold)]">
                    {cyrillicText.newsLabel} · {formatDate(item.publishedAt, lang)}
                  </p>
                  <h2 className="font-extrabold leading-tight text-slate-900 dark:text-white">
                    {cyrillicText.title}
                  </h2>
                </div>
                <UnreadDot show={unread} />
              </div>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {cyrillicText.body}
              </p>
              {lang !== 'uz-cyrl' ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markNewsRead(item.id);
                    setLang('uz-cyrl');
                  }}
                  className="mt-3 w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 dark:bg-[var(--learn-blue)]"
                >
                  {cyrillicText.tryLabel}
                </button>
              ) : null}
            </article>
          );
        })}

        {notifications.map((n) => (
          <article
            key={n.id}
            onClick={() => {
              if (!n.isRead && !markReadMut.isPending) markReadMut.mutate(n.id);
              const data = n.data as { type?: string; token?: string } | null;
              if (data?.type === 'proctor_room' && data.token) {
                navigate(`/learn/proctor?token=${encodeURIComponent(data.token)}`);
              }
            }}
            className={clsx(
              'rounded-3xl border bg-white p-4 shadow-sm dark:bg-[var(--learn-card)]',
              n.isRead
                ? 'border-slate-200 dark:border-[var(--learn-border)]'
                : 'border-blue-300 dark:border-[var(--learn-blue)]/50',
            )}
          >
            <div className="mb-1 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-[var(--learn-blue)]">
                <Bell className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-[var(--learn-muted)]">
                  {formatDate(n.createdAt, lang)}
                </p>
                <h2 className="font-bold leading-tight text-slate-900 dark:text-white">
                  {n.title}
                </h2>
              </div>
              <UnreadDot show={!n.isRead} />
            </div>
            {n.body ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {n.body}
              </p>
            ) : null}
          </article>
        ))}

        {notificationsQuery.isLoading ? (
          <p className="text-center text-sm text-slate-500">
            {t({ uz: 'Yuklanmoqda…', en: 'Loading…', ru: 'Загрузка…' })}
          </p>
        ) : null}

        {!notificationsQuery.isLoading && localNews.length === 0 && notifications.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-[var(--learn-border)] dark:text-[var(--learn-muted)]">
            {t({ uz: 'Hozircha yangiliklar yo‘q', en: 'No news yet', ru: 'Пока новостей нет' })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
