import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrowserMultiFormatReader } from '@zxing/browser';
import clsx from 'clsx';
import {
  Camera,
  CheckCircle2,
  LoaderCircle,
  QrCode,
  ScanLine,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { resolveMediaUrl, type PublicIdCard } from '@/services/api';
import { CertificateQr } from '@/components/certificate/CertificateQr';
import {
  CertificateCard,
  formatCertificateDate,
} from '@/components/certificate/CertificateCard';
import type { EmployeeCertificate } from '@/components/certificate/types';

type Tab = 'my-qr' | 'scan';

/** QR matnidan ENERGO / ElektroLearn id ni ajratib oladi. */
export function extractIdFromQrPayload(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    const parts = url.pathname.split('/').filter(Boolean);
    const publicIdx = parts.findIndex((p) => p === 'public');
    if (publicIdx >= 0 && parts[publicIdx + 1]) {
      // /public/:id yoki /public/id-card/:id
      if (parts[publicIdx + 1] === 'id-card' && parts[publicIdx + 2]) {
        return decodeURIComponent(parts[publicIdx + 2]);
      }
      return decodeURIComponent(parts[publicIdx + 1]);
    }
    const idCardIdx = parts.findIndex((p) => p === 'id-card');
    if (idCardIdx >= 0 && parts[idCardIdx + 1]) {
      return decodeURIComponent(parts[idCardIdx + 1]);
    }
  } catch {
    // not a URL
  }

  // Sof UUID
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      text,
    )
  ) {
    return text;
  }

  return null;
}

function toCertificate(card: PublicIdCard): EmployeeCertificate {
  return {
    id: `scanned-${card.certificateNumber}`,
    certificateNumber: card.certificateNumber,
    userId: '',
    organizationId: '',
    organizationTitle: card.organizationTitle,
    branchName: card.branchName,
    fullName: card.fullName,
    lastName: card.lastName ?? '',
    firstName: card.firstName ?? '',
    middleName: card.middleName ?? '',
    positionTitle: card.positionTitle,
    personnelNumber: card.personnelNumber,
    examAttemptId: null,
    issuedAt: card.issuedAt,
    validUntil: card.validUntil,
    revokedAt: null,
    revokeReason: null,
    status: card.status,
    verifyUrl: card.verifyUrl ?? '',
    avatarUrl: card.avatarUrl,
  };
}

