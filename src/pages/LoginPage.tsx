import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { IdCard } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import clsx from 'clsx';

export default function LoginPage() {
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const oauthMut = useMutation({
    mutationFn: () =>
      mobileApi.getEnergoIdAuthorizeUrl(
        Capacitor.isNativePlatform() ? 'mobile' : 'web',
      ),
    onSuccess: ({ authorizeUrl, redirectUri, state }) => {
      localStorage.setItem('oauth_state', state);
      localStorage.setItem('oauth_redirect_uri', redirectUri);
      window.location.href = authorizeUrl;
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
              uz: 'Energo ID ga ulanib bo‘lmadi',
              en: 'Could not connect to Energo ID',
              ru: 'Не удалось подключиться к Energo ID',
            }),
      );
    },
  });

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
        <div className="mb-8 flex items-center gap-3 text-white">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <IdCard size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ElektroLearn</h1>
            <p className="text-sm text-white/80">
              {t({
                uz: 'Energo ID orqali xavfsiz kirish',
                en: 'Secure sign-in via Energo ID',
                ru: 'Безопасный вход через Energo ID',
              })}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/95 p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
          {error && (
            <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          )}

          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            {t({
              uz: 'Davom etish uchun Energo ID hisobingiz bilan tizimga kiring. Login va parol shu yerda kiritilmaydi.',
              en: 'Continue with your Energo ID account. You will not enter a password in this app.',
              ru: 'Продолжите со своей учётной записью Energo ID. Пароль вводится не здесь.',
            })}
          </p>

          <button
            type="button"
            disabled={oauthMut.isPending}
            onClick={() => {
              setError(null);
              oauthMut.mutate();
            }}
            className={clsx(
              'flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg transition hover:bg-blue-700',
              oauthMut.isPending && 'opacity-70',
            )}
          >
            <IdCard size={18} />
            {oauthMut.isPending
              ? '…'
              : t({
                  uz: 'Energo ID bilan kirish',
                  en: 'Sign in with Energo ID',
                  ru: 'Войти через Energo ID',
                })}
          </button>

          <button
            type="button"
            className="mt-4 w-full text-center text-xs text-slate-500 underline"
            onClick={() => navigate('/welcome', { replace: true })}
          >
            {t({ uz: 'Orqaga', en: 'Back', ru: 'Назад' })}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
