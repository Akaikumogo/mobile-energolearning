import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { resolveMediaUrl } from '@/services/api';
import { CardBackdropV1, V1_FACE_STYLE } from './CardBackdropV1';
import { CertificateQr } from './CertificateQr';
import { CertificateRibbons } from './CertificateRibbons';
import { tierFaceStyle } from './certificate-theme';
import { formatV1BranchLabel, SHORT_ORG_TITLE } from './org-title';
import {
  isGoldTier,
  resolvePositionTier,
  type PositionTier,
} from './position-tier';
import type { EmployeeCertificate } from './types';
import { UmetSeal } from './UmetSeal';
import {
  ID_CARD_ASPECT_CLASS,
  ID_CARD_EXPORT_STATIC_CLASS,
  ID_CARD_MOBILE_SCENE_CLASS,
  ID_CARD_PHOTO_CLASS,
  ID_CARD_QR_BOX_CLASS,
  ID_CARD_SIZE_LABEL,
} from './id-card-dimensions';
import { useTranslation } from '@/hooks/useTranslation';

export type CertificateCardDesign = 'v1' | 'v2';

const ORG_LINE = `"O'zbekiston milliy elektr tarmoqlari" AJ`;
const CERT_TITLE_V1 = 'Xodimning bilim sinovi guvohnomasi';

function cardTitle(certificate: EmployeeCertificate) {
  return formatV1BranchLabel(certificate.branchName) || SHORT_ORG_TITLE;
}

function branchLine(certificate: EmployeeCertificate) {
  return formatV1BranchLabel(certificate.branchName);
}

type FaceVariant = 'flip' | 'static';

