import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { type UserProfile } from '@/services/api';
import clsx from 'clsx';

function cacheUser(user: UserProfile) {
  localStorage.setItem('user', JSON.stringify(user));
}

export default function LoginPage() {
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMut = useMutation({
    mutationFn: () => mobileApi.login(email.trim(), password),
    onSuccess: (res) => {
      cacheUser(res.data.user);
      const u = res.data.user;
      if (u.role === 'USER' && (u.organizations?.length ?? 0) === 0) {
        navigate('/organization', { replace: true });
      } else {
        navigate('/learn', { replace: true });
      }
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
              uz: 'Kirish muvaffaqiyatsiz',
              en: 'Login failed',
              ru: 'Ошибка входа',
            }),
      );
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMut.mutate();
  };

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-[#2563EB] to-[#0a36ad] dark:from-slate-950 dark:to-slate-900">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          className="h-10 rounded-xl border border-white/20 bg-white/15 px-3 text-sm text-white backdrop-blur"
        >
          <option value="en">English</option>
          <option value="ru">Русский</option>
          <option value="uz">O&apos;zbekcha</option>
          <option value="uz-cyrl">Ўзбекча</option>
        </select>
        <ThemeToggle className="border-white/20 bg-white/10 text-white" />
      </div>

      <motion.div
        className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 pb-safe pt-16"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="mb-1 text-2xl font-bold text-white">
          {t({ uz: 'Kirish', en: 'Sign in', ru: 'Вход' })}
        </h1>
        <p className="mb-8 text-sm text-white/80">
          {t({
            uz: 'Hisobingizga kiring',
            en: 'Sign in to your account',
            ru: 'Войдите в аккаунт',
          })}
        </p>

        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-white/15 bg-white/95 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900/95"
        >
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <label className="mb-6 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t({ uz: 'Parol', en: 'Password', ru: 'Пароль' })}
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={loginMut.isPending}
            className={clsx(
              'w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg transition hover:bg-blue-700',
              loginMut.isPending && 'opacity-70',
            )}
          >
            {loginMut.isPending
              ? '…'
              : t({ uz: 'Kirish', en: 'Sign in', ru: 'Войти' })}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/90">
          <Link
            to="/register"
            className="font-semibold underline decoration-white/40 underline-offset-4"
          >
            {t({
              uz: "Ro'yxatdan o'tish",
              en: 'Create account',
              ru: 'Регистрация',
            })}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
