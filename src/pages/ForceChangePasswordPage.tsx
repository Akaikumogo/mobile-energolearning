import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { type UserProfile } from '@/services/api';

function cacheUser(user: UserProfile) {
  localStorage.setItem('user', JSON.stringify(user));
}

export default function ForceChangePasswordPage() {
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeMut = useMutation({
    mutationFn: () =>
      mobileApi.changePassword({ currentPassword, newPassword }),
    onSuccess: async () => {
      // /auth/me yangilaymiz — mustChangePassword endi false
      try {
        const fresh = await mobileApi.me();
        cacheUser(fresh);
      } catch {
        const cached = localStorage.getItem('user');
        if (cached) {
          try {
            const u = JSON.parse(cached) as UserProfile;
            u.mustChangePassword = false;
            cacheUser(u);
          } catch {
            /* ignore */
          }
        }
      }
      navigate('/upload-avatar', { replace: true });
    },
    onError: (e: unknown) => {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e as any).response?.data?.message
          : null;
      setError(
        typeof msg === 'string'
          ? msg
          : t({
              uz: 'Parolni o`zgartirib bo`lmadi',
              en: 'Could not change password',
              ru: 'Не удалось изменить пароль',
            }),
      );
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError(
        t({
          uz: 'Yangi parol kamida 6 ta belgi bo`lishi kerak',
          en: 'New password must be at least 6 characters',
          ru: 'Новый пароль должен быть не менее 6 символов',
        }),
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(
        t({
          uz: 'Parollar mos kelmadi',
          en: 'Passwords do not match',
          ru: 'Пароли не совпадают',
        }),
      );
      return;
    }
    if (newPassword === currentPassword) {
      setError(
        t({
          uz: 'Yangi parol eski paroldan farq qilishi kerak',
          en: 'New password must differ from the current one',
          ru: 'Новый пароль должен отличаться от старого',
        }),
      );
      return;
    }
    changeMut.mutate();
  };

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0a0a] dark:from-black dark:to-slate-950">
      <div className="absolute z-10 flex items-center gap-2 [right:max(1rem,env(safe-area-inset-right,0px))] [top:max(1rem,env(safe-area-inset-top,0px))]">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          className="h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-sm text-white backdrop-blur"
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="uz">O&apos;zbekcha</option>
          <option value="uz-cyrl">Ўзбекча</option>
        </select>
        <ThemeToggle className="border-white/20 bg-white/10 text-white" />
      </div>

      {/* Glow effects */}
      <div
        className="pointer-events-none absolute -top-32 -right-20 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
      />

      <motion.div
        className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-safe-6 pb-safe pt-safe-16"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6 flex items-center gap-3 text-white">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {t({
                uz: 'Parolni majburiy yangilash',
                en: 'Change password',
                ru: 'Смена пароля',
              })}
            </h1>
            <p className="mt-0.5 text-xs text-slate-300">
              {t({
                uz: 'Birinchi kirish — xavfsizlik uchun parolni yangilang',
                en: 'First login — update your password for security',
                ru: 'Первый вход — обновите пароль для безопасности',
              })}
            </p>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-white/15 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
        >
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          <PasswordField
            label={t({
              uz: 'Joriy parol',
              en: 'Current password',
              ru: 'Текущий пароль',
            })}
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showOld}
            onToggle={() => setShowOld((s) => !s)}
            autoComplete="current-password"
          />
          <PasswordField
            label={t({
              uz: 'Yangi parol',
              en: 'New password',
              ru: 'Новый пароль',
            })}
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew((s) => !s)}
            autoComplete="new-password"
          />
          <PasswordField
            label={t({
              uz: 'Yangi parolni tasdiqlash',
              en: 'Confirm new password',
              ru: 'Подтвердите новый пароль',
            })}
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showNew}
            onToggle={() => setShowNew((s) => !s)}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={changeMut.isPending}
            className={clsx(
              'mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg transition active:scale-[0.98]',
              changeMut.isPending && 'opacity-70',
            )}
          >
            {changeMut.isPending
              ? '…'
              : t({
                  uz: 'Saqlash va davom etish',
                  en: 'Save and continue',
                  ru: 'Сохранить и продолжить',
                })}
          </button>

          <p className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
            {t({
              uz: 'Bu sahifani o`tkazib bo`lmaydi — yangi parol kiritmaguningizgacha',
              en: 'This step is mandatory before continuing',
              ru: 'Этот шаг обязателен для продолжения',
            })}
          </p>
        </form>
      </motion.div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <div className="relative">
        <Lock
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          minLength={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}
