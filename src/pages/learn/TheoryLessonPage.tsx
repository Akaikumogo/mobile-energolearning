import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  ChevronLeft,
  Heart,
  HeartCrack,
  PartyPopper,
  Home,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import type { MobileQuestion } from '@/services/api';
import { queryClient } from '@/queryClient';
import clsx from 'clsx';

export default function TheoryLessonPage() {
  const { levelId, theoryId } = useParams<{
    levelId: string;
    theoryId: string;
  }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'read' | 'quiz' | 'done'>('read');
  const [qIndex, setQIndex] = useState(0);
  const [lastXp, setLastXp] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [outOfLives, setOutOfLives] = useState(false);

  const progressQuery = useQuery({
    queryKey: ['progress-me'],
    queryFn: () => mobileApi.getMyProgress(),
  });

  const heartsCount = progressQuery.data?.hearts?.heartsCount ?? 0;
  const heartsMax = progressQuery.data?.hearts?.maxHearts ?? 5;
  const heartsUi = useMemo(() => {
    const cnt = Math.max(0, Math.min(heartsMax, heartsCount));
    return { cnt, empty: Math.max(0, heartsMax - cnt) };
  }, [heartsCount, heartsMax]);

  const canDoQuiz = heartsCount > 0;

  const theoryQuery = useQuery({
    queryKey: ['theory', theoryId],
    queryFn: () => mobileApi.getTheoryById(theoryId!),
    enabled: !!theoryId,
  });

  const questionsQuery = useQuery({
    queryKey: ['theory-questions', theoryId],
    queryFn: () => mobileApi.getQuestionsByTheory(theoryId!),
    enabled: !!theoryId && phase !== 'read',
  });

  const questions = (questionsQuery.data ?? []).sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const question: MobileQuestion | undefined = questions[qIndex];

  const answerMut = useMutation({
    mutationFn: ({
      questionId,
      selectedOptionId,
    }: {
      questionId: string;
      selectedOptionId: string;
    }) => mobileApi.submitAnswer(questionId, selectedOptionId),
    onSuccess: (res) => {
      setFeedback(res.isCorrect ? 'correct' : 'wrong');
      setLastXp((x) => x + res.xpEarned);
      if (!res.isCorrect && heartsCount <= 1) {
        setOutOfLives(true);
      }
      queryClient.invalidateQueries({ queryKey: ['progress-me'] });
      queryClient.invalidateQueries({ queryKey: ['level-detail', levelId] });
    },
  });

  const onPickOption = (optionId: string) => {
    if (!question || feedback || answerMut.isPending) return;
    if (!canDoQuiz) return;
    answerMut.mutate({ questionId: question.id, selectedOptionId: optionId });
  };

  const nextQuestion = () => {
    setFeedback(null);
    setOutOfLives(false);
    if (qIndex + 1 >= questions.length) {
      setPhase('done');
      return;
    }
    setQIndex((i) => i + 1);
  };

  if (!levelId || !theoryId) return null;

  if (theoryQuery.isLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        {t({ uz: 'Yuklanmoqda…', en: 'Loading…', ru: 'Загрузка…' })}
      </div>
    );
  }

  const theory = theoryQuery.data;

  if (!theory) {
    return (
      <div className="p-6 text-red-600">
        {t({ uz: 'Topilmadi', en: 'Not found', ru: 'Не найдено' })}
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <Link
        to={`/learn/level/${levelId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400"
      >
        <ChevronLeft className="h-4 w-4" />
        {t({ uz: 'Level', en: 'Level', ru: 'Уровень' })}
      </Link>

      <AnimatePresence mode="wait">
        {phase === 'read' && (
          <motion.div
            key="read"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">
              {theory.title}
            </h1>
            <div
              className="mb-6 max-w-none space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 [&_a]:text-blue-600 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: theory.content || '' }}
            />
            <button
              type="button"
              onClick={() => {
                if (!canDoQuiz) return;
                setPhase('quiz');
              }}
              disabled={!canDoQuiz}
              className={clsx(
                'w-full rounded-2xl py-4 font-semibold shadow-lg transition',
                canDoQuiz
                  ? 'bg-blue-600 text-white'
                  : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
              )}
            >
              {t({
                uz: 'Savollarni boshlash',
                en: 'Start questions',
                ru: 'Начать вопросы',
              })}
            </button>
            {!canDoQuiz && (
              <p className="mt-3 text-center text-sm text-rose-600 dark:text-rose-400">
                {t({
                  uz: 'Jon tugagan. Savollar ishlash uchun ertaga qayta urinib ko‘ring.',
                  en: 'No lives left. Try again tomorrow.',
                  ru: 'Жизни закончились. Попробуйте завтра.',
                })}
              </p>
            )}
          </motion.div>
        )}

        {phase === 'quiz' && questionsQuery.isLoading && (
          <p className="text-center text-slate-500">
            {t({ uz: 'Savollar yuklanmoqda…', en: 'Loading questions…', ru: 'Загрузка…' })}
          </p>
        )}

        {phase === 'quiz' && !questionsQuery.isLoading && questions.length === 0 && (
          <p className="text-slate-600">
            {t({
              uz: 'Bu nazariyada savollar yo‘q.',
              en: 'No questions for this topic.',
              ru: 'Нет вопросов по этой теме.',
            })}
          </p>
        )}

        {phase === 'quiz' && question && (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="pb-8"
          >
            <div className="mb-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {qIndex + 1}/{questions.length}
              </span>
              <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <span>{t({ uz: 'Jon', en: 'Lives', ru: 'Жизни' })}:</span>
                <span className="inline-flex items-center gap-1">
                  {Array.from({ length: heartsUi.cnt }).map((_, i) => (
                    <Heart key={`h-${i}`} className="h-4 w-4 fill-current" />
                  ))}
                  {Array.from({ length: heartsUi.empty }).map((_, i) => (
                    <HeartCrack
                      key={`e-${i}`}
                      className="h-4 w-4 opacity-60"
                    />
                  ))}
                </span>
              </span>
            </div>

            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              {question.prompt}
            </h2>

            <div className="flex flex-col gap-2">
              {[...question.options]
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={!!feedback || answerMut.isPending || !canDoQuiz}
                    onClick={() => onPickOption(opt.id)}
                    className={clsx(
                      'rounded-2xl border px-4 py-4 text-left font-medium transition',
                      'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
                      feedback && 'opacity-80',
                      !canDoQuiz && 'opacity-60',
                    )}
                  >
                    {opt.optionText}
                    {opt.matchText ? (
                      <span className="mt-1 block text-xs text-slate-500">
                        {opt.matchText}
                      </span>
                    ) : null}
                  </button>
                ))}
            </div>

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  'mt-4 rounded-2xl border px-4 py-3',
                  feedback === 'correct'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100'
                    : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100',
                )}
              >
                <div className="flex items-center gap-2">
                  {feedback === 'correct' ? (
                    <BadgeCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-700 dark:text-rose-300" />
                  )}
                  <p className="font-semibold">
                    {feedback === 'correct'
                      ? t({ uz: 'To‘g‘ri!', en: 'Correct!', ru: 'Верно!' })
                      : t({ uz: 'Noto‘g‘ri', en: 'Wrong', ru: 'Неверно' })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (feedback === 'wrong' && outOfLives) {
                      navigate('/learn', { replace: true });
                      return;
                    }
                    nextQuestion();
                  }}
                  className={clsx(
                    'mt-3 w-full rounded-xl py-3 font-semibold',
                    feedback === 'correct'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white',
                  )}
                >
                  {feedback === 'wrong' && outOfLives
                    ? t({ uz: 'Bosh menyu', en: 'Main menu', ru: 'Главное меню' })
                    : t({ uz: 'Keyingisi', en: 'Next', ru: 'Далее' })}
                </button>
                {feedback === 'wrong' && outOfLives ? (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-rose-700/80 dark:text-rose-200/80">
                    <Home className="h-4 w-4" />
                    <span>
                      {t({
                        uz: 'Jon tugadi. Davom etish uchun ertaga qayting.',
                        en: 'No lives left. Come back tomorrow.',
                        ru: 'Жизни закончились. Возвращайтесь завтра.',
                      })}
                    </span>
                  </div>
                ) : null}
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-10 text-center"
          >
            <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <PartyPopper className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              {t({ uz: 'Yakunlandi!', en: 'Completed!', ru: 'Готово!' })}
            </h2>
            <p className="mb-6 text-amber-600 dark:text-amber-400">
              +{lastXp} XP
            </p>
            <Link
              to={`/learn/level/${levelId}`}
              className="rounded-2xl bg-blue-600 px-8 py-3 font-semibold text-white"
            >
              {t({ uz: 'Levelga qaytish', en: 'Back to level', ru: 'К уровню' })}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
