import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  CheckCircle2,
  ClipboardList,
  PartyPopper,
  Play,
  MoonStar,
  XCircle,
  Zap,
  ZapOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from '@/hooks/useTranslation';
import { useEnergyCountdown } from '@/hooks/useEnergyCountdown';
import mobileApi from '@/services/api';
import type {
  HeartsState,
  MyProgressResponse,
  MobileQuestion,
  MatchingPair,
} from '@/services/api';
import { queryClient } from '@/queryClient';
import { CheerfulBackLink } from '@/components/CheerfulBackLink';
import LearnProgressBar from '@/components/LearnProgressBar';

type MatchPairDraft = {
  leftOptionId: string;
  rightOptionId: string;
  pairIndex: number;
};

const PAIR_PALETTE = [
  'border-blue-500 bg-blue-50 dark:border-blue-400/70 dark:bg-blue-950/25',
  'border-emerald-500 bg-emerald-50 dark:border-emerald-400/70 dark:bg-emerald-950/25',
  'border-amber-500 bg-amber-50 dark:border-amber-400/70 dark:bg-amber-950/25',
  'border-purple-500 bg-purple-50 dark:border-purple-400/70 dark:bg-purple-950/25',
  'border-rose-500 bg-rose-50 dark:border-rose-400/70 dark:bg-rose-950/25',
  'border-cyan-500 bg-cyan-50 dark:border-cyan-400/70 dark:bg-cyan-950/25',
] as const;

