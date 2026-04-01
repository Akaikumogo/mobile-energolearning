import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Camera,
  Crown,
  Languages,
  LogOut,
  Moon,
  Sun,
  Trophy,
  Users,
  UserCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { BACKEND_ORIGIN } from '@/services/api';
import { queryClient } from '@/queryClient';
import { useApp } from '@/hooks/useApp';
import clsx from 'clsx';

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
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

  const avatarSrc = me?.avatarUrl ? `${BACKEND_ORIGIN}${me.avatarUrl}` : null;

  const onPickAvatar = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const res = await mobileApi.uploadMyAvatar(file);
      // keep localStorage cached user in sync
      try {
        const raw = localStorage.getItem('user');
        if (raw) {
          const u = JSON.parse(raw) as Record<string, unknown>;
          u.avatarUrl = res.avatarUrl;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch {
        /* ignore */
      }
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <p className="text-xs font-semibold uppercase text-slate-500">
          {t({ uz: 'Foydalanuvchi', en: 'User', ru: 'Пользователь' })}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            title={t({ uz: 'Avatarni o‘zgartirish', en: 'Change avatar', ru: 'Сменить аватар' })}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-600 dark:text-slate-300">
                <UserCircle className="h-9 w-9" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
              <Camera className="h-5 w-5 text-white opacity-0 transition group-hover:opacity-100" />
            </div>
            <span className="sr-only">{initials}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onPickAvatar(f);
              e.currentTarget.value = '';
            }}
          />
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

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Languages className="h-5 w-5 text-slate-500 dark:text-slate-300" />
            <span>{t({ uz: 'Sozlamalar', en: 'Settings', ru: 'Настройки' })}</span>
          </div>
          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
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
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-amber-200/60 bg-amber-50/80 p-5 dark:border-amber-900/40 dark:bg-amber-950/30">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          {progress?.badge.label ?? '—'}
        </p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {progress?.totalXp ?? 0} XP
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-amber-200/60 bg-white/70 p-3 dark:border-amber-900/30 dark:bg-black/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>{t({ uz: 'Global', en: 'Global', ru: 'Глобал' })}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>
                {globalRankQuery.data?.me?.rank
                  ? `#${globalRankQuery.data.me.rank}`
                  : '—'}
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200/60 bg-white/70 p-3 dark:border-amber-900/30 dark:bg-black/20">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>{t({ uz: 'Tashkilot', en: 'Org', ru: 'Орг' })}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
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
