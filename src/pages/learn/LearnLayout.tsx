import { useMemo } from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import {
  ClipboardList,
  Crown,
  Heart,
  HeartCrack,
  Home,
  QrCode,
  Trophy,
  User,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  readCachedUser,
  needsOrganizationSelection,
} from '@/utils/auth';
import clsx from 'clsx';

export default function LearnLayout() {
  const { t } = useTranslation();
  const user = readCachedUser();
  const blockForOrg = needsOrganizationSelection(user);

  const { data: progress } = useQuery({
    queryKey: ['progress-me'],
    queryFn: () => mobileApi.getMyProgress(),
    enabled: !blockForOrg,
  });

  if (blockForOrg) {
    return <Navigate to="/organization" replace />;
  }

  const xp = progress?.totalXp ?? 0;
  const heartsCount = progress?.hearts?.heartsCount ?? 0;
  const heartsMax = progress?.hearts?.maxHearts ?? 5;
  const heartsUi = useMemo(() => {
    const cnt = Math.max(0, Math.min(heartsMax, heartsCount));
    return { cnt, empty: Math.max(0, heartsMax - cnt) };
  }, [heartsCount, heartsMax]);

  const globalRankQuery = useQuery({
    queryKey: ['leaderboard-global-me'],
    queryFn: () => mobileApi.getGlobalLeaderboard(1),
    enabled: !blockForOrg,
  });
  const myGlobalRank = globalRankQuery.data?.me?.rank ?? null;

  return (
    <div className="learn-app flex min-h-dvh flex-col bg-slate-50 dark:bg-[var(--learn-bg)]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-safe-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] backdrop-blur dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]/95 dark:backdrop-blur-md">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-[var(--learn-gold)]">
            ElektroLearn
          </p>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-slate-900 dark:text-[var(--learn-gold)]">
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-600 dark:text-[var(--learn-gold)]" />
                <span>{xp} XP</span>
              </span>
            </p>
            {typeof myGlobalRank === 'number' ? (
              <p className="text-xs font-semibold text-slate-700 dark:text-[var(--learn-gold)]/90">
                <span className="inline-flex items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-600 dark:text-[var(--learn-gold)]" />
                  <span>#{myGlobalRank}</span>
                </span>
              </p>
            ) : null}
            <span
              className="inline-flex items-center gap-0.5 rounded-full border border-rose-200/80 bg-rose-50/90 px-2 py-0.5 dark:border-[var(--learn-red)]/45 dark:bg-[#2d1218]/70"
              title={t({
                uz: 'Jonlar',
                en: 'Lives',
                ru: 'Жизни',
              })}
            >
              {Array.from({ length: heartsUi.cnt }).map((_, i) => (
                <Heart
                  key={`h-${i}`}
                  className="h-3.5 w-3.5 fill-current text-rose-500 dark:text-[var(--learn-red)]"
                />
              ))}
              {Array.from({ length: heartsUi.empty }).map((_, i) => (
                <HeartCrack
                  key={`e-${i}`}
                  className="h-3.5 w-3.5 text-slate-400 opacity-70 dark:text-[var(--learn-muted)]"
                />
              ))}
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 px-safe-4 pb-safe backdrop-blur dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]/98 dark:backdrop-blur-md">
        <div className="mx-auto flex max-w-lg">
          <NavLink
            to="/learn/exam"
            className={({ isActive }) =>
              clsx(
                'flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium sm:text-xs',
                isActive
                  ? 'text-amber-600 dark:text-[var(--learn-gold)]'
                  : 'text-slate-500 dark:text-[var(--learn-muted)]',
              )
            }
          >
            <ClipboardList className="h-5 w-5 shrink-0" />
            {t({ uz: 'Imtihon', en: 'Exam', ru: 'Экзамен' })}
          </NavLink>
          <NavLink
            to="/learn"
            end
            className={({ isActive }) =>
              clsx(
                'flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium sm:text-xs',
                isActive
                  ? 'text-amber-600 dark:text-[var(--learn-gold)]'
                  : 'text-slate-500 dark:text-[var(--learn-muted)]',
              )
            }
          >
            <Home className="h-5 w-5 shrink-0" />
            {t({ uz: 'Bosh sahifa', en: 'Home', ru: 'Главная' })}
          </NavLink>
          <NavLink
            to="/learn/qr"
            className={({ isActive }) =>
              clsx(
                'flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium sm:text-xs',
                isActive
                  ? 'text-amber-600 dark:text-[var(--learn-gold)]'
                  : 'text-slate-500 dark:text-[var(--learn-muted)]',
              )
            }
          >
            <QrCode className="h-5 w-5 shrink-0" />
            {t({ uz: 'QR', en: 'QR', ru: 'QR' })}
          </NavLink>
          <NavLink
            to="/learn/rating"
            className={({ isActive }) =>
              clsx(
                'flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium sm:text-xs',
                isActive
                  ? 'text-amber-600 dark:text-[var(--learn-gold)]'
                  : 'text-slate-500 dark:text-[var(--learn-muted)]',
              )
            }
          >
            <Trophy className="h-5 w-5 shrink-0" />
            {t({ uz: 'Reyting', en: 'Rating', ru: 'Рейтинг' })}
          </NavLink>
          <NavLink
            to="/learn/profile"
            className={({ isActive }) =>
              clsx(
                'flex min-w-0 flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium sm:text-xs',
                isActive
                  ? 'text-amber-600 dark:text-[var(--learn-gold)]'
                  : 'text-slate-500 dark:text-[var(--learn-muted)]',
              )
            }
          >
            <User className="h-5 w-5 shrink-0" />
            {t({ uz: 'Profil', en: 'Profile', ru: 'Профиль' })}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
