import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Award, Download, Share2 } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { resolveMediaUrl } from '@/services/api';
import {
  CertificateCard,
  CertificateCardBack,
  CertificateCardFront,
  formatCertificateDate,
} from '@/components/certificate/CertificateCard';
import {
  captureCertificatePng,
  saveCertificatePng,
  shareCertificatePng,
  toDataUrl,
} from '@/utils/certificate-image';

type Feedback = { tone: 'ok' | 'error'; text: string } | null;

const STATUS_LABEL = {
  VALID: { uz: 'Amalda', en: 'Valid', ru: 'Действует' },
  EXPIRED: { uz: 'Muddati o‘tgan', en: 'Expired', ru: 'Истёк' },
  REVOKED: { uz: 'Bekor qilingan', en: 'Revoked', ru: 'Аннулировано' },
} as const;

const STATUS_TONE = {
  VALID:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-[var(--learn-green)]',
  EXPIRED:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-[var(--learn-gold)]',
  REVOKED:
    'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-[var(--learn-red)]',
} as const;

export default function CertificatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const exportRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  const { data: certificates, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => mobileApi.getMyCertificates(),
  });

  const certificate = certificates?.[0] ?? null;
  const photoUrl = certificate?.avatarUrl
    ? resolveMediaUrl(certificate.avatarUrl)
    : null;

  // Rasmni oldindan data URL ga o'giramiz — aks holda PNG chizishda tashqi
  // domendagi surat canvas'ni "tainted" qilib, eksport uzilib qoladi.
  useEffect(() => {
    let cancelled = false;
    void toDataUrl(photoUrl).then((value) => {
      if (!cancelled) setPhotoDataUrl(value);
    });
    return () => {
      cancelled = true;
    };
  }, [photoUrl]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const runExport = async (mode: 'save' | 'share') => {
    const node = exportRef.current;
    if (!node || !certificate) return;

    setBusy(mode);
    try {
      const blob = await captureCertificatePng(node);
      const fileName = `guvohnoma-${certificate.certificateNumber}.png`;

      if (mode === 'save') {
        await saveCertificatePng(blob, fileName);
        setFeedback({
          tone: 'ok',
          text: t({
            uz: 'Guvohnoma rasm sifatida saqlandi',
            en: 'Certificate saved as an image',
            ru: 'Удостоверение сохранено как изображение',
          }),
        });
      } else {
        await shareCertificatePng(
          blob,
          fileName,
          t({
            uz: 'ENERGO ID guvohnomasi',
            en: 'ENERGO ID certificate',
            ru: 'Удостоверение ENERGO ID',
          }),
        );
      }
    } catch {
      setFeedback({
        tone: 'error',
        text: t({
          uz: 'Amalni bajarib bo‘lmadi. Qaytadan urinib ko‘ring.',
          en: 'Action failed. Please try again.',
          ru: 'Не удалось выполнить. Попробуйте ещё раз.',
        }),
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="px-4 py-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300"
      >
        <ArrowLeft className="h-4 w-4" />
        {t({ uz: 'Orqaga', en: 'Back', ru: 'Назад' })}
      </button>

      <h1 className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
        <Award className="h-5 w-5 text-amber-500 dark:text-[var(--learn-gold)]" />
        {t({
          uz: 'Mening guvohnomam',
          en: 'My certificate',
          ru: 'Моё удостоверение',
        })}
      </h1>

      {isLoading ? (
        <div className="h-52 animate-pulse rounded-3xl bg-slate-100 dark:bg-[var(--learn-card)]" />
      ) : !certificate ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {t({
              uz: 'Guvohnoma yuklanmadi',
              en: 'Certificate could not be loaded',
              ru: 'Не удалось загрузить удостоверение',
            })}
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t({
              uz: 'ENERGO ID maʼlumotini tekshiring yoki qaytadan kiring.',
              en: 'Check your ENERGO ID data or sign in again.',
              ru: 'Проверьте данные ENERGO ID или войдите снова.',
            })}
          </p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-[var(--learn-muted)]">
            {t({
              uz: 'Manba: ENERGO ID',
              en: 'Source: ENERGO ID',
              ru: 'Источник: ENERGO ID',
            })}
          </p>
          <CertificateCard
            certificate={certificate}
            avatarUrl={photoDataUrl ?? photoUrl}
          />

          <p className="mt-3 text-center text-xs text-slate-500 dark:text-[var(--learn-muted)]">
            {t({
              uz: 'ENERGO ID kartasi — avtomatik. Kartani bosib orqa tomonini koʻring',
              en: 'ENERGO ID card — automatic. Tap to flip',
              ru: 'Карта ENERGO ID — автоматически. Нажмите, чтобы перевернуть',
            })}
          </p>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                {certificate.certificateNumber}
              </span>
              <span
                className={clsx(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  STATUS_TONE[certificate.status],
                )}
              >
                {t(STATUS_LABEL[certificate.status])}
              </span>
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <Row
                label={t({ uz: 'Berilgan', en: 'Issued', ru: 'Выдано' })}
                value={formatCertificateDate(certificate.issuedAt)}
              />
              <Row
                label={t({
                  uz: 'Amal muddati',
                  en: 'Valid until',
                  ru: 'Действует до',
                })}
                value={formatCertificateDate(certificate.validUntil)}
              />
            </dl>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void runExport('save')}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-4 text-sm font-semibold text-slate-900 disabled:opacity-60 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)] dark:text-white"
            >
              <Download className="h-4 w-4" />
              {busy === 'save'
                ? t({ uz: 'Saqlanmoqda…', en: 'Saving…', ru: 'Сохранение…' })
                : t({ uz: 'PNG saqlash', en: 'Save PNG', ru: 'Сохранить PNG' })}
            </button>

            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void runExport('share')}
              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-from to-brand-to py-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Share2 className="h-4 w-4" />
              {busy === 'share'
                ? t({ uz: 'Tayyorlanmoqda…', en: 'Preparing…', ru: 'Подготовка…' })
                : t({ uz: 'Ulashish', en: 'Share', ru: 'Поделиться' })}
            </button>
          </div>

          {feedback && (
            <p
              className={clsx(
                'mt-3 rounded-2xl px-4 py-3 text-center text-sm font-medium',
                feedback.tone === 'ok'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-[var(--learn-green)]'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-[var(--learn-red)]',
              )}
            >
              {feedback.text}
            </p>
          )}

          {/*
            PNG uchun ekrandan tashqaridagi qatlam: ikkala tomon ham
            qat'iy 960px kenglikda chiziladi, shunda natija telefon
            ekrani o'lchamiga bog'liq bo'lmaydi.
          */}
          <div
            ref={exportRef}
            className="pointer-events-none fixed left-[-10000px] top-0 flex w-[960px] flex-col gap-8 bg-[#050a14] p-8"
            aria-hidden
          >
            <CertificateCardFront
              certificate={certificate}
              avatarUrl={photoDataUrl}
              variant="static"
            />
            <CertificateCardBack certificate={certificate} variant="static" />
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500 dark:text-[var(--learn-muted)]">{label}</dt>
      <dd className="m-0 font-semibold text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
