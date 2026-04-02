import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import { CheerfulBackLink } from '@/components/CheerfulBackLink';
import clsx from 'clsx';

export default function LevelPage() {
  const { levelId } = useParams<{ levelId: string }>();
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['level-detail', levelId],
    queryFn: () => mobileApi.getLevelDetail(levelId!),
    enabled: !!levelId,
  });

  if (!levelId) return null;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        {t({ uz: 'Yuklanmoqda…', en: 'Loading…', ru: 'Загрузка…' })}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <CheerfulBackLink to="/learn">
          {t({ uz: 'Orqaga', en: 'Back', ru: 'Назад' })}
        </CheerfulBackLink>
        <p className="text-red-600">
          {t({
            uz: 'Level ochilmadi',
            en: 'Could not open level',
            ru: 'Не удалось открыть уровень',
          })}
        </p>
      </div>
    );
  }

  const theories = [...data.theories].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  return (
    <div className="px-4 py-4">
      <CheerfulBackLink to="/learn">
        {t({ uz: 'Bosh sahifa', en: 'Home', ru: 'Главная' })}
      </CheerfulBackLink>

      <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
        {data.title}
      </h1>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
        {t({
          uz: 'Nazariyalarni ketma-ket o‘qing',
          en: 'Study topics in order',
          ru: 'Изучайте темы по порядку',
        })}
      </p>

      <div className="flex flex-col gap-3">
        {theories.map((th, idx) => {
          const done =
            th.totalQuestions > 0 &&
            th.answeredQuestions >= th.totalQuestions;
          const pct =
            th.totalQuestions > 0
              ? Math.round((th.answeredQuestions / th.totalQuestions) * 100)
              : 0;

          return (
            <motion.div
              key={th.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Link
                to={`/learn/level/${levelId}/theory/${th.id}`}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-400 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:hover:border-[var(--learn-gold)]/70"
              >
                <div
                  className={clsx(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white',
                    done
                      ? 'bg-emerald-500 dark:bg-[var(--learn-green)]'
                      : 'bg-slate-700 dark:bg-[var(--learn-border)]',
                  )}
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {th.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {th.answeredQuestions}/{th.totalQuestions}{' '}
                    {t({ uz: 'savol', en: 'questions', ru: 'вопросов' })}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-[var(--learn-border)]">
                    <div
                      className="h-full rounded-full bg-amber-500 dark:bg-[var(--learn-gold)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
