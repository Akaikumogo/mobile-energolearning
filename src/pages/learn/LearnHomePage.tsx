import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import clsx from 'clsx';

export default function LearnHomePage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['progress-me'],
    queryFn: () => mobileApi.getMyProgress(),
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        {t({ uz: 'Yuklanmoqda…', en: 'Loading…', ru: 'Загрузка…' })}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-8 text-center text-red-600">
        {t({ uz: 'Maʼlumot olinmadi', en: 'Failed to load', ru: 'Ошибка загрузки' })}
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-orange-950/30"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
          {t({ uz: 'Unvon', en: 'Badge', ru: 'Значок' })}
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
          {data.badge.label}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t({
            uz: `Yakunlangan level: ${data.completedLevels}`,
            en: `Levels completed: ${data.completedLevels}`,
            ru: `Уровней пройдено: ${data.completedLevels}`,
          })}
        </p>
      </motion.div>

      <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
        {t({ uz: 'Levelar', en: 'Levels', ru: 'Уровни' })}
      </h2>

      <div className="flex flex-col gap-3">
        {data.levels.map((level, idx) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
          >
            {level.isLocked ? (
              <div
                className={clsx(
                  'flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-100/80 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50',
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800">
                  <Lock className="h-5 w-5 text-slate-500 dark:text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-500 dark:text-slate-500">
                    {level.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t({
                      uz: 'Oldingi levelni yakunlang',
                      en: 'Complete previous level',
                      ru: 'Завершите предыдущий уровень',
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <Link
                to={`/learn/level/${level.id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-blue-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500"
              >
                <div
                  className={clsx(
                    'flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white',
                    level.isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-blue-600',
                  )}
                >
                  {level.orderIndex + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {level.title}
                  </p>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: `${level.completionPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {level.completionPercent}%
                  </p>
                </div>
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
