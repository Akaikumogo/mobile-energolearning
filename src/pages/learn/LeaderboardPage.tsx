import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Crown, Trophy, Users } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { BACKEND_ORIGIN, type LeaderboardRow } from '@/services/api';

type Scope = 'global' | 'organization';

function getInitials(row: Pick<LeaderboardRow, 'firstName' | 'lastName'>) {
  const a = (row.firstName || '').trim();
  const b = (row.lastName || '').trim();
  return `${a ? a[0] : ''}${b ? b[0] : ''}`.toUpperCase() || 'U';
}

function RowAvatar({ row }: { row: LeaderboardRow }) {
  const initials = useMemo(() => getInitials(row), [row.firstName, row.lastName]);
  const src = row.avatarUrl ? `${BACKEND_ORIGIN}${row.avatarUrl}` : null;
  return (
    <div className="h-10 w-10 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {src ? (
        <img src={src} alt="avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
          {initials}
        </div>
      )}
    </div>
  );
}

function LeaderboardList({
  title,
  icon,
  rows,
  me,
  isLoading,
  isError,
}: {
  title: string;
  icon: React.ReactNode;
  rows: LeaderboardRow[] | undefined;
  me: LeaderboardRow | null | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <span className="text-slate-500 dark:text-slate-300">{icon}</span>
          <span>{title}</span>
        </div>
        {me?.rank ? (
          <div className="inline-flex items-center gap-1 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <Crown className="h-4 w-4" />
            <span>#{me.rank}</span>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-500">Loading…</div>
      ) : isError ? (
        <div className="p-8 text-center text-red-600">Failed to load</div>
      ) : rows?.length ? (
        <div className="mt-4 flex flex-col gap-2">
          {rows.map((row) => {
            const isMe = me?.userId && row.userId === me.userId;
            return (
              <div
                key={row.userId}
                className={clsx(
                  'flex items-center gap-3 rounded-2xl border px-3 py-3',
                  isMe
                    ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/30'
                    : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/30',
                )}
              >
                <div className="w-10 text-center text-sm font-extrabold text-slate-700 dark:text-slate-200">
                  {row.rank}
                </div>
                <RowAvatar row={row} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {row.firstName} {row.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {row.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {row.xp}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    XP
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-500">—</div>
      )}
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [scope, setScope] = useState<Scope>('global');

  const globalQuery = useQuery({
    queryKey: ['leaderboard-global', 50],
    queryFn: () => mobileApi.getGlobalLeaderboard(50),
    enabled: scope === 'global',
  });

  const orgQuery = useQuery({
    queryKey: ['leaderboard-organization', 50],
    queryFn: () => mobileApi.getOrganizationLeaderboard(50),
    enabled: scope === 'organization',
  });

  const active = scope === 'global' ? globalQuery : orgQuery;

  return (
    <div className="px-4 py-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Trophy className="h-5 w-5 text-slate-800 dark:text-slate-200" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {t({ uz: 'Reyting', en: 'Leaderboard', ru: 'Рейтинг' })}
        </h1>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setScope('global')}
          className={clsx(
            'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
            scope === 'global'
              ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/50 dark:bg-amber-950/30 dark:text-amber-200'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800',
          )}
        >
          {t({ uz: 'Global', en: 'Global', ru: 'Глобал' })}
        </button>
        <button
          type="button"
          onClick={() => setScope('organization')}
          className={clsx(
            'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
            scope === 'organization'
              ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/50 dark:bg-amber-950/30 dark:text-amber-200'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800',
          )}
        >
          {t({ uz: 'Tashkilot', en: 'Organization', ru: 'Организация' })}
        </button>
      </div>

      <LeaderboardList
        title={
          scope === 'global'
            ? t({ uz: 'Global reyting', en: 'Global leaderboard', ru: 'Глобальный рейтинг' })
            : t({ uz: 'Tashkilot reytingi', en: 'Organization leaderboard', ru: 'Рейтинг организации' })
        }
        icon={scope === 'global' ? <Trophy className="h-5 w-5" /> : <Users className="h-5 w-5" />}
        rows={active.data?.top}
        me={active.data?.me}
        isLoading={active.isLoading}
        isError={active.isError}
      />
    </div>
  );
}

