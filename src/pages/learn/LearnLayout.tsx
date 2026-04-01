import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { Crown, Home, QrCode, Trophy, User } from 'lucide-react';
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
  const globalRankQuery = useQuery({
    queryKey: ['leaderboard-global-me'],
    queryFn: () => mobileApi.getGlobalLeaderboard(1),
    enabled: !blockForOrg,
  });
  const myGlobalRank = globalRankQuery.data?.me?.rank ?? null;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            ElektroLearn
          </p>
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>{xp} XP</span>
              </span>
            </p>
            {typeof myGlobalRank === 'number' ? (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span className="inline-flex items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>#{myGlobalRank}</span>
                </span>
              </p>
            ) : null}
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-lg">
          <NavLink
            to="/learn"
            end
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium',
                isActive
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400',
              )
            }
          >
            <Home className="h-5 w-5" />
            {t({ uz: 'Bosh sahifa', en: 'Home', ru: 'Главная' })}
          </NavLink>
          <NavLink
            to="/learn/qr"
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium',
                isActive
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400',
              )
            }
          >
            <QrCode className="h-5 w-5" />
            {t({ uz: 'QR', en: 'QR', ru: 'QR' })}
          </NavLink>
          <NavLink
            to="/learn/rating"
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium',
                isActive
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400',
              )
            }
          >
            <Trophy className="h-5 w-5" />
            {t({ uz: 'Reyting', en: 'Rating', ru: 'Рейтинг' })}
          </NavLink>
          <NavLink
            to="/learn/profile"
            className={({ isActive }) =>
              clsx(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium',
                isActive
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 dark:text-slate-400',
              )
            }
          >
            <User className="h-5 w-5" />
            {t({ uz: 'Profil', en: 'Profile', ru: 'Профиль' })}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
