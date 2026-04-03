import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Languages } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useApp } from '@/hooks/useApp';
import type { Lang } from '@/context/app-context';
import { useTranslation } from '@/hooks/useTranslation';
import clsx from 'clsx';

const LANGS: { id: Lang; label: string; native: string }[] = [
  { id: 'uz', label: "O'zbekcha", native: "O'zbekcha" },
  { id: 'uz-cyrl', label: 'Ўзбекча', native: 'Ўзбекча' },
  { id: 'en', label: 'English', native: 'English' },
  { id: 'ru', label: 'Русский', native: 'Русский' },
];

export default function WelcomeLanguage() {
  const navigate = useNavigate();
  const { setLang, lang } = useApp();
  const { t } = useTranslation();

  const pick = (l: Lang) => {
    setLang(l);
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#2563EB] to-[#0a36ad] dark:from-slate-950 dark:to-slate-900">
      <div className="absolute z-10 flex gap-2 [right:max(1rem,env(safe-area-inset-right,0px))] [top:max(1rem,env(safe-area-inset-top,0px))]">
        <ThemeToggle className="border-white/20 bg-white/10 text-white" />
      </div>

      <motion.div
        className="flex min-h-dvh flex-col items-center justify-center px-safe-6 pb-safe pt-safe-14"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white shadow-lg backdrop-blur">
          <Languages className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-center text-2xl font-bold text-white sm:text-3xl">
          {t({
            uz: 'Tilni tanlang',
            en: 'Choose language',
            ru: 'Выберите язык',
          })}
        </h1>
        <p className="mb-10 max-w-sm text-center text-sm text-white/85">
          {t({
            uz: 'ElektroLearn — xavfsizlik va bilim bir joyda.',
            en: 'ElektroLearn — safety and learning in one place.',
            ru: 'ElektroLearn — безопасность и обучение в одном месте.',
          })}
        </p>

        <div className="grid w-full max-w-sm gap-3">
          {LANGS.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => pick(item.id)}
              className={clsx(
                'flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left font-medium transition-colors',
                lang === item.id
                  ? 'border-amber-300 bg-white text-slate-900 shadow-lg'
                  : 'border-white/20 bg-white/10 text-white hover:bg-white/20',
              )}
            >
              <span>{item.label}</span>
              <span className="text-sm opacity-80">{item.native}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