export function formatCertificateDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${date.getFullYear()}`;
}

interface CertificateCardProps {
  certificate: EmployeeCertificate;
  avatarUrl?: string | null;
  design?: CertificateCardDesign;
  className?: string;
}

export function CertificateCard({
  certificate,
  avatarUrl,
  design = 'v1',
  className,
}: CertificateCardProps) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  const photo = avatarUrl ?? certificate.avatarUrl;

  return (
    <div className={clsx('flex flex-col items-center gap-1.5', className)}>
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        aria-pressed={flipped}
        aria-label={`${certificate.fullName} — guvohnoma`}
        className={clsx(
          'relative block border-0 bg-transparent p-0 [perspective:1400px]',
          'drop-shadow-[0_12px_28px_rgba(0,0,0,0.4)]',
          ID_CARD_MOBILE_SCENE_CLASS,
          ID_CARD_ASPECT_CLASS,
        )}
      >
        <div
          className={clsx(
            'absolute inset-0 [transform-style:preserve-3d] transition-transform duration-700 ease-[cubic-bezier(0.4,0.15,0.2,1)] will-change-transform',
            flipped && '[transform:rotateY(180deg)]',
          )}
        >
          <CertificateCardFront
            certificate={certificate}
            avatarUrl={photo}
            design={design}
          />
          <CertificateCardBack certificate={certificate} design={design} />
        </div>
      </button>

      <p className="m-0 text-center text-[10px] font-medium text-slate-500 dark:text-[var(--learn-muted)]">
        {t(ID_CARD_SIZE_LABEL)}
      </p>
    </div>
  );
}

const FACE_BASE =
  'overflow-hidden border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.2)] [container-type:inline-size]';

const FLIP_FACE =
  'absolute inset-0 [backface-visibility:hidden] [transform-style:preserve-3d] rounded-2xl';

const STATIC_FACE = ID_CARD_EXPORT_STATIC_CLASS;

const FACE_INNER =
  'absolute inset-0 flex flex-col px-[3.4cqw] pt-[3cqw] pb-[2.8cqw]';

const FACE_INNER_V1 =
  'absolute inset-0 flex flex-col px-[3.2cqw] pt-[2.4cqw] pb-[2.4cqw]';

function faceSideClass(variant: FaceVariant, side: 'front' | 'back') {
  if (variant === 'static') return STATIC_FACE;
  return clsx(
    FLIP_FACE,
    side === 'front'
      ? '[transform:rotateY(0deg)_translateZ(1px)] z-[2]'
      : '[transform:rotateY(180deg)_translateZ(1px)] z-[1]',
  );
}

type FaceProps = {
  certificate: EmployeeCertificate;
  avatarUrl?: string | null;
  variant?: FaceVariant;
  design?: CertificateCardDesign;
};

export function CertificateCardFront({
  certificate,
  avatarUrl,
  variant = 'flip',
  design = 'v1',
}: FaceProps) {
  if (design === 'v1') {
    return (
      <CertificateCardFrontV1
        certificate={certificate}
        avatarUrl={avatarUrl}
        variant={variant}
      />
    );
  }
  return (
    <CertificateCardFrontV2
      certificate={certificate}
      avatarUrl={avatarUrl}
      variant={variant}
    />
  );
}

export function CertificateCardBack({
  certificate,
  variant = 'flip',
  design = 'v1',
}: Omit<FaceProps, 'avatarUrl'>) {
  if (design === 'v1') {
    return <CertificateCardBackV1 certificate={certificate} variant={variant} />;
  }
  return <CertificateCardBackV2 certificate={certificate} variant={variant} />;
}

function CertificateCardFrontV1({
  certificate,
  avatarUrl,
  variant = 'flip',
}: {
  certificate: EmployeeCertificate;
  avatarUrl?: string | null;
  variant?: FaceVariant;
}) {
  return (
    <div
      className={clsx(FACE_BASE, faceSideClass(variant, 'front'), 'border-[#061018]')}
      style={V1_FACE_STYLE}
    >
      <CardBackdropV1 />

      <div
        className="absolute top-[1.4cqw] left-1/2 z-[3] h-[1.6cqw] w-[9.5cqw] -translate-x-1/2 rounded-full bg-white/95 shadow-[0_0_0_0.35cqw_rgba(0,0,0,0.35)]"
        aria-hidden
      />

      <div className="absolute top-[2.6cqw] right-[2.8cqw] z-[3] h-[11cqw] w-[11cqw] overflow-hidden rounded-full">
        <img
          src="/umet-logo.jpg"
          alt=""
          className="h-full w-full scale-[1.28] object-cover"
          draggable={false}
        />
      </div>

      <StatusStamp status={certificate.status} />

      <div className={FACE_INNER_V1}>
        <header className="relative z-[2] shrink-0 pr-[12cqw] pt-[2.2cqw] text-center">
          <p className="m-0 text-[2.55cqw] font-bold leading-tight tracking-tight text-white">
            {ORG_LINE}
          </p>
          {(() => {
            const branch = branchLine(certificate);
            return branch ? (
              <p className="m-0 mt-[0.5cqw] text-[2.15cqw] font-medium leading-tight text-white/90">
                {branch}
              </p>
            ) : null;
          })()}
          <p className="m-0 mt-[0.7cqw] text-[3.05cqw] font-extrabold leading-tight text-[#27AE60]">
            {CERT_TITLE_V1}
          </p>
        </header>

        <div
          className="relative z-[2] mt-[1.6cqw] h-px w-full shrink-0 bg-gradient-to-r from-transparent via-sky-200/55 to-transparent"
          aria-hidden
        />

        <div className="relative z-[2] flex min-h-0 flex-1 items-start gap-[2.6cqw] pt-0">
          <CardPhoto avatarUrl={avatarUrl} tier="employee" frame="v1" />

          <dl className="m-0 -mt-[1.2cqw] flex min-w-0 flex-1 flex-col justify-start gap-[0.55cqw] text-left">
            <CardField
              labelUz="Familiyasi"
              labelEn="Surname"
              value={certificate.lastName || '—'}
              mutedClass="text-[#B8C9D4]"
            />
            <CardField
              labelUz="Ismi"
              labelEn="Given name(s)"
              value={certificate.firstName || '—'}
              mutedClass="text-[#B8C9D4]"
            />
            <CardField
              labelUz="Otasining ismi"
              labelEn="Patronymic"
              value={certificate.middleName || '—'}
              mutedClass="text-[#B8C9D4]"
            />
            <CardField
              labelUz="Lavozimi"
              labelEn="Position"
              value={certificate.positionTitle || '—'}
              compact
              mutedClass="text-[#B8C9D4]"
            />
          </dl>

          <div className="relative w-[28cqw] shrink-0 self-stretch">
            <div className="absolute inset-x-0 bottom-[28.5cqw] text-right">
              <p className="m-0 whitespace-nowrap text-[1.35cqw] font-medium leading-none text-[#B8C9D4]">
                Guvohnoma raqami{' '}
                <span className="italic opacity-80">/ Certificate number</span>
              </p>
              <p className="m-0 mt-[0.3cqw] text-[3.6cqw] font-extrabold leading-none tracking-wide text-[#F2C94C]">
                {certificate.certificateNumber || '—'}
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <div className={ID_CARD_QR_BOX_CLASS}>
                <CertificateQr value={certificate.verifyUrl} />
              </div>
              <p className="m-0 mt-[0.4cqw] whitespace-nowrap text-[1.4cqw] font-medium tracking-wide text-[#B8C9D4]">
                Scan to verify
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificateCardBackV1({
  certificate,
  variant = 'flip',
}: {
  certificate: EmployeeCertificate;
  variant?: FaceVariant;
}) {
  return (
    <div
      className={clsx(FACE_BASE, faceSideClass(variant, 'back'), 'border-[#061018]')}
      style={V1_FACE_STYLE}
    >
      <CardBackdropV1 />
      <div className={clsx(FACE_INNER_V1, 'items-center justify-center')}>
        <div className="relative z-[3] h-[34cqw] w-[34cqw] overflow-hidden rounded-full">
          <img
            src="/umet-logo.jpg"
            alt=""
            className="h-full w-full scale-[1.28] object-cover"
            draggable={false}
          />
        </div>
      </div>
      <span className="absolute bottom-[3cqw] right-[3.8cqw] z-[3] text-[2.2cqw] font-semibold tracking-[0.06em] text-[#B8C9D4]">
        № {certificate.certificateNumber}
      </span>
    </div>
  );
}

function CertificateCardFrontV2({
  certificate,
  avatarUrl,
  variant = 'flip',
}: {
  certificate: EmployeeCertificate;
  avatarUrl?: string | null;
  variant?: FaceVariant;
}) {
  const tier = resolvePositionTier(certificate.positionTitle);
  const gold = isGoldTier(tier);

  return (
    <div
      className={clsx(FACE_BASE, faceSideClass(variant, 'front'))}
      style={tierFaceStyle(tier, 'front')}
    >
      <CertificateRibbons tier={tier} />

      <div
        className="absolute inset-x-0 top-0 z-[1] h-[38%] pointer-events-none [background:linear-gradient(180deg,rgba(4,16,28,0.7)_0%,rgba(4,16,28,0.3)_64%,transparent_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-x-0 bottom-0 z-[1] h-[30%] pointer-events-none [background:linear-gradient(0deg,rgba(4,16,28,0.62)_0%,rgba(4,16,28,0.24)_58%,transparent_100%)]"
        aria-hidden
      />

      <div
        className="absolute top-[1.6cqw] left-1/2 z-[3] h-[1.5cqw] w-[9cqw] -translate-x-1/2 rounded-full bg-black/45 shadow-[inset_0_1px_2px_rgba(0,0,0,0.55)]"
        aria-hidden
      />

      <UmetSeal className="absolute top-[2.8cqw] right-[3.4cqw] z-[3] w-[12cqw]" />

      <StatusStamp status={certificate.status} />

      <div className={FACE_INNER}>
        <header className="relative z-[2] shrink-0 pt-[3cqw] pr-[13cqw] text-left">
          <p
            className={clsx(
              'm-0 text-[2.95cqw] font-extrabold uppercase leading-snug tracking-tight line-clamp-2',
              gold && 'text-[var(--card-accent-2)]',
            )}
          >
            {cardTitle(certificate)}
          </p>
        </header>

        <div
          className="relative z-[2] mt-[2cqw] h-px w-full shrink-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          aria-hidden
        />

        <div className="relative z-[2] flex min-h-0 items-start gap-[3.2cqw] pt-[5.5cqw]">
          <CardPhoto avatarUrl={avatarUrl} tier={tier} />

          <dl className="m-0 flex min-w-0 flex-1 flex-col gap-[2.8cqw] text-left">
            <CardField
              labelUz="Familiyasi"
              labelEn="Surname"
              value={certificate.lastName || '—'}
            />
            <CardField
              labelUz="Ismi"
              labelEn="Given name(s)"
              value={certificate.firstName || '—'}
            />
            <CardField
              labelUz="Otasining ismi"
              labelEn="Patronymic"
              value={certificate.middleName || '—'}
            />
            <CardField
              labelUz="Lavozimi"
              labelEn="Position"
              value={certificate.positionTitle || '—'}
              compact
            />
          </dl>

          <div className="w-[30cqw] shrink-0 self-center">
            <div className="aspect-square w-full rounded-[1cqw] bg-white p-[0.9cqw] shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              <CertificateQr value={certificate.verifyUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificateCardBackV2({
  certificate,
  variant = 'flip',
}: {
  certificate: EmployeeCertificate;
  variant?: FaceVariant;
}) {
  const tier = resolvePositionTier(certificate.positionTitle);

  return (
    <div
      className={clsx(FACE_BASE, faceSideClass(variant, 'back'))}
      style={tierFaceStyle(tier, 'back')}
    >
      <CertificateRibbons tier={tier} />

      <div
        className="absolute inset-0 z-[1] pointer-events-none [background:linear-gradient(180deg,rgba(4,16,28,0.72)_0%,rgba(4,16,28,0.32)_34%,rgba(4,16,28,0.32)_66%,rgba(4,16,28,0.6)_100%)]"
        aria-hidden
      />

      <div className={clsx(FACE_INNER, 'items-center justify-center')}>
        <UmetSeal className="relative z-[3] w-[32cqw]" />
      </div>

      <span className="absolute bottom-[3cqw] right-[3.8cqw] z-[3] text-[2.2cqw] font-semibold tracking-[0.06em] text-[var(--card-muted)]">
        № {certificate.certificateNumber}
      </span>
    </div>
  );
}

function StatusStamp({ status }: { status: EmployeeCertificate['status'] }) {
  if (status === 'VALID') return null;

  const label = status === 'REVOKED' ? 'BEKOR QILINGAN' : 'MUDDATI O‘TGAN';
  const tone =
    status === 'REVOKED'
      ? 'text-red-400/85 border-red-400/70'
      : 'text-amber-300/85 border-amber-300/70';

  return (
    <div
      className="absolute inset-0 z-[4] flex items-center justify-center pointer-events-none"
      aria-hidden
    >
      <span
        className={clsx(
          'rotate-[-14deg] rounded-[1cqw] border-[0.5cqw] px-[3cqw] py-[1cqw] text-[4.4cqw] font-black tracking-[0.1em]',
          tone,
        )}
      >
        {label}
      </span>
    </div>
  );
}

function CardField({
  labelUz,
  labelEn,
  value,
  accent = false,
  compact = false,
  mutedClass,
}: {
  labelUz: string;
  labelEn: string;
  value: string;
  accent?: boolean;
  compact?: boolean;
  mutedClass?: string;
}) {
  return (
    <div className="min-w-0">
      <dt
        className={clsx(
          'm-0 text-[1.75cqw] font-medium leading-tight',
          mutedClass ?? 'text-[var(--card-muted)]',
        )}
      >
        {labelUz} <span className="italic opacity-80">/ {labelEn}</span>
      </dt>
      <dd
        className={clsx(
          'm-0 mt-[0.3cqw] font-bold leading-tight text-white break-words',
          compact ? 'text-[2.5cqw] line-clamp-2' : 'text-[3.1cqw] line-clamp-1',
          accent && 'text-[var(--card-role)]',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function CardPhoto({
  avatarUrl,
  tier,
  frame = 'v2',
}: {
  avatarUrl?: string | null;
  tier: PositionTier;
  frame?: 'v1' | 'v2';
}) {
  const wrapClass =
    frame === 'v1'
      ? clsx(
          ID_CARD_PHOTO_CLASS,
          'border-[0.45cqw] border-sky-300/90 shadow-[0_0_10px_rgba(56,189,248,0.35),0_3px_10px_rgba(0,0,0,0.4)]',
        )
      : clsx(
          ID_CARD_PHOTO_CLASS,
          'border-[0.5cqw] border-white/85 shadow-[0_3px_10px_rgba(0,0,0,0.4)]',
        );

  const src = avatarUrl ? resolveMediaUrl(avatarUrl) : '';
  const [mode, setMode] = useState<'cors' | 'plain' | 'failed'>('cors');

  useEffect(() => setMode('cors'), [src]);

  if (src && mode !== 'failed') {
    return (
      <div className={wrapClass}>
        <img
          key={mode}
          src={src}
          alt=""
          {...(mode === 'cors' ? { crossOrigin: 'anonymous' as const } : {})}
          onError={() =>
            setMode((prev) => (prev === 'cors' ? 'plain' : 'failed'))
          }
          className="absolute inset-0 h-full w-full object-cover object-[center_top]"
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        wrapClass,
        'flex items-end justify-center',
        '[background:radial-gradient(ellipse_90%_70%_at_50%_18%,rgba(255,255,255,0.16),transparent_70%),linear-gradient(165deg,rgba(255,255,255,0.12),rgba(0,0,0,0.28))]',
      )}
      aria-hidden
    >
      <PhotoSilhouette tier={tier} />
    </div>
  );
}

function PhotoSilhouette({ tier }: { tier: PositionTier }) {
  return (
    <svg
      viewBox="0 0 100 125"
      className={clsx(
        'block h-[96%] w-[88%] fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]',
        isGoldTier(tier) ? 'text-[rgba(212,175,55,0.4)]' : 'text-white/32',
      )}
      preserveAspectRatio="xMidYMax meet"
    >
      <circle cx="50" cy="42" r="22" />
      <path d="M14 125 C14 96 30 80 50 80 C70 80 86 96 86 125 Z" />
    </svg>
  );
}
