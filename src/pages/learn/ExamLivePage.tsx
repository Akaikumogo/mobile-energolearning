import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { io, type Socket } from 'socket.io-client';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Camera, ClipboardList, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, {
  getExamLiveSocketUrl,
  type ExamLiveQuestion,
  type ExamQuestionSection,
  type ExamSessionState,
} from '@/services/api';

type Phase =
  | 'scan'
  | 'waiting'
  | 'code'
  | 'choose'
  | 'exam'
  | 'section_done'
  | 'awaiting_oral'
  | 'cancelled';

function parseExamQrPayload(raw: string): string {
  const t = raw.trim();
  try {
    const j = JSON.parse(t) as { qrToken?: string; examQr?: string; token?: string };
    const inner = j.qrToken ?? j.examQr ?? j.token;
    return (inner ?? t).trim();
  } catch {
    return t;
  }
}

export default function ExamLivePage() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [phase, setPhase] = useState<Phase>('scan');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [includesPt, setIncludesPt] = useState(true);
  const [includesTb, setIncludesTb] = useState(true);
  const [examTitle, setExamTitle] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [wsHintCode, setWsHintCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanStarting, setScanStarting] = useState(false);

  const [activeSection, setActiveSection] = useState<ExamQuestionSection | null>(null);
  const [questions, setQuestions] = useState<ExamLiveQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [deadline, setDeadline] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [lastSubmitSummary, setLastSubmitSummary] = useState<{
    percent: number;
    passed: boolean;
    passThreshold: number;
    section: ExamQuestionSection;
  } | null>(null);

  const disconnectSocket = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const attachSocket = useCallback(
    (sid: string) => {
      disconnectSocket();
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const socket: Socket = io(`${getExamLiveSocketUrl()}/exam-live`, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('join_session', { sessionId: sid });
      });
      socket.on('code_issued', (p: { code?: string }) => {
        if (p?.code) setWsHintCode(p.code);
      });
      socket.on('moderator_rejected', (p: { reason?: string }) => {
        setPhase('cancelled');
        setError(p?.reason ?? 'Rad etildi');
        disconnectSocket();
      });
    },
    [disconnectSocket],
  );

  const applySessionState = useCallback(
    async (sid: string, st: ExamSessionState) => {
      setIncludesPt(st.includesPt);
      setIncludesTb(st.includesTb);
      if (st.status === 'CANCELLED') {
        setPhase('cancelled');
        setError(st.rejectionReason ?? 'Bekor qilindi');
        disconnectSocket();
        return;
      }
      if (st.status === 'COMPLETED') {
        setPhase('awaiting_oral');
        disconnectSocket();
        return;
      }
      if (st.status === 'WAITING_MODERATOR') {
        setPhase('waiting');
        return;
      }
      if (st.status === 'CODE_PENDING') {
        setPhase('code');
        return;
      }
      if (st.status === 'AWAITING_ORAL') {
        setPhase('awaiting_oral');
        disconnectSocket();
        return;
      }
      if (st.status === 'IN_PROGRESS') {
        if (!st.attemptId) {
          setPhase('code');
          return;
        }
        const needPt = st.includesPt && !st.ptCompleted;
        const needTb = st.includesTb && !st.tbCompleted;
        if (needPt && needTb) {
          setPhase('choose');
          return;
        }
        if (needPt) {
          setBusy(true);
          try {
            const pack = await mobileApi.startExamSection(sid, 'PT');
            setActiveSection(pack.section);
            setQuestions(pack.questions);
            setQIndex(0);
            setSelections({});
            setDeadline(Date.now() + pack.durationMinutes * 60_000);
            setPhase('exam');
          } catch (e) {
            setError(String(e));
          } finally {
            setBusy(false);
          }
          return;
        }
        if (needTb) {
          setBusy(true);
          try {
            const pack = await mobileApi.startExamSection(sid, 'TB');
            setActiveSection(pack.section);
            setQuestions(pack.questions);
            setQIndex(0);
            setSelections({});
            setDeadline(Date.now() + pack.durationMinutes * 60_000);
            setPhase('exam');
          } catch (e) {
            setError(String(e));
          } finally {
            setBusy(false);
          }
        }
      }
    },
    [disconnectSocket],
  );

  const refreshState = useCallback(
    async (sid: string) => {
      try {
        const st = await mobileApi.getExamSessionState(sid);
        await applySessionState(sid, st);
      } catch (e) {
        setError(String(e));
      }
    },
    [applySessionState],
  );

  const startWithToken = useCallback(
    async (rawToken: string) => {
      const qrToken = parseExamQrPayload(rawToken);
      if (!qrToken) return;
      setError(null);
      setBusy(true);
      try {
        const res = await mobileApi.validateExamQr(qrToken);
        setSessionId(res.sessionId);
        setExamTitle(res.examTitle);
        setIncludesPt(res.includesPt);
        setIncludesTb(res.includesTb);
        attachSocket(res.sessionId);
        await refreshState(res.sessionId);
      } catch (e) {
        setError(String(e));
      } finally {
        setBusy(false);
      }
    },
    [attachSocket, refreshState],
  );

  useEffect(() => {
    let stopped = false;
    let stopFn: (() => void) | null = null;

    const run = async () => {
      if (phase !== 'scan') return;
      setScanStarting(true);
      try {
        const reader = new BrowserMultiFormatReader();
        const videoEl = videoRef.current;
        if (!videoEl) throw new Error('video');
        const controls = await reader.decodeFromConstraints(
          { audio: false, video: { facingMode: 'environment' } },
          videoEl,
          (res) => {
            if (stopped) return;
            const text = res?.getText()?.trim();
            if (!text) return;
            controls.stop();
            stopFn = () => controls.stop();
            void startWithToken(text);
          },
        );
        stopFn = () => controls.stop();
      } catch {
        /* kamera yo‘q — qo‘lda token */
      } finally {
        if (!stopped) setScanStarting(false);
      }
    };

    void run();
    return () => {
      stopped = true;
      try {
        stopFn?.();
      } catch {
        /* ignore */
      }
    };
  }, [phase, startWithToken]);

  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'code') return;
    if (!sessionId) return;
    const id = window.setInterval(() => {
      void refreshState(sessionId);
    }, 4000);
    return () => window.clearInterval(id);
  }, [phase, sessionId, refreshState]);

  useEffect(() => {
    if (phase !== 'exam' || !sessionId) return;
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        void mobileApi.recordExamTabSwitch(sessionId).then((r) => {
          if (r.cancelled) {
            setPhase('cancelled');
            setError("5 marta boshqa ilovaga o'tildi — imtihon bekor qilindi.");
            disconnectSocket();
          }
        });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [phase, sessionId, disconnectSocket]);

  useEffect(() => {
    if (phase !== 'exam' || !deadline) return;
    const tmr = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(tmr);
  }, [phase, deadline]);

  useEffect(() => () => disconnectSocket(), [disconnectSocket]);

  const verifyCode = async () => {
    if (!sessionId || !codeInput.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await mobileApi.verifyExamCode(sessionId, codeInput.trim().toUpperCase());
      await refreshState(sessionId);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const pickSection = async (section: ExamQuestionSection) => {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    try {
      const pack = await mobileApi.startExamSection(sessionId, section);
      setActiveSection(pack.section);
      setQuestions(pack.questions);
      setQIndex(0);
      setSelections({});
      setDeadline(Date.now() + pack.durationMinutes * 60_000);
      setPhase('exam');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const scheduleSave = (qid: string, optId: string) => {
    if (!sessionId || !activeSection) return;
    const key = qid;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => {
      void mobileApi.saveExamAnswer(sessionId, activeSection, qid, optId).catch(() => {
        /* tarmoq */
      });
    }, 400);
  };

  const onSelectOption = (qid: string, optId: string) => {
    setSelections((s) => ({ ...s, [qid]: optId }));
    scheduleSave(qid, optId);
  };

  const submitCurrentSection = async () => {
    if (!sessionId || !activeSection) return;
    setBusy(true);
    setError(null);
    try {
      const res = await mobileApi.submitExamSection(sessionId, activeSection);
      setLastSubmitSummary({
        percent: res.percent,
        passed: res.passed,
        passThreshold: res.passThreshold,
        section: activeSection,
      });
      if (res.awaitingOral) {
        setPhase('awaiting_oral');
        disconnectSocket();
        return;
      }
      setPhase('section_done');
      await refreshState(sessionId);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const continueAfterSection = async () => {
    if (!sessionId) return;
    setLastSubmitSummary(null);
    setPhase('choose');
    await refreshState(sessionId);
  };

  const resetFlow = () => {
    disconnectSocket();
    setPhase('scan');
    setSessionId(null);
    setCodeInput('');
    setManualToken('');
    setWsHintCode('');
    setError(null);
    setQuestions([]);
    setQIndex(0);
    setSelections({});
    setDeadline(null);
    setLastSubmitSummary(null);
  };

  const currentQ = questions[qIndex];
  const secondsLeft =
    deadline != null ? Math.max(0, Math.floor((deadline - nowTick) / 1000)) : null;

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
          <ClipboardList className="h-5 w-5 text-slate-800 dark:text-slate-200" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {t({ uz: 'Imtihon', en: 'Exam', ru: 'Экзамен' })}
        </h1>
      </div>

      {examTitle ? (
        <p className="mb-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">
          {examTitle}
        </p>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-[var(--learn-red)] dark:bg-rose-950/40 dark:text-rose-200">
          {error}
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]"
      >
        {phase === 'scan' && (
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              {t({
                uz: 'Imtihon QR kodini skanerlang yoki tokenni qo‘lda kiriting.',
                en: 'Scan the exam QR or paste the token.',
                ru: 'Отсканируйте QR экзамена или вставьте токен.',
              })}
            </p>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black/90 dark:border-[var(--learn-border)]">
              <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
              {scanStarting ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Camera className="h-4 w-4" />
              {t({ uz: 'Kamera', en: 'Camera', ru: 'Камера' })}
            </div>
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="QR token"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-white"
            />
            <button
              type="button"
              disabled={busy || !manualToken.trim()}
              onClick={() => void startWithToken(manualToken)}
              className={clsx(
                'w-full rounded-2xl py-3 text-sm font-bold text-white',
                manualToken.trim()
                  ? 'bg-blue-600 dark:bg-[var(--learn-blue)]'
                  : 'cursor-not-allowed bg-slate-300 dark:bg-slate-700',
              )}
            >
              {busy ? '…' : t({ uz: 'Davom etish', en: 'Continue', ru: 'Продолжить' })}
            </button>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-600 dark:text-[var(--learn-gold)]" />
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {t({
                uz: 'Moderator tasdigini kuting…',
                en: 'Waiting for moderator…',
                ru: 'Ожидание модератора…',
              })}
            </p>
            <button
              type="button"
              onClick={resetFlow}
              className="text-sm text-blue-600 dark:text-[var(--learn-blue)]"
            >
              {t({ uz: 'Orqaga', en: 'Back', ru: 'Назад' })}
            </button>
          </div>
        )}

        {phase === 'code' && (
          <div className="space-y-4">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              {t({
                uz: 'Moderator bergan 10 belgili kodni kiriting.',
                en: 'Enter the 10-character code from the moderator.',
                ru: 'Введите 10-значный код.',
              })}
            </p>
            {wsHintCode ? (
              <p className="text-center font-mono text-lg font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
                {wsHintCode}
              </p>
            ) : null}
            <input
              type="text"
              autoCapitalize="characters"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center font-mono text-lg tracking-widest dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-white"
              placeholder="__________"
            />
            <button
              type="button"
              disabled={busy || codeInput.trim().length < 4}
              onClick={() => void verifyCode()}
              className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white dark:bg-[var(--learn-blue)]"
            >
              {t({ uz: 'Tasdiqlash', en: 'Verify', ru: 'Проверить' })}
            </button>
            <button type="button" onClick={resetFlow} className="w-full text-sm text-slate-500">
              {t({ uz: 'Bekor qilish', en: 'Cancel', ru: 'Отмена' })}
            </button>
          </div>
        )}

        {phase === 'choose' && (
          <div className="space-y-3">
            <p className="text-center text-sm font-semibold text-slate-800 dark:text-white">
              {t({ uz: 'Bo‘limni tanlang', en: 'Choose section', ru: 'Выберите раздел' })}
            </p>
            <div className="grid gap-3">
              {includesPt ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void pickSection('PT')}
                  className="rounded-2xl border-2 border-blue-200 bg-blue-50 py-4 text-base font-bold text-blue-900 dark:border-[var(--learn-blue)] dark:bg-[#1a2d4d] dark:text-white"
                >
                  PT
                </button>
              ) : null}
              {includesTb ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void pickSection('TB')}
                  className="rounded-2xl border-2 border-amber-200 bg-amber-50 py-4 text-base font-bold text-amber-900 dark:border-[var(--learn-gold)] dark:bg-[#3d3510] dark:text-[var(--learn-gold)]"
                >
                  TB
                </button>
              ) : null}
            </div>
          </div>
        )}

        {phase === 'exam' && currentQ && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>
                {activeSection} · {qIndex + 1}/{questions.length}
              </span>
              {secondsLeft != null ? (
                <span className="tabular-nums text-amber-700 dark:text-[var(--learn-gold)]">
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </span>
              ) : null}
            </div>
            <p className="text-base font-semibold leading-snug text-slate-900 dark:text-white">
              {currentQ.prompt}
            </p>
            <div className="space-y-2">
              {currentQ.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelectOption(currentQ.id, o.id)}
                  className={clsx(
                    'w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition',
                    selections[currentQ.id] === o.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900 dark:border-[var(--learn-blue)] dark:bg-[#1e3a5f] dark:text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-800 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-slate-200',
                  )}
                >
                  {o.optionText}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={qIndex === 0}
                onClick={() => setQIndex((i) => Math.max(0, i - 1))}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold dark:border-[var(--learn-border)]"
              >
                ←
              </button>
              {qIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setQIndex((i) => i + 1)}
                  className="flex-1 rounded-2xl bg-slate-800 py-3 text-sm font-semibold text-white dark:bg-[var(--learn-surface)]"
                >
                  →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submitCurrentSection()}
                  className="flex-1 rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white"
                >
                  {t({ uz: 'Yakunlash', en: 'Submit', ru: 'Сдать' })}
                </button>
              )}
            </div>
          </div>
        )}

        {phase === 'section_done' && lastSubmitSummary && (
          <div className="space-y-4 text-center">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {lastSubmitSummary.section} — {lastSubmitSummary.percent}%
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {lastSubmitSummary.passed
                ? t({ uz: 'O‘tdingiz', en: 'Passed', ru: 'Сдано' })
                : t({
                    uz: `Chegara: ${lastSubmitSummary.passThreshold}%`,
                    en: `Threshold: ${lastSubmitSummary.passThreshold}%`,
                    ru: `Порог: ${lastSubmitSummary.passThreshold}%`,
                  })}
            </p>
            <button
              type="button"
              onClick={() => void continueAfterSection()}
              className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white dark:bg-[var(--learn-blue)]"
            >
              {t({ uz: 'Keyingi bosqich', en: 'Next', ru: 'Далее' })}
            </button>
          </div>
        )}

        {phase === 'awaiting_oral' && (
          <div className="space-y-3 text-center">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              {t({
                uz: 'Testlar tugadi. Og‘zaki baho uchun moderatorka boring.',
                en: 'Tests done. See the moderator for oral grading.',
                ru: 'Тесты завершены. Устная оценка у модератора.',
              })}
            </p>
            <button
              type="button"
              onClick={resetFlow}
              className="w-full rounded-2xl border border-slate-200 py-3 text-sm font-semibold dark:border-[var(--learn-border)]"
            >
              OK
            </button>
          </div>
        )}

        {phase === 'cancelled' && (
          <div className="space-y-3 text-center">
            <p className="text-sm text-rose-700 dark:text-[var(--learn-red)]">{error}</p>
            <button
              type="button"
              onClick={resetFlow}
              className="w-full rounded-2xl bg-slate-800 py-3 text-sm font-bold text-white"
            >
              {t({ uz: 'Qayta', en: 'Again', ru: 'Снова' })}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
