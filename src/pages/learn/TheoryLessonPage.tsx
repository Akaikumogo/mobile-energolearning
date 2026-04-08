import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Heart,
  HeartCrack,
  PartyPopper,
  Home,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import type { MobileNazariyaSection, MobileQuestion, MatchingPair } from '@/services/api';
import { queryClient } from '@/queryClient';
import { CheerfulBackLink } from '@/components/CheerfulBackLink';
import TheorySlideCard from '@/components/TheorySlideCard';
import LearnProgressBar from '@/components/LearnProgressBar';
import clsx from 'clsx';

type FlatReadStep =
  | { kind: 'slide'; sectionIdx: number; slideIdx: number }
  | { kind: 'sectionText'; sectionIdx: number };

export default function TheoryLessonPage() {
  const { levelId, theoryId } = useParams<{
    levelId: string;
    theoryId: string;
  }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'read' | 'quiz' | 'done'>('read');
  const [readStep, setReadStep] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [lastXp, setLastXp] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null);
  const [revealedCorrectOptionId, setRevealedCorrectOptionId] = useState<
    string | null
  >(null);
  const [outOfLives, setOutOfLives] = useState(false);
  const [matchLeftId, setMatchLeftId] = useState<string | null>(null);
  const [matchPairs, setMatchPairs] = useState<
    Array<{ leftOptionId: string; rightOptionId: string; pairIndex: number }>
  >([]);

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

  useEffect(() => {
    setReadStep(0);
    setPhase('read');
    setQIndex(0);
  }, [theoryId]);

  useEffect(() => {
    setMatchLeftId(null);
    setMatchPairs([]);
  }, [qIndex, phase, theoryId]);

  const quizTheoryId =
    theoryQuery.data != null
      ? (theoryQuery.data.quizTheoryId ?? theoryQuery.data.id)
      : '';

  const questionsQuery = useQuery({
    queryKey: ['theory-questions', quizTheoryId],
    queryFn: () => mobileApi.getQuestionsByTheory(quizTheoryId),
    enabled: !!quizTheoryId && theoryQuery.isSuccess,
  });

  const sections: MobileNazariyaSection[] = useMemo(() => {
    const theory = theoryQuery.data;
    if (!theory) return [];
    const n = theory.nazariyaSections;
    if (n && n.length > 0) return n;
    return [
      {
        id: theory.id,
        title: theory.title,
        slides: theory.slides ?? null,
        content: !theory.slides?.length ? theory.content : '',
      },
    ];
  }, [theoryQuery.data]);

  const flatReadSteps = useMemo((): FlatReadStep[] => {
    const theory = theoryQuery.data;
    const flat: FlatReadStep[] = [];
    for (let si = 0; si < sections.length; si++) {
      const sec = sections[si];
      if (sec.slides?.length) {
        for (let j = 0; j < sec.slides.length; j++) {
          flat.push({ kind: 'slide', sectionIdx: si, slideIdx: j });
        }
      } else if (sec.content?.trim()) {
        flat.push({ kind: 'sectionText', sectionIdx: si });
      }
    }
    if (flat.length === 0 && theory?.content?.trim()) {
      flat.push({ kind: 'sectionText', sectionIdx: 0 });
    }
    return flat;
  }, [sections, theoryQuery.data]);

  const questions = (questionsQuery.data ?? []).sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );
  const question: MobileQuestion | undefined = questions[qIndex];

  const totalReadingSteps = flatReadSteps.length;
  const qLen =
    questions.length > 0
      ? questions.length
      : questionsQuery.isLoading && quizTheoryId
        ? 4
        : 0;
  const totalSteps = totalReadingSteps + qLen;
  const progressPct = useMemo(() => {
    if (totalSteps <= 0) return 0;
    const current =
      phase === 'done'
        ? totalSteps
        : phase === 'quiz'
          ? totalReadingSteps + qIndex + 1
          : readStep + 1;
    return Math.min(100, (current / totalSteps) * 100);
  }, [phase, totalSteps, totalReadingSteps, qIndex, readStep]);

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
      setRevealedCorrectOptionId(
        res.correctOptionId ??
          (res.isCorrect ? variables.selectedOptionId : null),
      );
      setLastXp((x) => x + res.xpEarned);
      if (!res.isCorrect && heartsCount <= 1) {
        setOutOfLives(true);
      }
      queryClient.invalidateQueries({ queryKey: ['progress-me'] });
      queryClient.invalidateQueries({ queryKey: ['level-detail', levelId] });
    },
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
      setFeedback(res.isCorrect ? 'correct' : 'wrong');
      setPickedOptionId(null);
      setRevealedCorrectOptionId(null);
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
    setPickedOptionId(null);
    setRevealedCorrectOptionId(null);
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

  const step = flatReadSteps[readStep];
  const sec = step ? sections[step.sectionIdx] : undefined;
  const nazCount = Math.max(sections.length, 1);
  const nazNum = step ? step.sectionIdx + 1 : 1;
  const slideInSec =
    step?.kind === 'slide' && sec?.slides?.length
      ? step.slideIdx + 1
      : step?.kind === 'sectionText'
        ? 1
        : 0;
  const slideMax =
    step?.kind === 'slide' && sec?.slides?.length ? sec.slides.length : 1;

  const nextRead = () => {
    if (readStep < flatReadSteps.length - 1) {
      setReadStep((s) => s + 1);
    } else if (canDoQuiz) {
      setPhase('quiz');
    }
  };

  return (
    <div className="px-4 py-4">
      <CheerfulBackLink to={`/learn/level/${levelId}`}>
        {t({ uz: 'Level', en: 'Level', ru: 'Уровень' })}
      </CheerfulBackLink>

      <AnimatePresence mode="wait">
        {phase === 'read' && (
          <motion.div
            key="read"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              <span className="mr-2 inline-block" aria-hidden>
                📘
              </span>
              {theory.title}
            </h1>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={clsx(
                  'rounded-full border px-3 py-1 text-[11px] font-bold tabular-nums',
                  'border-amber-400/60 bg-amber-500/15 text-amber-900 dark:border-[var(--learn-gold)]/40 dark:bg-amber-500/10 dark:text-[var(--learn-gold)]',
                )}
              >
                {t({ uz: 'Nazariya', en: 'Theory', ru: 'Теория' })}{' '}
                {nazNum}/{nazCount}
              </span>
              {step?.kind === 'slide' ? (
                <span
                  className={clsx(
                    'rounded-full border px-3 py-1 text-[11px] font-bold tabular-nums',
                    'border-slate-300/80 bg-slate-100 text-slate-800 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-200',
                  )}
                >
                  {t({ uz: 'Slayd', en: 'Slide', ru: 'Слайд' })}{' '}
                  {slideInSec}/{slideMax}
                </span>
              ) : step?.kind === 'sectionText' ? (
                <span
                  className={clsx(
                    'rounded-full border px-3 py-1 text-[11px] font-bold tabular-nums',
                    'border-slate-300/80 bg-slate-100 text-slate-800 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-200',
                  )}
                >
                  {t({ uz: 'Matn', en: 'Text', ru: 'Текст' })}{' '}
                  {readStep + 1}/{flatReadSteps.length}
                </span>
              ) : null}
              {qLen > 0 ? (
                <span
                  className={clsx(
                    'ml-auto rounded-full border px-3 py-1 text-[11px] font-bold tabular-nums',
                    'border-blue-300/70 bg-blue-500/10 text-blue-900 dark:border-[var(--learn-blue)]/50 dark:bg-blue-500/10 dark:text-blue-200',
                  )}
                >
                  {t({ uz: 'Savollar', en: 'Questions', ru: 'Вопросы' })}{' '}
                  {qLen}
                </span>
              ) : null}
            </div>
            <div className="mb-4">
              <LearnProgressBar value={progressPct} />
            </div>

            {sec && step?.kind === 'slide' ? (
              <>
                {readStep === 0 && theory.content?.trim() ? (
                  <div className="mb-4 max-w-none whitespace-pre-wrap rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-600 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-slate-400">
                    {theory.content}
                  </div>
                ) : null}
                {sec.title ? (
                  <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {sec.title}
                  </p>
                ) : null}
                <TheorySlideCard slide={sec.slides![step.slideIdx]} />
                {readStep < flatReadSteps.length - 1 ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={nextRead}
                    className="mt-4 w-full rounded-2xl bg-slate-800 py-4 text-base font-bold text-white shadow-lg dark:bg-[var(--learn-surface)] dark:ring-1 dark:ring-[var(--learn-border)]"
                  >
                    {t({ uz: 'Keyingisi', en: 'Next', ru: 'Далее' })}
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    whileTap={canDoQuiz ? { scale: 0.98 } : undefined}
                    onClick={nextRead}
                    disabled={!canDoQuiz}
                    className={clsx(
                      'mt-4 w-full rounded-2xl py-4 text-base font-bold shadow-lg transition',
                      canDoQuiz
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:bg-[var(--learn-blue)] dark:shadow-[0_8px_28px_rgba(61,142,255,0.35)]'
                        : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]',
                    )}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {t({
                        uz: 'Savollarni boshlash',
                        en: 'Start questions',
                        ru: 'Начать вопросы',
                      })}
                      {canDoQuiz ? (
                        <span className="text-lg leading-none" aria-hidden>
                          ✨
                        </span>
                      ) : null}
                    </span>
                  </motion.button>
                )}
              </>
            ) : sec && step?.kind === 'sectionText' ? (
              <>
                {readStep === 0 && theory.content?.trim() ? (
                  <div className="mb-4 max-w-none whitespace-pre-wrap rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs leading-relaxed text-slate-600 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-slate-400">
                    {theory.content}
                  </div>
                ) : null}
                {sec.title ? (
                  <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {sec.title}
                  </p>
                ) : null}
                <div className="mb-6 max-w-none whitespace-pre-wrap rounded-3xl border border-slate-200/80 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-300">
                  {sec.content?.trim() || theory.content || ''}
                </div>
                {readStep < flatReadSteps.length - 1 ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={nextRead}
                    className="w-full rounded-2xl bg-slate-800 py-4 text-base font-bold text-white shadow-lg dark:bg-[var(--learn-surface)] dark:ring-1 dark:ring-[var(--learn-border)]"
                  >
                    {t({ uz: 'Keyingisi', en: 'Next', ru: 'Далее' })}
                  </motion.button>
                ) : (
                  <motion.button
                    type="button"
                    whileTap={canDoQuiz ? { scale: 0.98 } : undefined}
                    onClick={nextRead}
                    disabled={!canDoQuiz}
                    className={clsx(
                      'w-full rounded-2xl py-4 text-base font-bold shadow-lg transition',
                      canDoQuiz
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:bg-[var(--learn-blue)] dark:shadow-[0_8px_28px_rgba(61,142,255,0.35)]'
                        : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]',
                    )}
                  >
                    <span className="inline-flex items-center justify-center gap-2">
                      {t({
                        uz: 'Savollarni boshlash',
                        en: 'Start questions',
                        ru: 'Начать вопросы',
                      })}
                      {canDoQuiz ? (
                        <span className="text-lg leading-none" aria-hidden>
                          ✨
                        </span>
                      ) : null}
                    </span>
                  </motion.button>
                )}
              </>
            ) : (
              <>
                <div className="mb-6 max-w-none whitespace-pre-wrap rounded-3xl border border-slate-200/80 bg-white p-4 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-300">
                  {theory.content || ''}
                </div>
                <motion.button
                  type="button"
                  whileTap={canDoQuiz ? { scale: 0.98 } : undefined}
                  onClick={() => {
                    if (!canDoQuiz) return;
                    setPhase('quiz');
                  }}
                  disabled={!canDoQuiz}
                  className={clsx(
                    'w-full rounded-2xl py-4 text-base font-bold shadow-lg transition',
                    canDoQuiz
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 dark:bg-[var(--learn-blue)] dark:shadow-[0_8px_28px_rgba(61,142,255,0.35)]'
                      : 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-[var(--learn-card)] dark:text-[var(--learn-muted)]',
                  )}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {t({
                      uz: 'Savollarni boshlash',
                      en: 'Start questions',
                      ru: 'Начать вопросы',
                    })}
                    {canDoQuiz ? (
                      <span className="text-lg leading-none" aria-hidden>
                        ✨
                      </span>
                    ) : null}
                  </span>
                </motion.button>
              </>
            )}
            {!canDoQuiz && (
              <p className="mt-3 text-center text-sm text-rose-600 dark:text-[var(--learn-red)]">
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
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="pb-8"
          >
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-slate-50 p-3 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold tabular-nums text-blue-700 shadow-sm dark:bg-[var(--learn-card)] dark:text-[var(--learn-gold)] dark:shadow-none">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-[var(--learn-gold)]" />
                {qIndex + 1} / {questions.length}
              </span>
              <span
                className="inline-flex items-center gap-1 rounded-full border-2 border-rose-200/80 bg-rose-50 px-2.5 py-1.5 shadow-sm dark:border-[var(--learn-red)]/45 dark:bg-[#2d1218]/70 dark:shadow-[0_0_16px_rgba(255,71,87,0.12)]"
                title={t({
                  uz: 'Qolgan urinishlar',
                  en: 'Attempts left',
                  ru: 'Осталось попыток',
                })}
              >
                {Array.from({ length: heartsUi.cnt }).map((_, i) => (
                  <Heart
                    key={`h-${i}`}
                    className="h-4 w-4 fill-current text-rose-500 dark:text-[var(--learn-red)]"
                  />
                ))}
                {Array.from({ length: heartsUi.empty }).map((_, i) => (
                  <HeartCrack
                    key={`e-${i}`}
                    className="h-4 w-4 text-slate-400 opacity-70 dark:text-[var(--learn-muted)]"
                  />
                ))}
              </span>
            </div>
            <div className="mb-4">
              <LearnProgressBar
                value={progressPct}
                colorClassName="bg-blue-600 dark:bg-[var(--learn-blue)]"
              />
            </div>

            <div className="relative mb-4 overflow-hidden rounded-3xl border-2 border-blue-200/80 bg-white p-4 shadow-md dark:border-[var(--learn-blue)]/35 dark:bg-[var(--learn-card)] dark:shadow-[0_0_40px_rgba(61,142,255,0.14)]">
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-400/20 blur-2xl dark:bg-[var(--learn-blue)]/20"
                aria-hidden
              />
              <div className="relative">
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-800 dark:bg-[var(--learn-blue)]/20 dark:text-[var(--learn-blue)]">
                  <Sparkles className="h-3 w-3" />
                  {t({ uz: 'Savol', en: 'Question', ru: 'Вопрос' })}
                </span>
                <h2 className="text-lg font-extrabold leading-snug text-slate-900 dark:text-white">
                  {question.prompt}
                </h2>
              </div>
            </div>

            {question.type === 'MATCHING' ? (
              (() => {
                const left = [...question.options].sort(
                  (a, b) => a.orderIndex - b.orderIndex,
                );
                const right = left.map((_, i) => left[(i + 1) % left.length]);
                const byLeft = new Map(
                  matchPairs.map((p) => [p.leftOptionId, p]),
                );
                const byRight = new Map(
                  matchPairs.map((p) => [p.rightOptionId, p]),
                );
                const palette = [
                  'border-blue-500 bg-blue-50',
                  'border-emerald-500 bg-emerald-50',
                  'border-amber-500 bg-amber-50',
                  'border-purple-500 bg-purple-50',
                  'border-rose-500 bg-rose-50',
                  'border-cyan-500 bg-cyan-50',
                ] as const;

                const pickable =
                  !feedback && !matchingMut.isPending && canDoQuiz;
                const lockOtherLeft = matchLeftId != null;

                const onPickLeft = (id: string) => {
                  if (!pickable) return;
                  if (byLeft.has(id)) return;
                  setMatchLeftId(id);
                };

                const onPickRight = (rightId: string) => {
                  if (!pickable) return;
                  if (!matchLeftId) return;
                  if (byLeft.has(matchLeftId) || byRight.has(rightId)) return;

                  const nextIndex = matchPairs.length;
                  const next = [
                    ...matchPairs,
                    {
                      leftOptionId: matchLeftId,
                      rightOptionId: rightId,
                      pairIndex: nextIndex,
                    },
                  ];
                  setMatchPairs(next);
                  setMatchLeftId(null);

                  if (next.length === left.length) {
                    matchingMut.mutate({
                      questionId: question.id,
                      pairs: next.map(({ leftOptionId, rightOptionId }) => ({
                        leftOptionId,
                        rightOptionId,
                      })),
                    });
                  }
                };

                const getPairClasses = (pairIndex: number) =>
                  palette[pairIndex % palette.length];

                return (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      {left.map((opt, i) => {
                        const paired = byLeft.get(opt.id);
                        const active = matchLeftId === opt.id;
                        const disabled =
                          !pickable ||
                          paired != null ||
                          (lockOtherLeft && !active);
                        const pairCls =
                          paired != null
                            ? getPairClasses(paired.pairIndex)
                            : '';
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => onPickLeft(opt.id)}
                            className={clsx(
                              'flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-3 text-left shadow-sm transition',
                              'border-slate-200 bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
                              paired != null && pairCls,
                              active &&
                                'border-blue-500 ring-2 ring-blue-300/40 dark:ring-blue-400/20',
                              disabled && 'opacity-70',
                            )}
                          >
                            <span className="min-w-0 flex-1 font-bold text-slate-900 dark:text-white">
                              {String.fromCharCode(65 + i)}. {opt.optionText}
                            </span>
                            {paired != null && (
                              <span className="text-xs font-extrabold text-slate-600">
                                #{paired.pairIndex + 1}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-2">
                      {right.map((opt, i) => {
                        const paired = byRight.get(opt.id);
                        const disabled = !pickable || !matchLeftId || paired != null;
                        const pairCls =
                          paired != null
                            ? getPairClasses(paired.pairIndex)
                            : '';
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => onPickRight(opt.id)}
                            className={clsx(
                              'flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-3 text-left shadow-sm transition',
                              'border-slate-200 bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
                              paired != null && pairCls,
                              disabled && 'opacity-70',
                            )}
                          >
                            <span className="min-w-0 flex-1 font-bold text-slate-900 dark:text-white">
                              {String.fromCharCode(65 + i)}. {opt.matchText ?? ''}
                            </span>
                            {paired != null && (
                              <span className="text-xs font-extrabold text-slate-600">
                                #{paired.pairIndex + 1}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col gap-3">
                {[...question.options]
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    const pickable =
                      !feedback && !answerMut.isPending && canDoQuiz;
                    const showResult = Boolean(feedback);
                    const isWrongPick =
                      showResult &&
                      feedback === 'wrong' &&
                      pickedOptionId === opt.id;
                    const isCorrectReveal =
                      showResult &&
                      revealedCorrectOptionId != null &&
                      revealedCorrectOptionId === opt.id;
                    const isOtherAfterResult =
                      showResult && !isWrongPick && !isCorrectReveal;

                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        disabled={!pickable}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: oi * 0.07,
                          type: 'spring',
                          stiffness: 380,
                          damping: 26,
                        }}
                        whileTap={pickable ? { scale: 0.98 } : undefined}
                        onClick={() => onPickOption(opt.id)}
                        className={clsx(
                          'flex items-start gap-3 rounded-2xl border-2 px-3 py-3.5 text-left shadow-sm transition',
                          !isWrongPick &&
                            !isCorrectReveal &&
                            'border-slate-200/90 bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]',
                          pickable &&
                            'hover:border-blue-400 hover:bg-sky-50/80 hover:shadow-md dark:hover:border-[var(--learn-blue)] dark:hover:bg-[#1e3a5f]/40 dark:hover:shadow-[0_0_20px_rgba(61,142,255,0.15)]',
                          isWrongPick &&
                            'border-rose-500 bg-rose-50 shadow-md dark:border-[var(--learn-red)] dark:bg-[#3d151a]/90',
                          isCorrectReveal &&
                            'border-emerald-500 bg-emerald-50 shadow-md dark:border-[var(--learn-green)] dark:bg-[#0d241c]',
                          isOtherAfterResult && 'opacity-55',
                          !canDoQuiz && !showResult && 'opacity-60',
                        )}
                      >
                        <span
                          className={clsx(
                            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black text-white shadow-md',
                            isWrongPick &&
                              'border-rose-600 bg-rose-600 ring-2 ring-rose-300/40 dark:border-[var(--learn-red)] dark:bg-[var(--learn-red)] dark:ring-rose-400/25',
                            isCorrectReveal &&
                              'border-emerald-600 bg-emerald-600 ring-2 ring-emerald-300/40 dark:border-[var(--learn-green)] dark:bg-[var(--learn-green)] dark:ring-emerald-400/25',
                            !isWrongPick &&
                              !isCorrectReveal &&
                              'border-blue-500/50 bg-blue-600 ring-2 ring-blue-400/25 dark:border-[var(--learn-blue)] dark:bg-[var(--learn-blue)] dark:ring-blue-400/20',
                            isOtherAfterResult &&
                              'border-slate-300 bg-slate-400 text-white ring-0 dark:border-slate-600 dark:bg-slate-600',
                          )}
                        >
                          {letter}
                        </span>
                        <span
                          className={clsx(
                            'min-w-0 flex-1 pt-0.5 text-base font-bold',
                            isWrongPick &&
                              'text-rose-900 dark:text-rose-100',
                            isCorrectReveal &&
                              'text-emerald-900 dark:text-emerald-100',
                            !isWrongPick &&
                              !isCorrectReveal &&
                              'text-slate-800 dark:text-slate-100',
                          )}
                        >
                          {opt.optionText}
                          {opt.matchText ? (
                            <span
                              className={clsx(
                                'mt-1 block text-xs font-medium',
                                isWrongPick &&
                                  'text-rose-800/90 dark:text-rose-200/80',
                                isCorrectReveal &&
                                  'text-emerald-800/90 dark:text-emerald-200/80',
                                !isWrongPick &&
                                  !isCorrectReveal &&
                                  'text-slate-500 dark:text-slate-400',
                              )}
                            >
                              {opt.matchText}
                            </span>
                          ) : null}
                        </span>
                      </motion.button>
                    );
                  })}
              </div>
            )}

            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                className={clsx(
                  'mt-4 rounded-2xl border-2 px-4 py-3 shadow-lg',
                  feedback === 'correct'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-[var(--learn-green)]/45 dark:bg-[#0d241c] dark:text-emerald-100'
                    : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-[var(--learn-red)]/45 dark:bg-[#2d1218] dark:text-rose-100',
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
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (feedback === 'wrong' && outOfLives) {
                      navigate('/learn', { replace: true });
                      return;
                    }
                    nextQuestion();
                  }}
                  className={clsx(
                    'mt-3 w-full rounded-2xl py-3.5 text-base font-bold shadow-md',
                    feedback === 'correct'
                      ? 'bg-emerald-600 text-white dark:bg-[var(--learn-green)] dark:shadow-[0_6px_20px_rgba(0,200,150,0.25)]'
                      : 'bg-rose-600 text-white dark:bg-[var(--learn-red)] dark:shadow-[0_6px_20px_rgba(255,71,87,0.25)]',
                  )}
                >
                  {feedback === 'wrong' && outOfLives
                    ? t({ uz: 'Bosh menyu', en: 'Main menu', ru: 'Главное меню' })
                    : t({ uz: 'Keyingisi', en: 'Next', ru: 'Далее' })}
                </motion.button>
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
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className="flex flex-col items-center py-10 text-center"
          >
            <div className="mb-4 rounded-3xl border-2 border-amber-300/80 bg-amber-50 p-5 text-amber-700 shadow-md dark:border-[var(--learn-gold)]/40 dark:bg-amber-950/35 dark:text-amber-200">
              <PartyPopper className="mx-auto h-10 w-10" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              {t({ uz: 'Yakunlandi!', en: 'Completed!', ru: 'Готово!' })}
            </h2>
            <p className="mb-6 text-amber-600 dark:text-[var(--learn-gold)]">
              +{lastXp} XP
            </p>
            <CheerfulBackLink to={`/learn/level/${levelId}`} variant="cta">
              {t({ uz: 'Levelga qaytish', en: 'Back to level', ru: 'К уровню' })}
            </CheerfulBackLink>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
