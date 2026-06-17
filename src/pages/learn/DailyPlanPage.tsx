import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, ClipboardList, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import { queryClient } from '@/queryClient';
import { CheerfulBackLink } from '@/components/CheerfulBackLink';
import LearnProgressBar from '@/components/LearnProgressBar';

export default function DailyPlanPage() {
  const { t } = useTranslation();
  const [qIndex, setQIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null);

  const planQuery = useQuery({
    queryKey: ['daily-plan-today'],
    queryFn: () => mobileApi.getDailyPlanToday(),
  });

  const answerMut = useMutation({
    mutationFn: ({
      questionId,
      selectedOptionId,
    }: {
      questionId: string;
      selectedOptionId: string;
    }) => mobileApi.submitAnswer(questionId, selectedOptionId),
    onSuccess: (res, variables) => {
      setFeedback(res.isCorrect ? 'correct' : 'wrong');
      setPickedOptionId(variables.selectedOptionId);
      queryClient.invalidateQueries({ queryKey: ['daily-plan-today'] });
      queryClient.invalidateQueries({ queryKey: ['progress-me'] });
    },
  });

  const plan = planQuery.data;
  const questions = plan?.questions ?? [];
  const question = questions[qIndex];

  const onPick = (optionId: string) => {
    if (!question || feedback || answerMut.isPending || question.answered) return;
    answerMut.mutate({ questionId: question.id, selectedOptionId: optionId });
  };

  const next = () => {
    setFeedback(null);
    setPickedOptionId(null);
    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1);
    }
  };

  if (planQuery.isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        {t({ uz: 'Yuklanmoqda…', en: 'Loading…', ru: 'Загрузка…' })}
      </div>
    );
  }

  if (planQuery.isError || !plan) {
    return (
      <div className="p-8 text-center text-red-600">
        {t({ uz: 'Kunlik plan yuklanmadi', en: 'Failed to load daily plan', ru: 'Не удалось загрузить план' })}
      </div>
    );
  }

  return (
    <div className="px-4 py-5">
      <CheerfulBackLink to="/learn">
        {t({ uz: 'Orqaga', en: 'Back', ru: 'Назад' })}
      </CheerfulBackLink>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 rounded-3xl border border-blue-200/70 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 dark:border-[var(--learn-border)] dark:from-[var(--learn-card)] dark:to-[var(--learn-surface)]"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-600 p-3 text-white">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-[var(--learn-blue)]">
              {t({ uz: 'Bugungi plan', en: 'Today\'s plan', ru: 'План на сегодня' })}
            </p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {plan.answeredCount} / {plan.questionCount}{' '}
              {t({ uz: 'savol', en: 'questions', ru: 'вопросов' })}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <LearnProgressBar value={plan.completionPercent} />
        </div>
        {plan.completed && (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            {t({ uz: 'Kunlik plan bajarildi!', en: 'Daily plan completed!', ru: 'План выполнен!' })}
          </p>
        )}
      </motion.div>

      {questions.length === 0 ? (
        <p className="mt-6 text-center text-slate-500">
          {t({
            uz: 'Bugungi plan uchun savollar tayyorlanmoqda',
            en: 'Questions for today are being prepared',
            ru: 'Вопросы готовятся',
          })}
        </p>
      ) : question ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {t({ uz: 'Savol', en: 'Question', ru: 'Вопрос' })} {qIndex + 1} / {questions.length}
            </span>
            {question.answered && (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {t({ uz: 'Javob berilgan', en: 'Answered', ru: 'Отвечено' })}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{question.prompt}</h2>
          <div className="space-y-2">
            {question.options.map((opt) => {
              const isPicked = pickedOptionId === opt.id;
              const showResult = !!feedback || question.answered;
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!!feedback || question.answered || answerMut.isPending}
                  onClick={() => onPick(opt.id)}
                  className={clsx(
                    'w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition',
                    showResult && question.isCorrect && isPicked
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : showResult && feedback === 'wrong' && isPicked
                        ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
                        : 'border-slate-200 bg-white hover:border-blue-400 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
                  )}
                >
                  {opt.optionText}
                </button>
              );
            })}
          </div>
          {feedback && (
            <div
              className={clsx(
                'flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold',
                feedback === 'correct'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
              )}
            >
              {feedback === 'correct' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              {feedback === 'correct'
                ? t({ uz: 'To`g`ri!', en: 'Correct!', ru: 'Верно!' })
                : t({ uz: 'Noto`g`ri', en: 'Wrong', ru: 'Неверно' })}
            </div>
          )}
          {(feedback || question.answered) && qIndex + 1 < questions.length && (
            <button
              type="button"
              onClick={next}
              className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white"
            >
              {t({ uz: 'Keyingi savol', en: 'Next question', ru: 'Следующий' })}
            </button>
          )}
        </div>
      ) : null}

      <div className="mt-8 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t({ uz: 'Barcha savollar', en: 'All questions', ru: 'Все вопросы' })}
        </p>
        {questions.map((q, idx) => (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              setQIndex(idx);
              setFeedback(null);
              setPickedOptionId(null);
            }}
            className={clsx(
              'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm',
              idx === qIndex
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                : 'border-slate-200 dark:border-[var(--learn-border)]',
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold dark:bg-[var(--learn-border)]">
              {idx + 1}
            </span>
            <span className="line-clamp-2 flex-1">{q.prompt}</span>
            {q.answered ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
