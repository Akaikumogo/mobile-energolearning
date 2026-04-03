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

export default function RegisterPage() {
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const regMut = useMutation({
    mutationFn: () =>
      mobileApi.register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      }),
    onSuccess: (res) => {
      cacheUser(res.data.user);
      navigate('/organization', { replace: true });
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
              uz: 'Xatolik',
              en: 'Something went wrong',
              ru: 'Ошибка',
            }),
      );
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    regMut.mutate();
  };

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-[#2563EB] to-[#0a36ad] dark:from-slate-950 dark:to-slate-900">
      <div className="absolute z-10 flex items-center gap-2 [right:max(1rem,env(safe-area-inset-right,0px))] [top:max(1rem,env(safe-area-inset-top,0px))]">
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
        className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-safe-6 pb-safe pt-safe-16"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="mb-1 text-2xl font-bold text-white">
          {t({ uz: "Ro'yxatdan o'tish", en: 'Sign up', ru: 'Регистрация' })}
        </h1>
        <p className="mb-6 text-sm text-white/80">
          {t({
            uz: 'Yangi hisob yarating',
            en: 'Create a new account',
            ru: 'Создайте аккаунт',
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
          <div className="mb-4 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {t({ uz: 'Ism', en: 'First name', ru: 'Имя' })}
              </span>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {t({ uz: 'Familiya', en: 'Last name', ru: 'Фамилия' })}
              </span>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>
          <label className="mb-4 block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Email
            </span>
            <input
              type="email"
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
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </label>
          <button
            type="submit"
            disabled={regMut.isPending}
            className={clsx(
              'w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg transition hover:bg-blue-700',
              regMut.isPending && 'opacity-70',
            )}
          >
            {regMut.isPending
              ? '…'
              : t({ uz: 'Davom etish', en: 'Continue', ru: 'Продолжить' })}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/90">
          <Link
            to="/login"
            className="font-semibold underline decoration-white/40 underline-offset-4"
          >
            {t({ uz: 'Kirish', en: 'Sign in', ru: 'Вход' })}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
