import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Lock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import clsx from 'clsx';

export default function LearnHomePage() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['progress-me'],
    queryFn: () => mobileApi.getMyProgress(),
  });

  const dailyPlanQuery = useQuery({
    queryKey: ['daily-plan-today'],
    queryFn: () => mobileApi.getDailyPlanToday(),
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
        className="mb-6 rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-[var(--learn-border)] dark:from-[var(--learn-card)] dark:to-[var(--learn-surface)]"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-[var(--learn-gold)]">
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

      <Link
        to="/learn/daily-plan"
        className="mb-6 flex items-center gap-4 rounded-2xl border border-blue-200 bg-white px-4 py-4 shadow-sm transition hover:border-blue-400 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white">
            {t({ uz: 'Bugungi plan', en: 'Today\'s plan', ru: 'План на сегодня' })}
          </p>
          <p className="text-xs text-slate-500">
            {dailyPlanQuery.data
              ? t({
                  uz: `${dailyPlanQuery.data.answeredCount}/${dailyPlanQuery.data.questionCount} savol • ${dailyPlanQuery.data.completionPercent}%`,
                  en: `${dailyPlanQuery.data.answeredCount}/${dailyPlanQuery.data.questionCount} questions • ${dailyPlanQuery.data.completionPercent}%`,
                  ru: `${dailyPlanQuery.data.answeredCount}/${dailyPlanQuery.data.questionCount} вопросов • ${dailyPlanQuery.data.completionPercent}%`,
                })
              : t({ uz: 'Kamida 10 ta savol', en: 'At least 10 questions', ru: 'Минимум 10 вопросов' })}
          </p>
        </div>
      </Link>

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
                  'flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-100/80 px-4 py-4 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]/40',
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 dark:bg-[var(--learn-border)]">
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
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-blue-400 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:hover:border-[var(--learn-blue)]"
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
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-[var(--learn-border)]">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all dark:bg-[var(--learn-gold)]"
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