export default function DailyPlanPage() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'summary' | 'quiz'>('summary');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null);
  const [revealedCorrectOptionId, setRevealedCorrectOptionId] = useState<
    string | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [matchLeftId, setMatchLeftId] = useState<string | null>(null);
  const [matchPairs, setMatchPairs] = useState<MatchPairDraft[]>([]);

  const planQuery = useQuery({
    queryKey: ['daily-plan-today'],
    queryFn: () => mobileApi.getDailyPlanToday(),
  });

  // Keyingi savol — faqat quiz rejimida. Savol ekranda turganda fokus
  // qaytishi bilan almashib ketmasligi uchun avtomatik refetch o'chirilgan.
  const nextQuery = useQuery({
    queryKey: ['daily-plan-next'],
    queryFn: () => mobileApi.getDailyPlanNextQuestion(),
    enabled: phase === 'quiz',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  // Energiya holati serverdan — taymer tugasa avtomatik yangilanadi.
  const progressQuery = useQuery({
    queryKey: ['progress-me'],
    queryFn: () => mobileApi.getMyProgress(),
  });
  const hearts = progressQuery.data?.hearts ?? null;
  const heartsMax = hearts?.maxHearts ?? 5;
  const heartsCount = hearts?.heartsCount ?? heartsMax;
  const outOfEnergy = hearts != null && hearts.heartsCount <= 0;
  const regenCountdown = useEnergyCountdown(
    hearts && hearts.heartsCount < heartsMax ? hearts.nextRegenAt : null,
  );

  const applyHearts = (h: HeartsState | null | undefined) => {
    if (!h) return;
    queryClient.setQueryData<MyProgressResponse>(['progress-me'], (old) =>
      old ? { ...old, hearts: h } : old,
    );
  };

  const handleSubmitError = (err: unknown) => {
    const axErr = err as AxiosError<{ code?: string; state?: HeartsState }>;
    const data = axErr?.response?.data;
    if (axErr?.response?.status === 403 && data?.code === 'NO_HEARTS_LEFT') {
      applyHearts(data.state);
      setSubmitError(null);
      return;
    }
    setSubmitError(
      t({
        uz: 'Javob yuborilmadi. Internetni tekshirib qayta urinib ko‘ring.',
        en: 'Answer was not sent. Check your connection and try again.',
        ru: 'Ответ не отправлен. Проверьте соединение и попробуйте ещё раз.',
      }),
    );
  };

  const answerMut = useMutation({
    mutationFn: ({
      questionId,
      selectedOptionId,
    }: {
      questionId: string;
      selectedOptionId: string;
    }) => mobileApi.submitAnswer(questionId, selectedOptionId),
    onSuccess: (res, variables) => {
      setSubmitError(null);
      setFeedback(res.isCorrect ? 'correct' : 'wrong');
      setPickedOptionId(variables.selectedOptionId);
      setRevealedCorrectOptionId(
        res.correctOptionId ??
          (res.isCorrect ? variables.selectedOptionId : null),
      );
      applyHearts(res.hearts);
      queryClient.invalidateQueries({ queryKey: ['daily-plan-today'] });
      queryClient.invalidateQueries({ queryKey: ['progress-me'] });
    },
    onError: handleSubmitError,
  });

  const matchingMut = useMutation({
    mutationFn: ({
      questionId,
      pairs,
    }: {
      questionId: string;
      pairs: MatchingPair[];
    }) => mobileApi.submitMatching(questionId, pairs),
    onSuccess: (res) => {
      setSubmitError(null);
      setFeedback(res.isCorrect ? 'correct' : 'wrong');
      applyHearts(res.hearts);
      queryClient.invalidateQueries({ queryKey: ['daily-plan-today'] });
      queryClient.invalidateQueries({ queryKey: ['progress-me'] });
    },
    onError: handleSubmitError,
  });

  const plan = planQuery.data;
  const next = nextQuery.data;
  const question: MobileQuestion | null = next?.question ?? null;
  const goal = next?.progress.dailyGoalCorrect ?? plan?.dailyGoalCorrect ?? 10;

  // Server haqiqati + hozirgi javob (feedback paytida serverdan qayta
  // so'ralmaydi, shu sababli optimistik +1).
  const serverCorrect = next?.progress.correctCount ?? plan?.correctCount ?? 0;
  const displayCorrect = Math.min(
    goal,
    serverCorrect + (feedback === 'correct' ? 1 : 0),
  );
  const displayPercent = Math.min(100, Math.round((displayCorrect / goal) * 100));

  const isSubmitting = answerMut.isPending || matchingMut.isPending;
  const pickable = !feedback && !isSubmitting && !outOfEnergy;

  const resetQuestionState = () => {
    setFeedback(null);
    setPickedOptionId(null);
    setRevealedCorrectOptionId(null);
    setSubmitError(null);
    setMatchLeftId(null);
    setMatchPairs([]);
  };

  const goNext = () => {
    resetQuestionState();
    queryClient.invalidateQueries({ queryKey: ['daily-plan-next'] });
  };

  const startQuiz = () => {
    resetQuestionState();
    queryClient.invalidateQueries({ queryKey: ['daily-plan-next'] });
    setPhase('quiz');
  };

  const backToSummary = () => {
    resetQuestionState();
    setPhase('summary');
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

  // ─── Umumiy: energiya banneri ────────────────────────────────
  const energyBanner = outOfEnergy ? (
    <div className="flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <ZapOff className="h-5 w-5 shrink-0" />
      {regenCountdown
        ? t({
            uz: `Energiya tugadi. Keyingi energiya: ${regenCountdown}`,
            en: `Out of energy. Next energy in: ${regenCountdown}`,
            ru: `Энергия закончилась. Следующая через: ${regenCountdown}`,
          })
        : t({
            uz: 'Energiya tugadi. Har soatda 1 ta energiya tiklanadi.',
            en: 'Out of energy. You get 1 energy every hour.',
            ru: 'Энергия закончилась. +1 энергия каждый час.',
          })}
    </div>
  ) : null;

  // ─── SUMMARY ekrani ──────────────────────────────────────────
  if (phase === 'summary') {
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
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-[var(--learn-blue)]">
                {t({ uz: 'Bugungi maqsad', en: "Today's goal", ru: 'Цель на сегодня' })}
              </p>
              <p className="text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {plan.correctCount} / {goal}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t({ uz: 'to‘g‘ri javob', en: 'correct answers', ru: 'верных ответов' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold tabular-nums text-blue-700 dark:text-[var(--learn-blue)]">
                {plan.completionPercent}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <LearnProgressBar value={plan.completionPercent} />
          </div>
        </motion.div>

        {/* Sariq / Yashil / Qizil statistika chiplari */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50 px-3 py-3 text-center dark:border-amber-500/30 dark:bg-amber-950/25">
            <p className="text-2xl font-extrabold tabular-nums text-amber-700 dark:text-amber-300">
              {plan.answeredCount}
            </p>
            <p className="text-[11px] font-semibold text-amber-800/80 dark:text-amber-200/80">
              {t({ uz: 'Urinilgan', en: 'Attempted', ru: 'Попыток' })}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50 px-3 py-3 text-center dark:border-emerald-500/30 dark:bg-emerald-950/25">
            <p className="text-2xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
              {plan.correctCount}
            </p>
            <p className="text-[11px] font-semibold text-emerald-800/80 dark:text-emerald-200/80">
              {t({ uz: 'To‘g‘ri', en: 'Correct', ru: 'Верно' })}
            </p>
          </div>
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50 px-3 py-3 text-center dark:border-rose-500/30 dark:bg-rose-950/25">
            <p className="text-2xl font-extrabold tabular-nums text-rose-700 dark:text-rose-300">
              {plan.wrongCount ?? 0}
            </p>
            <p className="text-[11px] font-semibold text-rose-800/80 dark:text-rose-200/80">
              {t({ uz: 'Xato', en: 'Wrong', ru: 'Ошибок' })}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {plan.completed ? (
            <div className="rounded-3xl border-2 border-emerald-300/80 bg-emerald-50 p-5 text-center dark:border-emerald-500/40 dark:bg-emerald-950/30">
              <PartyPopper className="mx-auto h-9 w-9 text-emerald-600 dark:text-emerald-300" />
              <p className="mt-2 font-bold text-emerald-800 dark:text-emerald-200">
                {t({
                  uz: 'Bugungi plan bajarildi! 🎉',
                  en: 'Daily plan completed! 🎉',
                  ru: 'План на сегодня выполнен! 🎉',
                })}
              </p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/70">
                {t({
                  uz: 'Ertaga yangi savollar bilan davom etasiz.',
                  en: 'Continue tomorrow with new questions.',
                  ru: 'Продолжите завтра с новыми вопросами.',
                })}
              </p>
            </div>
          ) : (
            <>
              {energyBanner}
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={outOfEnergy}
                onClick={startQuiz}
                className={clsx(
                  'w-full rounded-2xl py-4 text-base font-bold shadow-md transition',
                  !outOfEnergy
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:bg-[var(--learn-blue)]'
                    : 'cursor-not-allowed bg-slate-300 text-slate-600 dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]',
                )}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Play className="h-5 w-5" />
                  {t({
                    uz: 'Planni to‘ldirish',
                    en: 'Fill the plan',
                    ru: 'Выполнить план',
                  })}
                </span>
              </motion.button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ─── QUIZ ekrani ─────────────────────────────────────────────
  return (
    <div className="px-4 py-4">
      <button
        type="button"
        onClick={backToSummary}
        className="text-sm font-semibold text-blue-700 dark:text-[var(--learn-blue)]"
      >
        ← {t({ uz: 'Plan sahifasi', en: 'Plan page', ru: 'Страница плана' })}
      </button>

      {/* Plan counter + energiya pill */}
      <div className="mt-3 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50 p-3 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]">
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold tabular-nums text-blue-700 shadow-sm dark:bg-[var(--learn-card)] dark:text-[var(--learn-gold)]">
          <ClipboardList className="h-3.5 w-3.5" />
          <motion.span
            key={displayCorrect}
            initial={{ scale: 1.6, color: '#f59e0b' }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {displayCorrect}
          </motion.span>
          <span>/ {goal}</span>

          {/* "+1 plan" — coin-earn uslubidagi uchuvchi chip */}
          <AnimatePresence>
            {feedback === 'correct' && (
              <motion.span
                key={`plus-${question?.id ?? 'q'}`}
                initial={{ opacity: 1, y: 14, scale: 0.9 }}
                animate={{ opacity: 0, y: -30, scale: 1.25 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 text-sm font-extrabold text-emerald-500"
              >
                +1
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        <motion.span
          animate={feedback === 'wrong' ? { x: [0, -4, 4, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1 rounded-full border-2 border-amber-200/80 bg-amber-50 px-2.5 py-1.5 shadow-sm dark:border-[var(--learn-gold)]/45 dark:bg-[#2d2410]/70"
          title={t({
            uz: 'Energiya (har urinish 1 energiya)',
            en: 'Energy (each attempt costs 1)',
            ru: 'Энергия (каждая попытка — 1)',
          })}
        >
          {Array.from({ length: Math.max(0, Math.min(heartsMax, heartsCount)) }).map((_, i) => (
            <Zap
              key={`h-${i}`}
              className="h-4 w-4 fill-current text-amber-500 dark:text-[var(--learn-gold)]"
            />
          ))}
          {Array.from({ length: Math.max(0, heartsMax - heartsCount) }).map((_, i) => (
            <Zap
              key={`e-${i}`}
              className="h-4 w-4 text-slate-400 opacity-50 dark:text-[var(--learn-muted)]"
            />
          ))}
        </motion.span>
      </div>

      <div className="mb-4">
        <LearnProgressBar value={displayPercent} />
      </div>

      {nextQuery.isLoading || nextQuery.isFetching ? (
        <p className="py-10 text-center text-slate-500">
          {t({ uz: 'Savol yuklanmoqda…', en: 'Loading question…', ru: 'Загрузка вопроса…' })}
        </p>
      ) : nextQuery.isError ? (
        <div className="py-8 text-center">
          <p className="text-red-600">
            {t({ uz: 'Savol yuklanmadi', en: 'Failed to load question', ru: 'Вопрос не загрузился' })}
          </p>
          <button
            type="button"
            onClick={() => nextQuery.refetch()}
            className="mt-3 rounded-2xl bg-blue-600 px-6 py-2.5 font-semibold text-white"
          >
            {t({ uz: 'Qayta urinish', en: 'Retry', ru: 'Повторить' })}
          </button>
        </div>
      ) : next?.done ? (
        /* Maqsad bajarildi */
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="flex flex-col items-center py-10 text-center"
        >
          <div className="mb-4 rounded-3xl border-2 border-emerald-300/80 bg-emerald-50 p-5 text-emerald-600 shadow-md dark:border-emerald-500/40 dark:bg-emerald-950/35 dark:text-emerald-300">
            <PartyPopper className="mx-auto h-10 w-10" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
            {t({
              uz: 'Kunlik plan bajarildi! 🎉',
              en: 'Daily plan completed! 🎉',
              ru: 'План выполнен! 🎉',
            })}
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            {t({
              uz: `${goal} ta to‘g‘ri javob yig‘dingiz. Ertaga yangi savollar!`,
              en: `You collected ${goal} correct answers. New questions tomorrow!`,
              ru: `Вы набрали ${goal} верных ответов. Завтра новые вопросы!`,
            })}
          </p>
          <button
            type="button"
            onClick={backToSummary}
            className="w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white"
          >
            {t({ uz: 'Plan sahifasiga qaytish', en: 'Back to plan', ru: 'К плану' })}
          </button>
        </motion.div>
      ) : next?.exhausted ? (
        /* 24 soatlik pool tugadi */
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center py-10 text-center"
        >
          <div className="mb-4 rounded-3xl border-2 border-slate-300/80 bg-slate-100 p-5 text-slate-500 shadow-md dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-300">
            <MoonStar className="mx-auto h-10 w-10" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
            {t({
              uz: 'Bugungi savollar tugadi',
              en: 'No more questions for today',
              ru: 'Вопросы на сегодня закончились',
            })}
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            {t({
              uz: 'Bitta savol 24 soat ichida takrorlanmaydi. Yangi savollar vaqt o‘tishi bilan ochiladi.',
              en: 'A question never repeats within 24 hours. New ones unlock as time passes.',
              ru: 'Вопрос не повторяется в течение 24 часов. Новые откроются со временем.',
            })}
          </p>
          <button
            type="button"
            onClick={backToSummary}
            className="w-full rounded-2xl bg-blue-600 py-3.5 font-bold text-white"
          >
            {t({ uz: 'Plan sahifasiga qaytish', en: 'Back to plan', ru: 'К плану' })}
          </button>
        </motion.div>
      ) : question ? (
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="pb-8"
        >
          {/* Savol kartasi */}
          <div className="relative mb-4 overflow-hidden rounded-3xl border-2 border-blue-200/80 bg-white p-4 shadow-md dark:border-[var(--learn-blue)]/35 dark:bg-[var(--learn-card)]">
            <h2 className="text-lg font-extrabold leading-snug text-slate-900 dark:text-white">
              {question.prompt}
            </h2>
          </div>

          {question.type === 'MATCHING' ? (
            <MatchingBlock
              question={question}
              pairs={matchPairs}
              leftId={matchLeftId}
              pickable={pickable}
              submitting={matchingMut.isPending}
              feedback={feedback}
              onLeftPick={(id) => {
                if (!pickable) return;
                const paired = matchPairs.find((p) => p.leftOptionId === id);
                if (paired) {
                  setMatchPairs((prev) =>
                    prev.filter((p) => p.pairIndex !== paired.pairIndex),
                  );
                  setMatchLeftId(null);
                  return;
                }
                setMatchLeftId((cur) => (cur === id ? null : id));
              }}
              onRightPick={(rightId) => {
                if (!pickable) return;
                const paired = matchPairs.find(
                  (p) => p.rightOptionId === rightId,
                );
                if (paired) {
                  setMatchPairs((prev) =>
                    prev.filter((p) => p.pairIndex !== paired.pairIndex),
                  );
                  setMatchLeftId(null);
                  return;
                }
                if (!matchLeftId) return;
                if (matchPairs.some((p) => p.leftOptionId === matchLeftId)) return;
                const used = new Set(matchPairs.map((p) => p.pairIndex));
                let nextIndex = 0;
                while (used.has(nextIndex)) nextIndex++;
                setMatchPairs((prev) => [
                  ...prev,
                  { leftOptionId: matchLeftId, rightOptionId: rightId, pairIndex: nextIndex },
                ]);
                setMatchLeftId(null);
              }}
              onSubmit={() => {
                matchingMut.mutate({
                  questionId: question.id,
                  pairs: matchPairs
                    .slice()
                    .sort((a, b) => a.pairIndex - b.pairIndex)
                    .map(({ leftOptionId, rightOptionId }) => ({
                      leftOptionId,
                      rightOptionId,
                    })),
                });
              }}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {[...question.options]
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((opt, oi) => {
                  const isPicked = pickedOptionId === opt.id;
                  const isRevealedCorrect = revealedCorrectOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={!pickable}
                      onClick={() => {
                        if (!pickable) return;
                        setSubmitError(null);
                        answerMut.mutate({
                          questionId: question.id,
                          selectedOptionId: opt.id,
                        });
                      }}
                      className={clsx(
                        'w-full rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition',
                        feedback && isRevealedCorrect
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                          : feedback === 'wrong' && isPicked
                            ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
                            : 'border-slate-200 bg-white hover:border-blue-400 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
                        !pickable && !feedback && 'opacity-70',
                      )}
                    >
                      <span className="mr-2 font-bold">
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      {opt.optionText}
                    </button>
                  );
                })}
            </div>
          )}

          {/* Feedback banner */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className={clsx(
                  'mt-4 rounded-2xl border-2 px-4 py-3 shadow-lg',
                  feedback === 'correct'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/45 dark:bg-[#0d241c] dark:text-emerald-100'
                    : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/45 dark:bg-[#2d1218] dark:text-rose-100',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-semibold">
                    {feedback === 'correct' ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        {t({ uz: 'To‘g‘ri! +1 plan', en: 'Correct! +1 plan', ru: 'Верно! +1 план' })}
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" />
                        {t({ uz: 'Noto‘g‘ri', en: 'Wrong', ru: 'Неверно' })}
                      </>
                    )}
                  </span>
                  <span
                    className={clsx(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
                      'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
                    )}
                  >
                    <Zap className="h-3.5 w-3.5" /> -1
                  </span>
                </div>
                <button
                  type="button"
                  onClick={goNext}
                  className={clsx(
                    'mt-3 w-full rounded-2xl py-3.5 text-base font-bold shadow-md text-white',
                    feedback === 'correct'
                      ? 'bg-emerald-600 dark:bg-emerald-500'
                      : 'bg-rose-600 dark:bg-rose-500',
                  )}
                >
                  {t({ uz: 'Keyingi savol', en: 'Next question', ru: 'Следующий вопрос' })}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {outOfEnergy && <div className="mt-4">{energyBanner}</div>}

          {submitError && !outOfEnergy && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <XCircle className="h-5 w-5 shrink-0" />
              {submitError}
            </div>
          )}
        </motion.div>
      ) : null}
    </div>
  );
}

/** Kunlik plan uchun ixcham MATCHING (juftlash) bloki. */
function MatchingBlock({
  question,
  pairs,
  leftId,
  pickable,
  submitting,
  feedback,
  onLeftPick,
  onRightPick,
  onSubmit,
}: {
  question: MobileQuestion;
  pairs: MatchPairDraft[];
  leftId: string | null;
  pickable: boolean;
  submitting: boolean;
  feedback: 'correct' | 'wrong' | null;
  onLeftPick: (id: string) => void;
  onRightPick: (id: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  const left = [...question.options].sort((a, b) => a.orderIndex - b.orderIndex);
  // O'ng ustun surilgan tartibda — javoblar to'g'ridan-to'g'ri ro'parada
  // turmasligi uchun (TheoryLessonPage bilan bir xil usul).
  const right = left.map((_, i) => left[(i + 1) % left.length]);
  const byLeft = new Map(pairs.map((p) => [p.leftOptionId, p]));
  const byRight = new Map(pairs.map((p) => [p.rightOptionId, p]));
  const canSubmit = pairs.length === left.length && pickable;

  const pairCls = (pairIndex: number) => PAIR_PALETTE[pairIndex % PAIR_PALETTE.length];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {left.map((opt, i) => {
            const paired = byLeft.get(opt.id);
            const active = leftId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={!pickable}
                onClick={() => onLeftPick(opt.id)}
                className={clsx(
                  'flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-3 text-left shadow-sm transition',
                  'border-slate-200 bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
                  paired != null && pairCls(paired.pairIndex),
                  active && 'border-blue-500 ring-2 ring-blue-300/40',
                  !pickable && 'opacity-70',
                )}
              >
                <span className="min-w-0 flex-1 text-sm font-bold text-slate-900 dark:text-white">
                  {String.fromCharCode(65 + i)}. {opt.optionText}
                </span>
                {paired != null && (
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                    #{paired.pairIndex + 1} ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {right.map((opt, i) => {
            const paired = byRight.get(opt.id);
            const dimmed = !pickable || (!leftId && paired == null);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={!pickable}
                onClick={() => onRightPick(opt.id)}
                className={clsx(
                  'flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-3 text-left shadow-sm transition',
                  'border-slate-200 bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
                  paired != null && pairCls(paired.pairIndex),
                  dimmed && 'opacity-70',
                )}
              >
                <span className="min-w-0 flex-1 text-sm font-bold text-slate-900 dark:text-white">
                  {String.fromCharCode(65 + i)}. {opt.matchText ?? ''}
                </span>
                {paired != null && (
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
                    #{paired.pairIndex + 1} ✕
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!feedback && (
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={onSubmit}
          className={clsx(
            'w-full rounded-2xl py-3.5 text-base font-bold shadow-md transition',
            canSubmit && !submitting
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:bg-[var(--learn-blue)]'
              : 'cursor-not-allowed bg-slate-300 text-slate-600 dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]',
          )}
        >
          {t({ uz: "Jo'natish", en: 'Submit', ru: 'Отправить' })}
        </button>
      )}
    </div>
  );
}
