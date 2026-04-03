import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Copy, QrCode, ScanLine } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi from '@/services/api';
import QRCode from 'qrcode';
import clsx from 'clsx';

export default function QrPage() {
  const { t } = useTranslation();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => mobileApi.me(),
  });

  const myId = meQuery.data?.id ?? '';

  const qrDataUrlQuery = useQuery({
    queryKey: ['my-qr', myId],
    enabled: !!myId,
    queryFn: async () => {
      return QRCode.toDataURL(myId, {
        margin: 1,
        width: 280,
        color: {
          dark: '#0f172a', // slate-900
          light: '#ffffff',
        },
      });
    },
  });

  const copy = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="px-4 py-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
          <QrCode className="h-5 w-5 text-slate-800 dark:text-slate-200" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {t({ uz: 'QR kod', en: 'QR code', ru: 'QR код' })}
        </h1>
      </div>
      <p className="mb-4 text-center text-xs text-slate-500 dark:text-slate-400">
        {t({
          uz: 'Imtihon uchun alohida: pastki menyu → «Imtihon».',
          en: 'For exams use the bottom tab «Exam».',
          ru: 'Для экзамена: вкладка «Экзамен».',
        })}
      </p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]"
      >
        <div className="mx-auto flex max-w-sm flex-col items-center">
          <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]">
            {qrDataUrlQuery.data ? (
              <img src={qrDataUrlQuery.data} alt="QR" className="h-56 w-56" />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center text-slate-400">
                <ScanLine className="h-7 w-7" />
              </div>
            )}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {t({ uz: 'User ID', en: 'User ID', ru: 'User ID' })}
          </p>
          <p className="mt-1 break-all text-center text-sm font-mono text-slate-800 dark:text-slate-200">
            {myId || '—'}
          </p>
          <button
            type="button"
            onClick={() => void copy(myId)}
            disabled={!myId}
            className={clsx(
              'mt-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition',
              myId
                ? 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-white dark:hover:bg-[var(--learn-card)]'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)] dark:text-slate-600',
            )}
          >
            <Copy className="h-4 w-4" />
            {t({ uz: 'Nusxa olish', en: 'Copy', ru: 'Копировать' })}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

