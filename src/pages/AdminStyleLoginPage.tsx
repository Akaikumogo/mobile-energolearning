import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Eye, EyeOff, IdCard } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import clsx from 'clsx';

function errorMessage(e: unknown): string | null {
  if (e && typeof e === 'object' && 'response' in e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (e as any).response?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg)) return msg.join(', ');
  }
  return null;
}

/** Admin panel login sahifasi bilan bir xil ko'rinish: Energo ID + local superadmin. */
export default function LoginPage() {
  const { t, lang, setLang } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const oauthMut = useMutation({
    mutationFn: () =>
      mobileApi.getEnergoIdAuthorizeUrl(
        Capacitor.isNativePlatform() ? 'mobile' : 'web',
      ),
    onSuccess: ({ authorizeUrl, redirectUri, state, client, codeVerifier }) => {
      localStorage.setItem('oauth_state', state);
      localStorage.setItem('oauth_redirect_uri', redirectUri);
      localStorage.setItem('oauth_client', client);
      if (codeVerifier) {
        localStorage.setItem('oauth_code_verifier', codeVerifier);
      } else {
        localStorage.removeItem('oauth_code_verifier');
      }
      window.location.href = authorizeUrl;
    },
    onError: (e: unknown) => {
      setError(
        errorMessage(e) ??
          t({
            en: 'Energo ID login failed',
            uz: 'Energo ID orqali kirish muvaffaqiyatsiz',
            ru: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0432\u0445\u043e\u0434\u0430 \u0447\u0435\u0440\u0435\u0437 Energo ID',
          }),
      );
    },
  });

  const passwordMut = useMutation({
    mutationFn: () => mobileApi.adminLogin(email.trim(), password),
    onSuccess: () => {
      navigate('/learn', { replace: true });
    },
    onError: (e: unknown) => {
      setError(
        errorMessage(e) ??
          t({
            en: 'Login failed',
            uz: 'Kirish muvaffaqiyatsiz',
            ru: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0432\u0445\u043e\u0434\u0430',
          }),
      );
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) {
      next.email = t({ en: 'Please enter your email', uz: 'Email kiriting', ru: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 email' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t({ en: 'Invalid email', uz: "Noto'g'ri email", ru: '\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 email' });
    }
    if (!password) {
      next.password = t({ en: 'Please enter your password', uz: 'Parol kiriting', ru: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043f\u0430\u0440\u043e\u043b\u044c' });
    }
    setFieldErrors(next);
    if (next.email || next.password) return;
    passwordMut.mutate();
  };

  const inputClass =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-safe"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#2563EB] to-[#0a36ad] transition-colors duration-1000 dark:from-[#020617] dark:to-[#0F172A]"
        initial={{ scale: 1.1, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
      />

      <motion.div
        className="absolute z-20 flex items-center gap-2 [right:max(1rem,env(safe-area-inset-right,0px))] [top:max(1rem,env(safe-area-inset-top,0px))]"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as typeof lang)}
          className="h-10 min-w-[120px] rounded-xl border border-white/20 bg-white/15 px-3 text-sm text-white backdrop-blur"
        >
          <option value="en">English</option>
          <option value="ru">{'\u0420\u0443\u0441\u0441\u043a\u0438\u0439'}</option>
          <option value="uz">O&apos;zbekcha</option>
          <option value="uz-cyrl">{'\u040e\u0437\u0431\u0435\u043a\u0447\u0430'}</option>
        </select>
        <ThemeToggle className="border-white/20 bg-white/10 text-white" />
      </motion.div>

      <motion.div
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[#E2E8F0] bg-white/90 p-8 shadow-xl backdrop-blur-md dark:border-[#1E293B] dark:bg-[#0F172A]/90"
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      >
        <motion.h1
          className="mb-2 text-center text-3xl font-semibold text-[#2563EB] dark:text-[#60A5FA]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {t({ en: 'Welcome back', uz: 'Xush kelibsiz', ru: '\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c' })}
        </motion.h1>
        <p className="mb-6 text-center text-sm text-slate-500 dark:text-slate-400">
          {t({ en: 'Sign in with Energo ID', uz: 'Energo ID orqali kiring', ru: '\u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 Energo ID' })}
        </p>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={oauthMut.isPending}
          onClick={() => {
            setError(null);
            oauthMut.mutate();
          }}
          className={clsx(
            'mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] font-medium text-white shadow transition hover:bg-blue-700',
            oauthMut.isPending && 'opacity-70',
          )}
        >
          <IdCard size={18} />
          {oauthMut.isPending
            ? '...'
            : t({ en: 'Login with Energo ID', uz: 'Energo ID orqali kirish', ru: '\u0412\u0445\u043e\u0434 \u0447\u0435\u0440\u0435\u0437 Energo ID' })}
        </button>

        <p className="mb-4 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {t({
            uz: 'Parolni unutdingizmi?',
            en: 'Forgot your password?',
            ru: 'Забыли пароль?',
          })}
          <br />
          <a
            href="https://t.me/EnergoItS"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#2563EB] underline underline-offset-2 dark:text-[#60A5FA]"
          >
            {t({
              uz: 'Qayta tiklash uchun',
              en: 'To reset it,',
              ru: 'Чтобы восстановить,',
            })}
            <br />
            {t({
              uz: 'Telegram orqali aloqaga chiqing',
              en: 'contact us on Telegram',
              ru: 'напишите в Telegram',
            })}
          </a>
        </p>

        <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          {t({ en: 'or local superadmin', uz: 'yoki local superadmin', ru: '\u0438\u043b\u0438 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0439 superadmin' })}
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="superadmin@example.com"
              className={clsx(inputClass, fieldErrors.email && 'border-red-500')}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t({ en: 'Password', uz: 'Parol', ru: '\u041f\u0430\u0440\u043e\u043b\u044c' })}
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className={clsx(inputClass, 'pr-10', fieldErrors.password && 'border-red-500')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-slate-400"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={passwordMut.isPending}
            className={clsx(
              'h-11 w-full rounded-xl border border-slate-300 bg-white font-medium text-slate-800 transition hover:border-blue-500 hover:text-blue-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100',
              passwordMut.isPending && 'opacity-70',
            )}
          >
            {passwordMut.isPending
              ? '...'
              : t({ en: 'Local login', uz: 'Local kirish', ru: '\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u0432\u0445\u043e\u0434' })}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-xs text-slate-500 underline"
          onClick={() => navigate('/welcome', { replace: true })}
        >
          {t({ en: 'Back', uz: 'Orqaga', ru: '\u041d\u0430\u0437\u0430\u0434' })}
        </button>
      </motion.div>
    </motion.div>
  );
}