export default function IdCardQrPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('my-qr');
  const [scanning, setScanning] = useState(false);
  const [lookupId, setLookupId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);

  const myCertQuery = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => mobileApi.getMyCertificates(),
  });
  const myCard = myCertQuery.data?.[0] ?? null;

  const scannedQuery = useQuery({
    queryKey: ['public-id-card', lookupId],
    queryFn: () => mobileApi.getPublicIdCard(lookupId!),
    enabled: Boolean(lookupId),
    retry: false,
  });

  const qrValue = useMemo(() => {
    if (!myCard) return '';
    // QR ichida energo public URL — skaner /public/{id} ni o‘qiydi
    return myCard.verifyUrl || myCard.certificateNumber;
  }, [myCard]);

  useEffect(() => {
    if (!scanning) return;
    if (!videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    let stopped = false;

    void reader
      .decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (stopped) return;
        const text = result?.getText?.() ?? '';
        if (!text) return;
        const id = extractIdFromQrPayload(text);
        if (!id) {
          setScanError(
            t({
              uz: 'Bu QR guvohnoma emas',
              en: 'This QR is not an ID card',
              ru: 'Этот QR не удостоверение',
            }),
          );
          return;
        }
        stopped = true;
        setScanError(null);
        setLookupId(id);
        setScanning(false);
        setTab('scan');
      })
      .then((controls) => {
        scannerControlsRef.current = controls;
      })
      .catch(() => {
        setScanning(false);
        setScanError(
          t({
            uz: 'Kameraga ruxsat berilmadi',
            en: 'Camera permission denied',
            ru: 'Нет доступа к камере',
          }),
        );
      });

    return () => {
      stopped = true;
      try {
        scannerControlsRef.current?.stop();
      } catch {
        /* ignore */
      }
      scannerControlsRef.current = null;
    };
  }, [scanning, t]);

  const scannedCard = scannedQuery.data?.found
    ? toCertificate(scannedQuery.data)
    : null;

  return (
    <div className="px-4 py-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
          <QrCode className="h-5 w-5 text-amber-600 dark:text-[var(--learn-gold)]" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            {t({ uz: 'Guvohnoma QR', en: 'ID QR', ru: 'QR удостоверения' })}
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-[var(--learn-muted)]">
            {t({
              uz: 'O‘zingiznikini ko‘rsating yoki boshqasini skanerlang',
              en: 'Show yours or scan another employee',
              ru: 'Покажите своё или отсканируйте чужое',
            })}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 dark:border-[var(--learn-border)] dark:bg-[var(--learn-surface)]">
        <button
          type="button"
          onClick={() => setTab('my-qr')}
          className={clsx(
            'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition',
            tab === 'my-qr'
              ? 'bg-white text-amber-700 shadow-sm dark:bg-[var(--learn-card)] dark:text-[var(--learn-gold)]'
              : 'text-slate-500 dark:text-[var(--learn-muted)]',
          )}
        >
          <QrCode className="h-4 w-4" />
          {t({ uz: 'Mening QR', en: 'My QR', ru: 'Мой QR' })}
        </button>
        <button
          type="button"
          onClick={() => setTab('scan')}
          className={clsx(
            'inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition',
            tab === 'scan'
              ? 'bg-white text-amber-700 shadow-sm dark:bg-[var(--learn-card)] dark:text-[var(--learn-gold)]'
              : 'text-slate-500 dark:text-[var(--learn-muted)]',
          )}
        >
          <ScanLine className="h-4 w-4" />
          {t({ uz: 'Skaner', en: 'Scanner', ru: 'Сканер' })}
        </button>
      </div>

      {tab === 'my-qr' ? (
        <div className="space-y-4">
          {myCertQuery.isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
              <LoaderCircle className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          ) : !myCard ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t({
                  uz: 'Guvohnoma yuklanmadi',
                  en: 'Certificate not loaded',
                  ru: 'Удостоверение не загружено',
                })}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
                <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[var(--learn-muted)]">
                  {t({
                    uz: 'Tekshirish uchun QR',
                    en: 'QR for verification',
                    ru: 'QR для проверки',
                  })}
                </p>
                <div className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-inner dark:border-[var(--learn-border)]">
                  <CertificateQr value={qrValue} />
                </div>
                <p className="mt-3 text-center font-mono text-sm font-bold text-slate-900 dark:text-white">
                  {myCard.certificateNumber}
                </p>
                <p className="mt-1 text-center text-xs text-slate-500 dark:text-[var(--learn-muted)]">
                  {myCard.fullName}
                </p>
              </div>

              <CertificateCard
                certificate={myCard}
                avatarUrl={
                  myCard.avatarUrl ? resolveMediaUrl(myCard.avatarUrl) : null
                }
              />
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {t({
                uz: 'Boshqa xodim guvohnomasini skanerlang',
                en: 'Scan another employee’s ID',
                ru: 'Отсканируйте удостоверение сотрудника',
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-[var(--learn-muted)]">
              {t({
                uz: 'Haqiqiyligini tekshirish uchun kamerani QR ga yo‘naltiring',
                en: 'Point the camera at their QR to verify',
                ru: 'Наведите камеру на QR для проверки',
              })}
            </p>
            <button
              type="button"
              onClick={() => {
                setScanError(null);
                setScanning(true);
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-from to-brand-to py-3.5 text-sm font-semibold text-white"
            >
              <Camera className="h-5 w-5" />
              {t({ uz: 'Skanerlashni boshlash', en: 'Start scanning', ru: 'Начать сканирование' })}
            </button>
            {scanError ? (
              <p className="mt-3 text-center text-sm text-rose-600">{scanError}</p>
            ) : null}
          </div>

          {lookupId ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-[var(--learn-border)] dark:bg-[var(--learn-card)]">
              {scannedQuery.isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  {t({ uz: 'Tekshirilmoqda…', en: 'Verifying…', ru: 'Проверка…' })}
                </div>
              ) : scannedQuery.isError || !scannedCard ? (
                <div className="py-6 text-center">
                  <p className="text-sm font-semibold text-rose-600">
                    {t({
                      uz: 'Guvohnoma topilmadi yoki yaroqsiz',
                      en: 'Certificate not found or invalid',
                      ru: 'Удостоверение не найдено',
                    })}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-[var(--learn-green)]">
                    <ShieldCheck className="h-5 w-5" />
                    {t({
                      uz: 'Haqiqiy ENERGO ID guvohnomasi',
                      en: 'Valid ENERGO ID certificate',
                      ru: 'Действительное удостоверение ENERGO ID',
                    })}
                    <CheckCircle2 className="ml-auto h-4 w-4" />
                  </div>

                  <CertificateCard
                    certificate={scannedCard}
                    avatarUrl={
                      scannedCard.avatarUrl
                        ? resolveMediaUrl(scannedCard.avatarUrl)
                        : null
                    }
                  />

                  <dl className="space-y-2 text-sm">
                    <Info
                      label={t({ uz: 'F.I.Sh.', en: 'Full name', ru: 'ФИО' })}
                      value={scannedCard.fullName}
                    />
                    <Info
                      label={t({ uz: 'Lavozim', en: 'Position', ru: 'Должность' })}
                      value={scannedCard.positionTitle || '—'}
                    />
                    <Info
                      label={t({ uz: 'Filial', en: 'Branch', ru: 'Филиал' })}
                      value={scannedCard.branchName || '—'}
                    />
                    <Info
                      label={t({ uz: 'Raqam', en: 'Number', ru: 'Номер' })}
                      value={scannedCard.certificateNumber}
                    />
                    <Info
                      label={t({
                        uz: 'Amal muddati',
                        en: 'Valid until',
                        ru: 'Действует до',
                      })}
                      value={formatCertificateDate(scannedCard.validUntil)}
                    />
                  </dl>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {scanning ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="mx-auto flex w-full max-w-md items-start justify-between text-white">
            <div>
              <p className="text-sm font-semibold">
                {t({ uz: 'QR skaner', en: 'QR scanner', ru: 'QR сканер' })}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {t({
                  uz: 'Kameraga guvohnoma QR ini yaqinlashtiring',
                  en: 'Point the camera at the ID QR',
                  ru: 'Наведите камеру на QR удостоверения',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setScanning(false)}
              className="rounded-full bg-white/10 p-2"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="relative mx-auto mt-4 w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-black">
            <video ref={videoRef} className="h-80 w-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-amber-400/80" />
          </div>
          <button
            type="button"
            onClick={() => setScanning(false)}
            className="mx-auto mt-4 w-full max-w-md rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
          >
            {t({ uz: 'Yopish', en: 'Close', ru: 'Закрыть' })}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 pb-2 dark:border-[var(--learn-border)]">
      <dt className="text-slate-500 dark:text-[var(--learn-muted)]">{label}</dt>
      <dd className="m-0 text-right font-semibold text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}
