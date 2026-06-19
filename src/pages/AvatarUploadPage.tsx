import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Camera, Image as ImageIcon, RefreshCw, ScanFace, Check, X } from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from '@/hooks/useTranslation';
import mobileApi, { type UserProfile } from '@/services/api';

/**
 * Face detection — uchta yo'l, fallback bilan:
 *  1) Native FaceDetector API (Chrome/Edge/Android WebView 56+)
 *  2) Agar yo'q bo'lsa, oddiy heuristika (rasm o'lchami, oq-qora bo'lmasin)
 *  3) Server tomonida ham tekshiruvi bor — agar hasFace=false bo'lsa rad etadi
 */
async function detectFaceInImage(
  imgEl: HTMLImageElement,
): Promise<{ hasFace: boolean; confidence: number; bbox?: DOMRect }> {
  // 1) Native FaceDetector
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FaceDetector = (window as any).FaceDetector;
  if (FaceDetector) {
    try {
      const det = new FaceDetector({ fastMode: true });
      const faces = await det.detect(imgEl);
      if (faces && faces.length > 0) {
        return {
          hasFace: true,
          confidence: 0.9,
          bbox: faces[0].boundingBox,
        };
      }
      return { hasFace: false, confidence: 0 };
    } catch {
      /* fall through to heuristic */
    }
  }

  // 2) Heuristika — rasm hech qachon to'liq monotonna bo'lmasin
  const canvas = document.createElement('canvas');
  const w = (canvas.width = 64);
  const h = (canvas.height = 64);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { hasFace: false, confidence: 0 };
  ctx.drawImage(imgEl, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  let r = 0,
    g = 0,
    b = 0,
    n = 0,
    minL = 255,
    maxL = 0;
  for (let i = 0; i < data.length; i += 4) {
    const R = data[i],
      G = data[i + 1],
      B = data[i + 2];
    r += R;
    g += G;
    b += B;
    n += 1;
    const L = 0.299 * R + 0.587 * G + 0.114 * B;
    if (L < minL) minL = L;
    if (L > maxL) maxL = L;
  }
  const avgR = r / n,
    avgG = g / n,
    avgB = b / n;
  const contrast = maxL - minL;
  // Yumshoq teri tonidan ko'rsatkich (heuristik, aniq emas)
  const skinish =
    avgR > 95 &&
    avgG > 40 &&
    avgB > 20 &&
    avgR > avgB &&
    Math.abs(avgR - avgG) > 5 &&
    contrast > 30;
  // Server ham tekshiradi; bu yerda umumiy "rasm" emasligini ham tekshiramiz
  return {
    hasFace: skinish,
    confidence: skinish ? 0.55 : 0.15,
  };
}

function cacheUser(user: UserProfile) {
  localStorage.setItem('user', JSON.stringify(user));
}

export default function AvatarUploadPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [detecting, setDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<{
    hasFace: boolean;
    confidence: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Faylni ochish va URL yaratish
  const handlePick = (file: File) => {
    setError(null);
    setDetectResult(null);
    const url = URL.createObjectURL(file);
    setSourceUrl(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  const onImgLoad = async () => {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setDetecting(true);
    try {
      const r = await detectFaceInImage(img);
      setDetectResult(r);
    } finally {
      setDetecting(false);
    }
  };

  // Drag (touch + mouse)
  const dragRef = useRef<{
    active: boolean;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  }>({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      active: true,
      sx: e.clientX,
      sy: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.sx),
      y: dragRef.current.oy + (e.clientY - dragRef.current.sy),
    });
  };
  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const getCroppedBlob = async (): Promise<Blob | null> => {
    const img = imgRef.current;
    const box = cropContainerRef.current;
    if (!img || !box) return null;

    const cropSize = box.clientWidth; // kvadrat
    const out = document.createElement('canvas');
    out.width = 512;
    out.height = 512;
    const ctx = out.getContext('2d');
    if (!ctx) return null;

    // Rasmni ko'rsatish o'lchami (object-fit: cover)
    const baseScale = Math.max(
      cropSize / img.naturalWidth,
      cropSize / img.naturalHeight,
    );
    const renderScale = baseScale * zoom;
    const renderW = img.naturalWidth * renderScale;
    const renderH = img.naturalHeight * renderScale;
    const left = (cropSize - renderW) / 2 + offset.x;
    const top = (cropSize - renderH) / 2 + offset.y;

    // Crop oynasi ichidagi qaysi piksellar ko'rinmoqda — uni hisoblab,
    // 512x512 ga chizamiz
    const srcX = (-left / renderScale);
    const srcY = (-top / renderScale);
    const srcW = cropSize / renderScale;
    const srcH = cropSize / renderScale;

    ctx.drawImage(
      img,
      Math.max(0, srcX),
      Math.max(0, srcY),
      Math.min(srcW, img.naturalWidth - Math.max(0, srcX)),
      Math.min(srcH, img.naturalHeight - Math.max(0, srcY)),
      0,
      0,
      512,
      512,
    );

    return new Promise((resolve) => {
      out.toBlob((b) => resolve(b), 'image/jpeg', 0.9);
    });
  };

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!detectResult?.hasFace) {
        throw new Error(
          t({
            uz: 'Rasmda yuz aniqlanmadi. Iltimos, yuzingiz ko`rinadigan boshqa rasm yuklang.',
            en: 'No face detected. Please pick another photo where your face is visible.',
            ru: 'Лицо не обнаружено. Загрузите другое фото, где лицо видно.',
          }),
        );
      }
      const blob = await getCroppedBlob();
      if (!blob) throw new Error('Crop xato');
      const res = await mobileApi.uploadMyAvatar(blob, {
        hasFace: true,
        faceConfidence: detectResult.confidence,
      });
      // /auth/me'ni yangilab cache'ga yozamiz
      try {
        const fresh = await mobileApi.me();
        cacheUser(fresh);
      } catch {
        const cached = localStorage.getItem('user');
        if (cached) {
          try {
            const u = JSON.parse(cached) as UserProfile;
            u.avatarUrl = res.avatarUrl;
            cacheUser(u);
          } catch {
            /* ignore */
          }
        }
      }
      return res;
    },
    onSuccess: () => {
      navigate('/learn', { replace: true });
    },
    onError: (e: unknown) => {
      const msg =
        (e && typeof e === 'object' && 'response' in e
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (e as any).response?.data?.message
          : null) ?? (e instanceof Error ? e.message : null);
      setError(
        typeof msg === 'string'
          ? msg
          : t({
              uz: 'Avatar saqlanmadi',
              en: 'Avatar not saved',
              ru: 'Аватар не сохранён',
            }),
      );
    },
  });

  const onChangeFile = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const f = e.target.files?.[0];
    if (f) handlePick(f);
    e.target.value = '';
  };

  const showCrop = sourceUrl !== null;

  return (
    <div className="relative min-h-dvh bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0a0a] dark:from-black dark:to-slate-950">
      {/* Glow */}
      <div
        className="pointer-events-none absolute -top-32 -right-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
      />

      <motion.div
        className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-safe-6 pb-safe pt-safe-16"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 text-white">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
            <ScanFace size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {t({
                uz: 'Profil rasmingiz',
                en: 'Profile photo',
                ru: 'Фото профиля',
              })}
            </h1>
            <p className="mt-0.5 text-xs text-slate-300">
              {t({
                uz: 'Yuzingiz aniq ko`rinadigan rasm yuklang',
                en: 'Upload a clear photo of your face',
                ru: 'Загрузите чёткое фото с лицом',
              })}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
          {error && (
            <p className="mb-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <X size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {showCrop ? (
            <>
              <div
                ref={cropContainerRef}
                className="relative mx-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-full border-4 border-blue-500/40 bg-black select-none touch-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <img
                  ref={imgRef}
                  src={sourceUrl}
                  alt="crop"
                  onLoad={onImgLoad}
                  draggable={false}
                  className="pointer-events-none absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: `${naturalSize.w * zoom}px`,
                    height: 'auto',
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  }}
                />
                {/* Crop ring overlay */}
                <div className="pointer-events-none absolute inset-0 ring-2 ring-white/30" />
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Zoom
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1"
                />
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                {detecting ? (
                  <span className="flex items-center gap-2 text-slate-500">
                    <RefreshCw size={14} className="animate-spin" />
                    {t({
                      uz: 'Yuz tekshirilmoqda...',
                      en: 'Detecting face...',
                      ru: 'Поиск лица...',
                    })}
                  </span>
                ) : detectResult?.hasFace ? (
                  <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <Check size={14} />
                    {t({
                      uz: 'Yuz aniqlandi',
                      en: 'Face detected',
                      ru: 'Лицо найдено',
                    })}
                  </span>
                ) : detectResult ? (
                  <span className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <X size={14} />
                    {t({
                      uz: 'Yuz topilmadi — boshqa rasm tanlang',
                      en: 'No face found — try another photo',
                      ru: 'Лицо не найдено — выберите другое фото',
                    })}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSourceUrl(null);
                    setDetectResult(null);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 active:scale-[0.98] dark:border-slate-600 dark:text-slate-200"
                >
                  {t({
                    uz: 'Boshqa rasm',
                    en: 'Pick another',
                    ru: 'Другое фото',
                  })}
                </button>
                <button
                  onClick={() => uploadMut.mutate()}
                  disabled={
                    uploadMut.isPending ||
                    detecting ||
                    !detectResult?.hasFace
                  }
                  className={clsx(
                    'rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg active:scale-[0.98]',
                    (uploadMut.isPending ||
                      detecting ||
                      !detectResult?.hasFace) &&
                      'opacity-60',
                  )}
                >
                  {uploadMut.isPending
                    ? '…'
                    : t({
                        uz: 'Saqlash',
                        en: 'Save',
                        ru: 'Сохранить',
                      })}
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg active:scale-[0.98]"
              >
                <Camera size={28} />
                <span className="text-sm font-semibold">
                  {t({
                    uz: 'Kamera',
                    en: 'Camera',
                    ru: 'Камера',
                  })}
                </span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 p-6 text-slate-700 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <ImageIcon size={28} />
                <span className="text-sm font-semibold">
                  {t({
                    uz: 'Galereya',
                    en: 'Gallery',
                    ru: 'Галерея',
                  })}
                </span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onChangeFile}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={onChangeFile}
            className="hidden"
          />
        </div>

        <p className="text-center text-[11px] text-slate-400">
          {t({
            uz: 'Yuzingiz aniqlanmaguncha avatar saqlanmaydi',
            en: 'Avatar saves only when your face is detected',
            ru: 'Аватар сохраняется только при наличии лица',
          })}
        </p>
      </motion.div>
    </div>
  );
}
