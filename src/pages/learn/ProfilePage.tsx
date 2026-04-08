import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  Camera,
  ClipboardList,
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
import mobileApi, { BACKEND_ORIGIN, type EmployeeCheckType } from '@/services/api';
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

  const examNextQuery = useQuery({
    queryKey: ['exam-next'],
    queryFn: () => mobileApi.getExamNext(),
  });

  const examHistoryQuery = useQuery({
    queryKey: ['exam-history'],
    queryFn: () => mobileApi.getExamHistory(),
  });

  const [checksType, setChecksType] = useState<EmployeeCheckType | 'all'>('all');
  const myCertQuery = useQuery({
    queryKey: ['my-employee-certificate'],
    queryFn: () => mobileApi.getMyEmployeeCertificate(),
  });
  const myChecksQuery = useQuery({
    queryKey: ['my-checks', checksType],
    queryFn: () => mobileApi.listMyChecks(checksType === 'all' ? {} : { type: checksType }),
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
        className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]"
      >
        <p className="text-xs font-semibold uppercase text-slate-500">
          {t({ uz: 'Foydalanuvchi', en: 'User', ru: 'Пользователь' })}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="group relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]"
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

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <p className="text-xs font-semibold uppercase text-slate-500">
          {t({ uz: 'Guvohnoma', en: 'Certificate', ru: 'Удостоверение' })}
        </p>
        {myCertQuery.data ? (
          <div className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-300">
            <p>
              <span className="text-slate-500">№ </span>
              <strong>{myCertQuery.data.certificateNumber}</strong>
            </p>
            <p>
              <span className="text-slate-500">{t({ uz: 'Lavozim', en: 'Position', ru: 'Должность' })}: </span>
              {myCertQuery.data.positionTitle}
            </p>
            <p>
              <span className="text-slate-500">{t({ uz: 'Taqdim etgan', en: 'Presented by', ru: 'Предъявил' })}: </span>
              {myCertQuery.data.presentedByFullName}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">—</p>
        )}
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase text-slate-500">
            {t({ uz: 'Tekshiruvlar', en: 'Checks', ru: 'Проверки' })}
          </p>
          <select
            value={checksType}
            onChange={(e) => setChecksType(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]"
          >
            <option value="all">{t({ uz: 'Hammasi', en: 'All', ru: 'Все' })}</option>
            <option value="GENERAL_KNOWLEDGE">{t({ uz: 'Umumiy bilim', en: 'General', ru: 'Общие' })}</option>
            <option value="SAFETY_TECHNIQUE">{t({ uz: 'Xavfsizlik', en: 'Safety', ru: 'ТБ' })}</option>
            <option value="SPECIAL_WORK_PERMIT">{t({ uz: 'Maxsus ishlar', en: 'Special work', ru: 'Спец.работы' })}</option>
            <option value="RESUSCITATION_TRAINING">{t({ uz: 'Reanimatsiya', en: 'Resuscitation', ru: 'Реанимация' })}</option>
            <option value="MEDICAL_EXAM">{t({ uz: 'Tibbiy', en: 'Medical', ru: 'Медосмотр' })}</option>
          </select>
        </div>
        <div className="mt-3 space-y-2">
          {(myChecksQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">—</p>
          ) : (
            (myChecksQuery.data ?? []).slice(0, 20).map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]"
              >
                <p className="font-semibold text-slate-900 dark:text-white">
                  {row.checkDate} · {row.type}
                </p>
                <p className="text-xs text-slate-500">
                  {row.grade ? `Baho: ${row.grade}` : ' '} {row.nextCheckDate ? ` · Next: ${row.nextCheckDate}` : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <CalendarDays className="h-5 w-5 text-blue-600 dark:text-[var(--learn-blue)]" />
          <span>{t({ uz: 'Keyingi imtihon', en: 'Next exam', ru: 'След. экзамен' })}</span>
        </div>
        {examNextQuery.data?.next ? (
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {t({ uz: 'Taxminan', en: 'About', ru: 'Около' })}{' '}
            <strong>{examNextQuery.data.next.daysLeft}</strong>{' '}
            {t({ uz: 'kun qoldi', en: 'days left', ru: 'дн.' })}
            <span className="mt-1 block text-xs text-slate-500">
              {examNextQuery.data.next.scheduledAt
                ? new Date(examNextQuery.data.next.scheduledAt).toLocaleDateString()
                : new Date(examNextQuery.data.next.suggestedAt).toLocaleDateString()}
            </span>
          </p>
        ) : (
          <p className="text-sm text-slate-500">{t({ uz: 'Reja yo‘q', en: 'None scheduled', ru: 'Нет плана' })}</p>
        )}
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <ClipboardList className="h-5 w-5 text-amber-600 dark:text-[var(--learn-gold)]" />
          <span>{t({ uz: 'Imtihonlar tarixi', en: 'Exam history', ru: 'История экзаменов' })}</span>
        </div>
        <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {(examHistoryQuery.data ?? []).length === 0 ? (
            <p className="text-slate-500">{t({ uz: 'Hozircha bo‘sh', en: 'Empty', ru: 'Пусто' })}</p>
          ) : (
            (examHistoryQuery.data ?? []).slice(0, 12).map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]"
              >
                <p className="font-medium text-slate-900 dark:text-white">{row.examTitle ?? '—'}</p>
                <p className="text-xs text-slate-500">
                  {new Date(row.createdAt).toLocaleString()} · PT {row.ptScorePercent ?? '—'}% · TB{' '}
                  {row.tbScorePercent ?? '—'}%
                </p>
              </div>
            ))
          )}
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
