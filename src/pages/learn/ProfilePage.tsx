import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Award,
  ChevronRight,
  Crown,
  Languages,
  LogOut,
  Moon,
  QrCode,
  Sun,
  Trophy,
  Users,
  UserCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { resolveMediaUrl } from '@/services/api';
import { queryClient } from '@/queryClient';
import { useApp } from '@/hooks/useApp';
import { CertificateCard } from '@/components/certificate/CertificateCard';
import clsx from 'clsx';

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme, lang, setLang } = useApp();
  const isDark = theme === 'dark';

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => mobileApi.me(),
  });

  const { data: progress } = useQuery({
    queryKey: ['progress-me'],
    queryFn: () => mobileApi.getMyProgress(),
  });

  const { data: certificates, isLoading: certLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => mobileApi.getMyCertificates(),
  });
  const certificate = certificates?.[0] ?? null;

  const globalRankQuery = useQuery({
    queryKey: ['leaderboard-global-me'],
    queryFn: () => mobileApi.getGlobalLeaderboard(1),
  });
  const orgRankQuery = useQuery({
    queryKey: ['leaderboard-org-me'],
    queryFn: () => mobileApi.getOrganizationLeaderboard(1),
  });

  const logout = async () => {
    await mobileApi.logout();
    queryClient.clear();
    navigate('/welcome', { replace: true });
  };

  const initials = useMemo(() => {
    const a = (me?.firstName || '').trim();
    const b = (me?.lastName || '').trim();
    return `${a ? a[0] : ''}${b ? b[0] : ''}`.toUpperCase() || 'U';
  }, [me?.firstName, me?.lastName]);

  const avatarSrc = me?.avatarUrl ? resolveMediaUrl(me.avatarUrl) : null;

  return (
    <div className="px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]"
      >
        <p className="text-xs font-semibold uppercase text-slate-500">
          {t({ uz: 'Foydalanuvchi', en: 'User', ru: 'Пользователь' })}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div
            className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]"
            aria-hidden={!avatarSrc}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-600 dark:text-slate-300">
                <UserCircle className="h-9 w-9" />
              </div>
            )}
            <span className="sr-only">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {me ? `${me.firstName} ${me.lastName}` : '—'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{me?.email}</p>
          </div>
        </div>
        {me?.organizations?.length ? (
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            {me.organizations.map((o) => o.name).join(', ')}
          </p>
        ) : null}
      </motion.div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Award className="h-4 w-4 text-amber-500 dark:text-[var(--learn-gold)]" />
            {t({
              uz: 'Mening guvohnomam',
              en: 'My certificate',
              ru: 'Моё удостоверение',
            })}
          </h2>
          <button
            type="button"
            onClick={() => navigate('/learn/qr')}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:border-[var(--learn-border)] dark:text-slate-200"
          >
            <QrCode className="h-3.5 w-3.5" />
            QR
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mb-3 text-[11px] text-slate-500 dark:text-[var(--learn-muted)]">
          {t({
            uz: 'Manba: ENERGO ID — avtomatik',
            en: 'Source: ENERGO ID — automatic',
            ru: 'Источник: ENERGO ID — автоматически',
          })}
        </p>
        {certLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-[var(--learn-surface)]" />
        ) : certificate ? (
          <CertificateCard
            certificate={certificate}
            avatarUrl={
              certificate.avatarUrl
                ? resolveMediaUrl(certificate.avatarUrl)
                : avatarSrc
            }
          />
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            {t({
              uz: 'Guvohnoma yuklanmadi',
              en: 'Certificate not loaded',
              ru: 'Удостоверение не загружено',
            })}
          </p>
        )}
        <button
          type="button"
          onClick={() => navigate('/learn/certificate')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-xs font-semibold text-slate-700 dark:border-[var(--learn-border)] dark:text-slate-200"
        >
          {t({
            uz: 'PNG saqlash / ulashish',
            en: 'Save PNG / share',
            ru: 'Сохранить PNG / поделиться',
          })}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Languages className="h-5 w-5 text-slate-500 dark:text-slate-300" />
            <span>{t({ uz: 'Sozlamalar', en: 'Settings', ru: 'Настройки' })}</span>
          </div>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-white"
            title={t({ uz: 'Tema', en: 'Theme', ru: 'Тема' })}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(
            [
              { id: 'uz', label: "O'zbek" },
              { id: 'uz-cyrl', label: 'Ўзбек' },
              { id: 'en', label: 'English' },
              { id: 'ru', label: 'Русский' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLang(item.id)}
              className={clsx(
                'rounded-2xl border px-4 py-3 text-sm font-semibold transition',
                lang === item.id
                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-400/50 dark:bg-amber-950/30 dark:text-amber-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-200 dark:hover:bg-[var(--learn-surface)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-amber-200/60 bg-amber-50/80 p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <p className="text-sm text-amber-900 dark:text-[var(--learn-gold)]/90">
          {progress?.badge.label ?? '—'}
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-[var(--learn-gold)]">
          {progress?.totalXp ?? 0} XP
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-200/60 bg-white/70 p-3 dark:border-amber-900/30 dark:bg-black/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Trophy className="h-4 w-4 text-amber-600 dark:text-[var(--learn-gold)]" />
              <span>{t({ uz: 'Global', en: 'Global', ru: 'Глобал' })}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Crown className="h-4 w-4 text-amber-600 dark:text-[var(--learn-gold)]" />
              <span>
                {globalRankQuery.data?.me?.rank
                  ? `#${globalRankQuery.data.me.rank}`
                  : '—'}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200/60 bg-white/70 p-3 dark:border-amber-900/30 dark:bg-black/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Users className="h-4 w-4 text-amber-600 dark:text-[var(--learn-gold)]" />
              <span>{t({ uz: 'Tashkilot', en: 'Org', ru: 'Орг' })}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Crown className="h-4 w-4 text-amber-600 dark:text-[var(--learn-gold)]" />
              <span>
                {orgRankQuery.data?.me?.rank ? `#${orgRankQuery.data.me.rank}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-4 font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
      >
        <LogOut className="h-5 w-5" />
        {t({ uz: 'Chiqish', en: 'Log out', ru: 'Выход' })}
      </button>
    </div>
  );
}
