import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  KeyRound,
  LoaderCircle,
  ShieldAlert,
} from 'lucide-react';
import mobileApi, {
  type ExamLiveQuestion,
  type ExamQuestionSection,
  getExamLiveSocketUrl,
} from '@/services/api';

type AnswerMap = Record<string, string | null>;

export default function ExamLiveSessionPage() {
  const { sessionId = '' } = useParams();
  const token = localStorage.getItem('accessToken') || '';

  const socketRef = useRef<Socket | null>(null);
  const [codeFromModerator, setCodeFromModerator] = useState<string>('');
  const [rejectedReason, setRejectedReason] = useState<string>('');

  const stateQuery = useQuery({
    queryKey: ['exam-live-state', sessionId],
    enabled: !!sessionId,
    queryFn: () => mobileApi.examLiveGetSessionState(sessionId),
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (!sessionId || !token) return;
    const socket = io(`${getExamLiveSocketUrl()}/exam-live`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_session', { sessionId });
    });
    socket.on('code_issued', (payload: { code?: string; expiresAt?: string }) => {
      if (payload?.code) setCodeFromModerator(payload.code);
    });
    socket.on('moderator_rejected', (payload: { reason?: string }) => {
      setRejectedReason(payload?.reason || 'Rad etildi');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, token]);

  // Tab-switch tracking (basic): if exam is in progress and tab gets hidden, notify backend.
  useEffect(() => {
    const handler = () => {
      const st = stateQuery.data?.status;
      if (!sessionId) return;
      if (document.visibilityState === 'hidden' && st === 'IN_PROGRESS') {
        void mobileApi.examLiveTabSwitch(sessionId).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [sessionId, stateQuery.data?.status]);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => mobileApi.examLiveVerifyCode(sessionId, code),
    onSuccess: () => void stateQuery.refetch(),
  });

  const [activeSection, setActiveSection] = useState<ExamQuestionSection | null>(null);
  const [questions, setQuestions] = useState<ExamLiveQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);

  const startSectionMutation = useMutation({
    mutationFn: (section: ExamQuestionSection) => mobileApi.examLiveStartSection(sessionId, section),
    onSuccess: (data) => {
      setActiveSection(data.section);
      setQuestions(data.questions || []);
      setAnswers({});
    },
  });

  const answerMutation = useMutation({
    mutationFn: (body: { section: ExamQuestionSection; questionId: string; selectedOptionId: string }) =>
      mobileApi.examLiveAnswer(sessionId, body),
  });

  const canStart = useMemo(() => {
    const st = stateQuery.data;
    if (!st) return false;
    return st.status === 'IN_PROGRESS';
  }, [stateQuery.data]);

  const showCodeStep = useMemo(() => {
    const st = stateQuery.data;
    if (!st) return false;
    return st.status === 'WAITING_CODE';
  }, [stateQuery.data]);

  const showWaitingModerator = useMemo(() => {
    const st = stateQuery.data;
    if (!st) return false;
    return st.status === 'WAITING_MODERATOR';
  }, [stateQuery.data]);

  const showCancelled = stateQuery.data?.status === 'CANCELLED';
  const showAwaitingOral = stateQuery.data?.oralPending === true;

  const submitSection = async () => {
    if (!activeSection) return;
    try {
      setSubmitting(true);
      await mobileApi.examLiveSubmitSection(sessionId, activeSection);
      setActiveSection(null);
      setQuestions([]);
      setAnswers({});
      await stateQuery.refetch();
    } finally {
      setSubmitting(false);
    }
  };

  const header = (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[var(--learn-muted)]">
            Exam Live
          </p>
          <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
            Sessiya: {sessionId.slice(0, 8)}…
          </p>
        </div>
        {stateQuery.isFetching ? (
          <LoaderCircle className="h-5 w-5 animate-spin text-slate-400" />
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]">
          <Clock className="h-4 w-4" />
          {stateQuery.data?.status ?? '—'}
        </span>
        {stateQuery.data?.includesPt ? (
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
            PT
          </span>
        ) : null}
        {stateQuery.data?.includesTb ? (
          <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
            TB
          </span>
        ) : null}
      </div>
    </div>
  );

  if (!sessionId) {
    return (
      <div className="p-6 text-center text-slate-500">Session topilmadi</div>
    );
  }

  return (
    <div className="px-safe-4 py-6 space-y-4">
      {header}

      {rejectedReason || stateQuery.data?.rejectionReason ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-5 w-5" />
            <div>
              <p className="font-semibold">Moderator rad etdi</p>
              <p className="text-sm opacity-90">
                {rejectedReason || stateQuery.data?.rejectionReason}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showCancelled ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-semibold">Imtihon bekor qilindi</p>
              <p className="text-sm opacity-90">
                Ehtimol, ilovadan ko‘p chiqib ketilgan (tab-switch) yoki moderator bekor qilgan.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {showWaitingModerator ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Moderator tasdig‘ini kuting
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Moderator approve qilgach, 10 belgili kod beriladi.
          </p>
          {codeFromModerator ? (
            <div className="mt-3 rounded-2xl bg-slate-50 p-3 font-mono text-sm dark:bg-[var(--learn-surface)]">
              Kod: <span className="font-bold">{codeFromModerator}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {showCodeStep ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <KeyRound className="h-4 w-4" />
            Kodni kiriting
          </p>
          <input
            value={codeFromModerator}
            onChange={(e) => setCodeFromModerator(e.target.value.toUpperCase())}
            placeholder="Masalan: ABCD1234EF"
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-white"
          />
          <button
            type="button"
            onClick={() => verifyMutation.mutate(codeFromModerator.trim())}
            disabled={!codeFromModerator.trim() || verifyMutation.isPending}
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {verifyMutation.isPending ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
          </button>
          {verifyMutation.isError ? (
            <p className="mt-2 text-sm text-rose-600">Kod noto‘g‘ri yoki eskirgan</p>
          ) : null}
        </div>
      ) : null}

      {showAwaitingOral ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-semibold">Test bo‘limlari yakunlandi</p>
              <p className="text-sm opacity-90">
                Og‘zaki baho uchun moderatorka boring.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {canStart && !activeSection ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Bo‘lim tanlang
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => startSectionMutation.mutate('PT')}
              disabled={!stateQuery.data?.includesPt || stateQuery.data?.ptCompleted || startSectionMutation.isPending}
              className={clsx(
                'rounded-2xl border px-4 py-4 text-sm font-semibold',
                stateQuery.data?.includesPt && !stateQuery.data?.ptCompleted
                  ? 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-100'
                  : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-slate-500',
              )}
            >
              PT
            </button>
            <button
              type="button"
              onClick={() => startSectionMutation.mutate('TB')}
              disabled={!stateQuery.data?.includesTb || stateQuery.data?.tbCompleted || startSectionMutation.isPending}
              className={clsx(
                'rounded-2xl border px-4 py-4 text-sm font-semibold',
                stateQuery.data?.includesTb && !stateQuery.data?.tbCompleted
                  ? 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-100'
                  : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-slate-500',
              )}
            >
              TB
            </button>
          </div>
          {startSectionMutation.isError ? (
            <p className="mt-3 text-sm text-rose-600">Bo‘limni boshlashda xato</p>
          ) : null}
        </div>
      ) : null}

      {activeSection ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Bo‘lim: {activeSection}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Javob tanlang, keyin yakunlang.
          </p>

          <div className="mt-4 space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {q.orderIndex + 1}. {q.prompt}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((o) => {
                    const selected = answers[q.id] === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setAnswers((prev) => ({ ...prev, [q.id]: o.id }));
                          void answerMutation.mutateAsync({
                            section: activeSection,
                            questionId: q.id,
                            selectedOptionId: o.id,
                          }).catch(() => {});
                        }}
                        className={clsx(
                          'w-full rounded-2xl border px-3 py-3 text-left text-sm transition',
                          selected
                            ? 'border-amber-300 bg-amber-50 text-slate-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-100',
                        )}
                      >
                        {o.optionText}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void submitSection()}
            disabled={submitting}
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? 'Yakunlanyapti…' : 'Bo‘limni yakunlash (Submit)'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

