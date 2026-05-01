import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BrowserMultiFormatReader } from '@zxing/browser';
import clsx from 'clsx';
import {
  Camera,
  ChevronRight,
  ClipboardList,
  LoaderCircle,
  ScanLine,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';

export default function QrPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [qrToken, setQrToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);

  const nextExamQuery = useQuery({
    queryKey: ['exam-live-my-next'],
    queryFn: () => mobileApi.examLiveMyNext(),
  });

  const historyQuery = useQuery({
    queryKey: ['exam-live-my-history'],
    queryFn: () => mobileApi.examLiveMyHistory(),
  });

  const validateMutation = useMutation({
    mutationFn: (token: string) => mobileApi.examLiveValidateQr(token),
    onSuccess: (data) => {
      navigate(`/learn/exam-live/${data.sessionId}`);
    },
  });

  const canValidate = useMemo(() => qrToken.trim().length > 0, [qrToken]);

  useEffect(() => {
    if (!scanning) return;
    if (!videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    let stopped = false;

    void reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (stopped) return;
        const text = result?.getText?.() ?? '';
        if (!text) return;
        stopped = true;
        setQrToken(text);
        setScanning(false);
      })
      .then((controls) => {
        scannerControlsRef.current = controls;
      })
      .catch(() => {
        setScanning(false);
      });

    return () => {
      stopped = true;
      try {
        scannerControlsRef.current?.stop();
      } catch {}
      scannerControlsRef.current = null;
      readerRef.current = null;
    };
  }, [scanning]);

  return (
    <div className="px-safe-4 py-6 space-y-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
          <ClipboardList className="h-5 w-5 text-slate-800 dark:text-slate-200" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {t({ uz: 'Imtihon', en: 'Exam', ru: 'Экзамен' })}
        </h1>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {t({ uz: 'Keyingi imtihon', en: 'Next exam', ru: 'Следующий экзамен' })}
        </p>
        {nextExamQuery.isLoading ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {t({ uz: 'Yuklanmoqda…', en: 'Loading…', ru: 'Загрузка…' })}
          </div>
        ) : nextExamQuery.data?.next ? (
          <div className="mt-3 text-sm text-slate-700 dark:text-slate-200 space-y-1">
            <p>
              {t({ uz: 'Kun qoldi', en: 'Days left', ru: 'Осталось дней' })}:{' '}
              <span className="font-semibold">{nextExamQuery.data.next.daysLeft}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              suggestedAt: {nextExamQuery.data.next.suggestedAt}
            </p>
            {nextExamQuery.data.next.scheduledAt ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                scheduledAt: {nextExamQuery.data.next.scheduledAt}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {t({ uz: 'Hozircha imtihon yo‘q', en: 'No upcoming exam', ru: 'Нет экзамена' })}
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {t({ uz: 'Imtihon QR token', en: 'Exam QR token', ru: 'QR токен' })}
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t({
            uz: 'Moderator bergan QR ni skanerlang yoki tokenni qo‘lda kiriting.',
            en: 'Scan the QR from moderator or enter token manually.',
            ru: 'Сканируйте QR или введите токен вручную.',
          })}
        </p>

        <div className="mt-3 flex gap-2">
          <input
            value={qrToken}
            onChange={(e) => setQrToken(e.target.value)}
            placeholder="qrToken…"
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-white"
          />
          <button
            type="button"
            onClick={() => setScanning(true)}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-white"
            title="Scan"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => validateMutation.mutate(qrToken.trim())}
          disabled={!canValidate || validateMutation.isPending}
          className={clsx(
            'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white',
            !canValidate || validateMutation.isPending
              ? 'bg-slate-300 dark:bg-slate-700'
              : 'bg-amber-500 hover:bg-amber-600',
          )}
        >
          {validateMutation.isPending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {t({ uz: 'Tekshirilmoqda…', en: 'Validating…', ru: 'Проверка…' })}
            </>
          ) : (
            <>
              <ScanLine className="h-4 w-4" />
              {t({ uz: 'Boshlash (Validate QR)', en: 'Start', ru: 'Начать' })}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </button>

        {validateMutation.isError ? (
          <p className="mt-2 text-sm text-rose-600">
            {t({ uz: 'Token noto‘g‘ri yoki muddati tugagan', en: 'Invalid token', ru: 'Неверный токен' })}
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {t({ uz: 'Tarix', en: 'History', ru: 'История' })}
        </p>
        {historyQuery.isLoading ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {t({ uz: 'Yuklanmoqda…', en: 'Loading…', ru: 'Загрузка…' })}
          </div>
        ) : (historyQuery.data?.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {t({ uz: 'Hali imtihon topshirilmagan', en: 'No attempts yet', ru: 'Попыток нет' })}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {historyQuery.data?.slice(0, 8).map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]"
              >
                <p className="font-semibold text-slate-900 dark:text-white">
                  {row.examTitle ?? 'Exam'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {row.createdAt}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {scanning ? (
        <div className="fixed inset-0 z-50 bg-black/80 px-safe-4 pt-safe-14 pb-safe flex flex-col">
          <div className="mx-auto w-full max-w-md text-white">
            <p className="text-sm font-semibold">QR scan</p>
            <p className="mt-1 text-xs text-white/70">
              Kameraga QR ni yaqinlashtiring. Ruxsat so‘rasa “Allow” bering.
            </p>
          </div>
          <div className="mx-auto mt-4 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black">
            <video ref={videoRef} className="h-80 w-full object-cover" />
          </div>
          <button
            type="button"
            onClick={() => setScanning(false)}
            className="mx-auto mt-4 w-full max-w-md rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
          >
            Yopish
          </button>
        </div>
      ) : null}
    </div>
  );
}
